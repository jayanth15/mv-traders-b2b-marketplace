from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, get_session, engine
from models import User, Organization, UserRole, OrganizationType
from auth import get_password_hash
from routers import (
    auth, users, organizations, products, units, 
    orders, order_items, invoices, documents, pricing
)
from sqlalchemy import text as sa_text
from models import OrderItem

# Create FastAPI app
app = FastAPI(
    title="MV Traders B2B Marketplace API",
    description="A B2B marketplace API with role-based access control",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(organizations.router)
app.include_router(products.router)
app.include_router(units.router)
app.include_router(orders.router)
app.include_router(order_items.router)
app.include_router(invoices.router)
app.include_router(documents.router)
app.include_router(pricing.router)

@app.on_event("startup")
def on_startup():
    """Initialize database and create default AppOwner"""
    create_db_and_tables()
    
    # Create default AppOwner organization
    with Session(engine) as session:
        # Check if AppOwner organization exists
        app_owner_org = session.exec(select(Organization).where(
            Organization.organization_type == OrganizationType.APP_OWNER
        )).first()
        
        if not app_owner_org:
            # Create AppOwner organization
            app_owner_org = Organization(
                name="MV Traders App Owner",
                description="Default App Owner Organization",
                organization_type=OrganizationType.APP_OWNER
            )
            session.add(app_owner_org)
            session.commit()
            session.refresh(app_owner_org)
        
        # Check if default AppOwner user exists
        default_user = session.exec(select(User).where(
            User.phone_number == "9999999999"
        )).first()
        
        if not default_user:
            # Create default AppOwner user
            default_user = User(
                full_name="App Owner",
                phone_number="9999999999",  # Default phone number
                password_hash=get_password_hash("admin123"),  # Default password
                role=UserRole.APP_ADMIN,
                organization_id=app_owner_org.id,
                organization_type=OrganizationType.APP_OWNER
            )
            session.add(default_user)
            session.commit()
            
            print("Default AppOwner created:")
            print("Phone: 9999999999")
            print("Password: admin123")

        # Auto-heal: ensure new pricing columns exist on orderitem (SQLite lacks migrations here)
        try:
            # Quick pragma table_info to inspect columns
            cols = session.exec(sa_text('PRAGMA table_info(orderitem)')).all()
            col_names = {c[1] for c in cols}
            alters = []
            pending = {
                'quantity': 'INTEGER DEFAULT 1',
                'zone_code': 'TEXT',
                'calculated_unit_price': 'REAL',
                'final_unit_price': 'REAL',
                'pricing_source': 'TEXT'
            }
            for name, ddl in pending.items():
                if name not in col_names:
                    alters.append(f'ALTER TABLE orderitem ADD COLUMN {name} {ddl}')
            for stmt in alters:
                try:
                    session.exec(sa_text(stmt))
                except Exception:
                    session.rollback()
            if alters:
                session.commit()
            # Backfill null final_unit_price with existing item_price where present
            session.exec(sa_text('UPDATE orderitem SET final_unit_price = item_price WHERE final_unit_price IS NULL'))
            session.exec(sa_text('UPDATE orderitem SET calculated_unit_price = item_price WHERE calculated_unit_price IS NULL'))
            session.exec(sa_text("UPDATE orderitem SET pricing_source = 'Auto' WHERE pricing_source IS NULL"))
            session.commit()
        except Exception as e:
            session.rollback()
            print('Pricing auto-heal failed:', e)

        # Auto-heal: ensure orderitemhistory has pricing change columns (old_price, new_price, price_change_reason)
        try:
            hist_cols = session.exec(sa_text('PRAGMA table_info(orderitemhistory)')).all()
            hist_col_names = {c[1] for c in hist_cols}
            hist_alters = []
            history_pending = {
                'old_price': 'REAL',
                'new_price': 'REAL',
                'price_change_reason': 'TEXT'
            }
            for name, ddl in history_pending.items():
                if name not in hist_col_names:
                    hist_alters.append(f'ALTER TABLE orderitemhistory ADD COLUMN {name} {ddl}')
            for stmt in hist_alters:
                try:
                    session.exec(sa_text(stmt))
                except Exception:
                    session.rollback()
            if hist_alters:
                session.commit()
        except Exception as e:
            session.rollback()
            print('OrderItemHistory auto-heal failed:', e)

@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to MV Traders B2B Marketplace API",
        "version": "1.0.0",
        "docs": "/docs",
        "default_login": {
            "phone_number": "9999999999",
            "password": "admin123",
            "note": "Default AppOwner credentials"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
