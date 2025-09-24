from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Invoice, InvoiceCreate, InvoiceRead, User, UserRole, OrganizationType
from dependencies import get_current_user, require_super_admin_or_admin

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("/", response_model=List[InvoiceRead])
def read_invoices(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Get invoices for current organization (only SuperAdmin/Admin)"""
    # Only show invoices related to current user's organization
    from models import Order
    if current_user.organization_type == OrganizationType.COMPANY:
        # Company sees invoices for orders they placed
        invoices = session.exec(
            select(Invoice)
            .join(Order, Invoice.order_id == Order.order_id)
            .where(Order.placed_by_org_id == current_user.organization_id)
            .offset(skip)
            .limit(limit)
        ).all()
    else:
        # Vendors see invoices for orders containing their products
        from models import OrderItem, Product
        invoices = session.exec(
            select(Invoice)
            .join(Order, Invoice.order_id == Order.order_id)
            .join(OrderItem, Order.order_id == OrderItem.order_id)
            .join(Product, Product.product_id == OrderItem.product_id)
            .where(Product.vendor_id == current_user.organization_id)
            .distinct()
            .offset(skip)
            .limit(limit)
        ).all()
    
    return invoices

@router.get("/{invoice_id}", response_model=InvoiceRead)
def read_invoice(
    invoice_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Get invoice by ID (only SuperAdmin/Admin of same organization)"""
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check if user has access to this invoice
    from models import Order
    order = session.get(Order, invoice.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if current_user.organization_type == OrganizationType.COMPANY:
        if order.placed_by_org_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Invoice not from your organization"
            )
    elif current_user.organization_type == OrganizationType.VENDOR:
        # Check if vendor has products in this order
        from models import OrderItem, Product
        vendor_has_items = session.exec(
            select(OrderItem)
            .join(Product, Product.product_id == OrderItem.product_id)
            .where(OrderItem.order_id == order.order_id)
            .where(Product.vendor_id == current_user.organization_id)
        ).first()
        
        if not vendor_has_items:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Invoice not related to your products"
            )
    
    return invoice

@router.post("/", response_model=InvoiceRead)
def create_invoice(
    invoice_data: InvoiceCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Create a new invoice (only SuperAdmin/Admin)"""
    db_invoice = Invoice(
        **invoice_data.dict(),
        created_by_user_id=current_user.user_id
    )
    
    session.add(db_invoice)
    session.commit()
    session.refresh(db_invoice)
    return db_invoice

@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Delete invoice (only SuperAdmin/Admin)"""
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    session.delete(invoice)
    session.commit()
    return {"message": "Invoice deleted successfully"}
