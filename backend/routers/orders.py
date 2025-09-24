from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import (
    Order, OrderCreate, OrderRead, OrderItem, OrderItemCreate, OrderItemRead,
    OrderApproval, OrderApprovalCreate, OrderApprovalRead, User, UserRole, 
    OrganizationType, OrderStatus, ApprovalStatus
)
from dependencies import get_current_user, require_super_admin_or_admin

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("/", response_model=List[OrderRead])
def read_orders(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all orders (filtered by organization)"""
    if current_user.organization_type == OrganizationType.COMPANY:
        # Companies see orders they placed
        orders = session.exec(
            select(Order)
            .where(Order.placed_by_org_id == current_user.organization_id)
            .offset(skip)
            .limit(limit)
        ).all()
    else:
        # Vendors see only orders that contain their products
        from models import OrderItem, Product
        from sqlalchemy.exc import OperationalError
        from sqlalchemy import text as sa_text
        vendor_orders_query = (
            select(Order)
            .join(OrderItem, Order.order_id == OrderItem.order_id)
            .join(Product, Product.product_id == OrderItem.product_id)
            .where(Product.vendor_id == current_user.organization_id)
            .distinct()
            .offset(skip)
            .limit(limit)
        )
        try:
            orders = session.exec(vendor_orders_query).all()
        except OperationalError as e:
            # Auto-heal schema if product_id column is missing on orderitem (legacy DBs)
            if 'no such column: orderitem.product_id' in str(e).lower():
                try:
                    session.exec(sa_text('ALTER TABLE orderitem ADD COLUMN product_id INTEGER'))
                    session.commit()
                except Exception:
                    session.rollback()
                # After adding column, return empty until data is populated
                return []
            raise
    
    return orders

@router.get("/{order_id}", response_model=OrderRead)
def read_order(
    order_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get order by ID"""
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check access permissions
    if current_user.organization_type == OrganizationType.COMPANY:
        if order.placed_by_org_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot view other company's orders"
            )
    elif current_user.organization_type == OrganizationType.VENDOR:
        # Vendors can only see orders containing their products
        from models import OrderItem, Product
        vendor_has_items = session.exec(
            select(OrderItem)
            .join(Product, Product.product_id == OrderItem.product_id)
            .where(OrderItem.order_id == order_id)
            .where(Product.vendor_id == current_user.organization_id)
        ).first()
        
        if not vendor_has_items:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Order does not contain your products"
            )
    
    return order

@router.post("/", response_model=OrderRead)
def create_order(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new order"""
    if current_user.organization_type != OrganizationType.COMPANY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only companies can place orders"
        )
    
    # Check if user can place orders directly
    if current_user.role == UserRole.USER:
        # Users need approval - create order approval request
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Users must request order approval first"
        )
    
    # SuperAdmin and Admin can place orders directly
    db_order = Order(
        placed_by_user_id=current_user.user_id,
        placed_by_org_id=current_user.organization_id,
        status=OrderStatus.REQUESTED
    )
    
    session.add(db_order)
    session.commit()
    session.refresh(db_order)
    return db_order

@router.post("/request-approval", response_model=OrderApprovalRead)
def request_order_approval(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Request order approval (for Users)"""
    if current_user.role != UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Users need to request approval"
        )
    
    # Create order first
    db_order = Order(
        placed_by_user_id=current_user.user_id,
        placed_by_org_id=current_user.organization_id,
        status=OrderStatus.REQUESTED
    )
    
    session.add(db_order)
    session.commit()
    session.refresh(db_order)
    
    # Create approval request
    approval = OrderApproval(
        order_id=db_order.order_id,
        requested_by_user_id=current_user.user_id,
        status=ApprovalStatus.PENDING
    )
    
    session.add(approval)
    session.commit()
    session.refresh(approval)
    
    return approval

@router.put("/{order_id}/approve")
def approve_order(
    order_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Approve order"""
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if order belongs to same organization
    if order.placed_by_org_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot approve other organization's orders"
        )
    
    # Update order status
    order.status = OrderStatus.APPROVED
    order.approved_by_user_id = current_user.user_id
    
    # Update approval record if exists
    approval = session.exec(
        select(OrderApproval).where(OrderApproval.order_id == order_id)
    ).first()
    
    if approval:
        approval.status = ApprovalStatus.APPROVED
        approval.approved_by_user_id = current_user.user_id
        session.add(approval)
    
    session.add(order)
    session.commit()
    
    return {"message": "Order approved successfully"}

@router.put("/{order_id}/accept")
def accept_order(
    order_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Accept order (vendor side)"""
    if current_user.organization_type != OrganizationType.VENDOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors can accept orders"
        )
    
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != OrderStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must be approved before accepting"
        )
    
    order.status = OrderStatus.ACCEPTED
    order.accepted_by_user_id = current_user.user_id
    
    session.add(order)
    session.commit()
    
    return {"message": "Order accepted successfully"}

@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    status: OrderStatus,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update order status"""
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check permissions based on organization type
    if current_user.organization_type == OrganizationType.COMPANY:
        if order.placed_by_org_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    order.status = status
    session.add(order)
    session.commit()
    
    return {"message": "Order status updated successfully"}
