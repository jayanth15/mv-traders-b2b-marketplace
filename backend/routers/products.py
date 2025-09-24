from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Product, ProductCreate, ProductRead, User, OrganizationType, ProductCreateInput, ProductUpdateInput, Unit
from dependencies import get_current_user, require_super_admin_or_admin

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=List[ProductRead])
def read_products(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all products (filtered by vendor for vendors)"""
    if current_user.organization_type == OrganizationType.VENDOR:
        # Vendors can only see their own products
        products = session.exec(
            select(Product)
            .where(Product.vendor_id == current_user.organization_id)
            .offset(skip)
            .limit(limit)
        ).all()
    else:
        # Companies can see all products
        products = session.exec(select(Product).offset(skip).limit(limit)).all()
    
    return products

@router.get("/{product_id}", response_model=ProductRead)
def read_product(
    product_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get product by ID"""
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Vendors can only see their own products
    if (current_user.organization_type == OrganizationType.VENDOR and 
        product.vendor_id != current_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot view other vendor's products"
        )
    
    return product

@router.post("/", response_model=ProductRead)
def create_product(
    product_data: ProductCreateInput,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Create a new product (only vendor SuperAdmin/Admin)"""
    if current_user.organization_type != OrganizationType.VENDOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors can create products"
        )
    
    # Validate the unit belongs to this vendor
    unit = session.get(Unit, product_data.unit_id)
    if not unit or unit.vendor_id != current_user.organization_id:
        raise HTTPException(status_code=400, detail="Invalid unit selection")

    db_product = Product(
        product_name=product_data.product_name,
        product_description=product_data.product_description,
        price=product_data.price,
        unit_id=product_data.unit_id,
        vendor_id=current_user.organization_id,
    )
    session.add(db_product)
    session.commit()
    session.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    product_data: ProductUpdateInput,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Update product (only vendor SuperAdmin/Admin)"""
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if product belongs to current user's vendor
    if product.vendor_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot update other vendor's products"
        )
    
    update_data = product_data.dict(exclude_unset=True)

    # If unit change requested validate new unit
    if 'unit_id' in update_data:
        new_unit = session.get(Unit, update_data['unit_id'])
        if not new_unit or new_unit.vendor_id != current_user.organization_id:
            raise HTTPException(status_code=400, detail="Invalid unit selection")

    for field, value in update_data.items():
        setattr(product, field, value)

    product.vendor_id = current_user.organization_id  # enforce
    
    session.add(product)
    session.commit()
    session.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Delete product (only vendor SuperAdmin/Admin)"""
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if product belongs to current user's vendor
    if product.vendor_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot delete other vendor's products"
        )
    
    session.delete(product)
    session.commit()
    return {"message": "Product deleted successfully"}
