from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Document, DocumentCreate, DocumentRead, User, UserRole, OrganizationType
from dependencies import get_current_user, require_super_admin_or_admin

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/", response_model=List[DocumentRead])
def read_documents(
    order_id: int = None,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Get documents for current organization (only SuperAdmin/Admin)"""
    from models import Order, OrderItem, Product
    
    if current_user.organization_type == OrganizationType.COMPANY:
        # Company sees documents for orders they placed
        query = (
            select(Document)
            .join(Order, Document.order_id == Order.order_id)
            .where(Order.placed_by_org_id == current_user.organization_id)
        )
    else:
        # Vendors see documents for orders containing their products
        query = (
            select(Document)
            .join(Order, Document.order_id == Order.order_id)
            .join(OrderItem, Order.order_id == OrderItem.order_id)
            .join(Product, Product.product_id == OrderItem.product_id)
            .where(Product.vendor_id == current_user.organization_id)
            .distinct()
        )
    
    if order_id:
        query = query.where(Document.order_id == order_id)
        
    documents = session.exec(query.offset(skip).limit(limit)).all()
    return documents

@router.get("/{document_id}", response_model=DocumentRead)
def read_document(
    document_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Get document by ID (only SuperAdmin/Admin of same organization)"""
    document = session.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if user has access to this document
    from models import Order, OrderItem, Product
    order = session.get(Order, document.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if current_user.organization_type == OrganizationType.COMPANY:
        if order.placed_by_org_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Document not from your organization"
            )
    elif current_user.organization_type == OrganizationType.VENDOR:
        # Check if vendor has products in this order
        vendor_has_items = session.exec(
            select(OrderItem)
            .join(Product, Product.product_id == OrderItem.product_id)
            .where(OrderItem.order_id == order.order_id)
            .where(Product.vendor_id == current_user.organization_id)
        ).first()
        
        if not vendor_has_items:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Document not related to your products"
            )
    
    return document

@router.post("/", response_model=DocumentRead)
def create_document(
    document_data: DocumentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Upload a new document (only SuperAdmin/Admin)"""
    db_document = Document(
        **document_data.dict(),
        uploaded_by_user_id=current_user.user_id
    )
    
    session.add(db_document)
    session.commit()
    session.refresh(db_document)
    return db_document

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Delete document (only SuperAdmin/Admin)"""
    document = session.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    session.delete(document)
    session.commit()
    return {"message": "Document deleted successfully"}
