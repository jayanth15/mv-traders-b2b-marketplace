from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import (
    OrderItem, OrderItemCreate, OrderItemRead, OrderItemHistory,
    OrderItemHistoryCreate, OrderItemHistoryRead, User, UserRole,
    OrganizationType, ItemStatus, Product, OrderItemCreateRequest
)
from pricing_engine import compute_price
from dependencies import get_current_user

router = APIRouter(prefix="/order-items", tags=["Order Items"])

@router.get("/", response_model=List[OrderItemRead])
def read_order_items(
    order_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get order items with org-based filtering"""
    query = select(OrderItem)
    if order_id:
        query = query.where(OrderItem.order_id == order_id)
    order_items = session.exec(query.offset(skip).limit(limit)).all()

    # Company: only their orders' items
    if current_user.organization_type == OrganizationType.COMPANY:
        from models import Order as OrderModel
        company_order_ids = session.exec(
            select(OrderModel.order_id).where(OrderModel.placed_by_org_id == current_user.organization_id)
        ).all()
        company_order_ids_set = {oid[0] if isinstance(oid, tuple) else oid for oid in company_order_ids}
        order_items = [it for it in order_items if it.order_id in company_order_ids_set]

    # Vendor: only items for products that belong to vendor
    if current_user.organization_type == OrganizationType.VENDOR:
        product_ids = {it.product_id for it in order_items}
        if product_ids:
            products = session.exec(select(Product).where(Product.product_id.in_(product_ids))).all()
            allowed = {p.product_id for p in products if p.vendor_id == current_user.organization_id}
            order_items = [it for it in order_items if it.product_id in allowed]

    # Hide price info for vendor basic users
    if (current_user.organization_type == OrganizationType.VENDOR and current_user.role == UserRole.USER):
        sanitized = []
        for it in order_items:
            d = it.dict()
            d['item_price'] = None
            d['final_unit_price'] = None
            d['calculated_unit_price'] = None
            sanitized.append(d)
        return sanitized

    return order_items

@router.get("/{order_item_id}", response_model=OrderItemRead)
def read_order_item(
    order_item_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get order item by ID"""
    order_item = session.get(OrderItem, order_item_id)
    if not order_item:
        raise HTTPException(status_code=404, detail="Order item not found")
    
    # Hide price for vendor users
    if (current_user.organization_type == OrganizationType.VENDOR and 
        current_user.role == UserRole.USER):
        order_item_dict = order_item.dict()
        order_item_dict['item_price'] = None
        return order_item_dict
    
    return order_item

@router.post("/", response_model=OrderItemRead)
def create_order_item(
    order_item_data: OrderItemCreateRequest,
    quantity: int = 1,
    zone_code: str | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new order item (Company side). Applies pricing rules automatically."""
    if current_user.organization_type != OrganizationType.COMPANY:
        raise HTTPException(status_code=403, detail="Only companies add order items")
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only SuperAdmin or Admin can create order items")

    product = session.get(Product, order_item_data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        pricing = compute_price(session, product_id=order_item_data.product_id, quantity=quantity, zone_code=zone_code)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    db_order_item = OrderItem(
        order_id=order_item_data.order_id,
        product_id=order_item_data.product_id,
        item_name=order_item_data.item_name or product.product_name,
        item_status=ItemStatus.ACCEPTED,
        quantity=quantity,
        zone_code=zone_code,
        calculated_unit_price=pricing['unit_price'],
        final_unit_price=pricing['unit_price'],
        pricing_source=pricing['pricing_source'],
        item_price=pricing['unit_price']
    )
    session.add(db_order_item)
    session.commit()
    session.refresh(db_order_item)

    history = OrderItemHistory(
        order_item_id=db_order_item.order_item_id,
        status=db_order_item.item_status,
        old_price=None,
        new_price=db_order_item.final_unit_price,
        price_change_reason="Initial auto pricing"
    )
    session.add(history)
    session.commit()
    return db_order_item

@router.put("/{order_item_id}/override-price", response_model=OrderItemRead)
def override_price(
    order_item_id: int,
    new_price: float,
    reason: str | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Vendor SuperAdmin/Admin can override final price."""
    if current_user.organization_type != OrganizationType.VENDOR:
        raise HTTPException(status_code=403, detail="Only vendors can override pricing")
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only SuperAdmin/Admin can override price")
    if new_price < 0:
        raise HTTPException(status_code=400, detail="Price cannot be negative")

    order_item = session.get(OrderItem, order_item_id)
    if not order_item:
        raise HTTPException(status_code=404, detail="Order item not found")

    old = order_item.final_unit_price or order_item.item_price
    order_item.final_unit_price = new_price
    order_item.pricing_source = 'ManualOverride'
    order_item.item_price = new_price  # maintain legacy consumption
    session.add(order_item)
    session.commit()

    hist = OrderItemHistory(
        order_item_id=order_item_id,
        status=order_item.item_status,
        old_price=old,
        new_price=new_price,
        price_change_reason=reason or 'Manual override'
    )
    session.add(hist)
    session.commit()
    session.refresh(order_item)
    return order_item

@router.put("/{order_item_id}/status")
def update_order_item_status(
    order_item_id: int,
    new_status: ItemStatus,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update order item status"""
    order_item = session.get(OrderItem, order_item_id)
    if not order_item:
        raise HTTPException(status_code=404, detail="Order item not found")
    
    # Vendors can update item status
    if current_user.organization_type == OrganizationType.VENDOR:
        # Vendor users can accept/work on orders but with restrictions
        old_status = order_item.item_status
        order_item.item_status = new_status
        
        # Create history record
        history = OrderItemHistory(
            order_item_id=order_item_id,
            status=new_status
        )
        
        session.add(order_item)
        session.add(history)
        session.commit()
        
        return {"message": f"Order item status updated from {old_status} to {new_status}"}
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied"
    )

@router.get("/{order_item_id}/history", response_model=List[OrderItemHistoryRead])
def read_order_item_history(
    order_item_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get order item history"""
    history = session.exec(
        select(OrderItemHistory)
        .where(OrderItemHistory.order_item_id == order_item_id)
        .order_by(OrderItemHistory.created_at.desc())
    ).all()
    
    return history
