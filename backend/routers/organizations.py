from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Dict, Any
from database import get_session
from models import Organization, OrganizationCreate, OrganizationRead, User, UserCreate, OrganizationCreateResponse, AdminUserResponse
from dependencies import require_app_owner, require_company_or_app_owner
from auth import get_password_hash
import secrets
import string

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.put("/{organization_id}/admin-phone")
def update_admin_phone(
    organization_id: int,
    new_phone: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_app_owner)
):
    """Update the admin user's phone number for an organization"""
    # Find the organization
    organization = session.get(Organization, organization_id)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Find the SuperAdmin user for this organization
    admin_user = session.exec(
        select(User).where(
            User.organization_id == organization_id,
            User.role == "SuperAdmin"
        )
    ).first()
    
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found for this organization")
    
    # Check if phone number is already in use
    existing_user = session.exec(select(User).where(User.phone_number == new_phone)).first()
    if existing_user and existing_user.user_id != admin_user.user_id:
        raise HTTPException(status_code=400, detail="Phone number already in use")
    
    # Update the phone number
    admin_user.phone_number = new_phone
    session.add(admin_user)
    session.commit()
    session.refresh(admin_user)
    
    return {"detail": "Admin phone number updated successfully", "phone_number": new_phone}

@router.get("/", response_model=List[OrganizationRead])
def read_organizations(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_app_owner)
):
    """Get all organizations (only AppOwner)"""
    organizations = session.exec(select(Organization).offset(skip).limit(limit)).all()
    return organizations

@router.get("/vendors", response_model=List[OrganizationRead])
def read_vendor_organizations(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_company_or_app_owner)
):
    """Get vendor organizations (Company or AppOwner)"""
    query = select(Organization).where(Organization.organization_type == "Vendor").offset(skip).limit(limit)
    vendors = session.exec(query).all()
    return vendors

@router.get("/{organization_id}", response_model=OrganizationRead)
def read_organization(
    organization_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_app_owner)
):
    """Get organization by ID (only AppOwner)"""
    organization = session.get(Organization, organization_id)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization

@router.post("/", response_model=OrganizationCreateResponse)
def create_organization(
    organization_data: OrganizationCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_app_owner)
):
    """Create a new organization with SuperAdmin user (only AppOwner) with minimal lock contention and atomic commit."""
    from sqlalchemy import text
    from sqlalchemy.exc import IntegrityError, OperationalError
    from sqlmodel import Session as SQLModelSession
    from database import engine

    # Generate values and pre-check for duplicate phone to avoid unnecessary write
    temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    admin_name = organization_data.admin_name or f"{organization_data.name} Admin"
    admin_phone = organization_data.admin_phone or None

    if admin_phone:
        existing = session.exec(select(User).where(User.phone_number == admin_phone)).first()
        if existing:
            raise HTTPException(status_code=400, detail="A user with this phone number already exists.")

    # Create both organization and its SuperAdmin in a single short-lived transaction
    try:
        with SQLModelSession(engine) as s:
            # Start an IMMEDIATE transaction to acquire write lock promptly
            s.exec(text("BEGIN IMMEDIATE"))

            # Create organization
            db_org = Organization(**organization_data.dict())
            s.add(db_org)
            s.flush()  # assigns id

            # Ensure we have a phone to set (fallback to unique temp if none provided)
            phone_to_use = admin_phone or f"{db_org.id}temp"

            # Create SuperAdmin
            db_user = User(
                phone_number=phone_to_use,
                full_name=admin_name,
                password_hash=get_password_hash(temp_password),
                role="SuperAdmin",
                organization_id=db_org.id,
                organization_type=db_org.organization_type,
            )
            s.add(db_user)

            s.commit()
            # refresh after commit for response
            s.refresh(db_org)
            s.refresh(db_user)

            return OrganizationCreateResponse(
                organization=OrganizationRead.from_orm(db_org),
                admin_user=AdminUserResponse(
                    id=db_user.user_id,
                    phone_number=db_user.phone_number,
                    full_name=db_user.full_name,
                    role=db_user.role,
                    temporary_password=temp_password,
                ),
            )
    except IntegrityError as e:
        # Likely a unique constraint (e.g., phone)
        if "user.phone_number" in str(e):
            raise HTTPException(status_code=400, detail="A user with this phone number already exists. Organization was not created.")
        raise HTTPException(status_code=500, detail="Failed to create organization due to a database constraint error.")
    except OperationalError as e:
        if "locked" in str(e).lower():
            raise HTTPException(status_code=503, detail="Database is busy. Please retry shortly.")
        raise HTTPException(status_code=500, detail="Database operational error during creation.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during creation: {str(e)}")

@router.put("/{organization_id}", response_model=OrganizationRead)
def update_organization(
    organization_id: int,
    organization_data: OrganizationCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_app_owner)
):
    """Update organization (only AppOwner)"""
    organization = session.get(Organization, organization_id)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    organization_data_dict = organization_data.dict()
    for field, value in organization_data_dict.items():
        setattr(organization, field, value)
    
    session.add(organization)
    session.commit()
    session.refresh(organization)
    return organization

@router.delete("/{organization_id}")
def delete_organization(
    organization_id: int,
    current_user: User = Depends(require_app_owner),
    outer_session: Session = Depends(get_session),
):
    """Delete organization (only AppOwner) with minimal lock contention."""
    import time
    from sqlalchemy import text
    from sqlalchemy.exc import OperationalError
    from database import engine
    from sqlmodel import Session as SQLModelSession

    # Verify organization exists using the outer read-only session
    organization = outer_session.get(Organization, organization_id)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Use a short-lived, fresh session bound to the same engine
            with SQLModelSession(engine) as s:
                # Reduce writer lock windows with an IMMEDIATE transaction
                s.exec(text("BEGIN IMMEDIATE"))

                # Delete related users then the org via raw SQL to avoid ORM overhead
                s.exec(text("DELETE FROM user WHERE organization_id = :oid").bindparams(oid=organization_id))
                s.exec(text("DELETE FROM organization WHERE id = :oid").bindparams(oid=organization_id))
                s.commit()
                return {"message": "Organization deleted successfully"}
        except OperationalError as e:
            # Database locked; backoff and retry
            if "locked" in str(e).lower() and attempt < max_retries - 1:
                time.sleep(0.2 * (attempt + 1))
                continue
            raise HTTPException(status_code=503, detail="Database is busy. Please retry shortly.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
