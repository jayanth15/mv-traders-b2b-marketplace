from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import (
    ProductZoneAdjustment, ProductZoneAdjustmentCreate, ProductZoneAdjustmentRead,
    ProductQuantityTier, ProductQuantityTierCreate, ProductQuantityTierRead,
    User, UserRole, OrganizationType
)
from dependencies import get_current_user, require_super_admin_or_admin
from pricing_engine import compute_price

router = APIRouter(prefix="/pricing", tags=["Pricing"])

@router.post("/preview")
def preview_price(
    product_id: int,
    quantity: int = 1,
    zone_code: str | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    try:
        result = compute_price(session, product_id=product_id, quantity=quantity, zone_code=zone_code)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Zone adjustments CRUD (vendor admins only)
@router.get("/zones/{product_id}", response_model=List[ProductZoneAdjustmentRead])
def list_zones(
    product_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    if current_user.organization_type != OrganizationType.VENDOR:
        raise HTTPException(status_code=403, detail="Only vendors manage pricing")
    zones = session.exec(select(ProductZoneAdjustment).where(ProductZoneAdjustment.product_id == product_id)).all()
    return zones

@router.post("/zones/{product_id}", response_model=ProductZoneAdjustmentRead)
def create_zone(
    product_id: int,
    data: ProductZoneAdjustmentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    if current_user.organization_type != OrganizationType.VENDOR:
        raise HTTPException(status_code=403, detail="Only vendors manage pricing")
    # ensure uniqueness (product_id, zone_code)
    existing = session.exec(select(ProductZoneAdjustment).where(ProductZoneAdjustment.product_id == product_id, ProductZoneAdjustment.zone_code == data.zone_code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Zone already exists")
    zone = ProductZoneAdjustment(product_id=product_id, **data.dict())
    session.add(zone)
    session.commit()
    session.refresh(zone)
    return zone

@router.put("/zones/{zone_id}", response_model=ProductZoneAdjustmentRead)
def update_zone(
    zone_id: int,
    data: ProductZoneAdjustmentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    zone = session.get(ProductZoneAdjustment, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    if current_user.organization_type != OrganizationType.VENDOR:
        raise HTTPException(status_code=403, detail="Only vendors manage pricing")
    for k, v in data.dict(exclude_unset=True).items():
        setattr(zone, k, v)
    session.add(zone)
    session.commit()
    session.refresh(zone)
    return zone

@router.delete("/zones/{zone_id}")
def delete_zone(
    zone_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    zone = session.get(ProductZoneAdjustment, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    if current_user.organization_type != OrganizationType.VENDOR:
        raise HTTPException(status_code=403, detail="Only vendors manage pricing")
    session.delete(zone)
    session.commit()
    return {"message": "Zone deleted"}

# Quantity tiers CRUD
@router.get("/tiers/{product_id}", response_model=List[ProductQuantityTierRead])
def list_tiers(
    product_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    if current_user.organization_type != OrganizationType.VENDOR:
        raise HTTPException(status_code=403, detail="Only vendors manage pricing")
    tiers = session.exec(select(ProductQuantityTier).where(ProductQuantityTier.product_id == product_id)).all()
    return tiers

@router.post("/tiers/{product_id}", response_model=ProductQuantityTierRead)
def create_tier(
    product_id: int,
    data: ProductQuantityTierCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    if current_user.organization_type != OrganizationType.VENDOR:
        raise HTTPException(status_code=403, detail="Only vendors manage pricing")
    tier = ProductQuantityTier(product_id=product_id, **data.dict())
    session.add(tier)
    session.commit()
    session.refresh(tier)
    return tier

@router.put("/tiers/{tier_id}", response_model=ProductQuantityTierRead)
def update_tier(
    tier_id: int,
    data: ProductQuantityTierCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    tier = session.get(ProductQuantityTier, tier_id)
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    if current_user.organization_type != OrganizationType.VENDOR:
        raise HTTPException(status_code=403, detail="Only vendors manage pricing")
    for k, v in data.dict(exclude_unset=True).items():
        setattr(tier, k, v)
    session.add(tier)
    session.commit()
    session.refresh(tier)
    return tier

@router.delete("/tiers/{tier_id}")
def delete_tier(
    tier_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    tier = session.get(ProductQuantityTier, tier_id)
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    if current_user.organization_type != OrganizationType.VENDOR:
        raise HTTPException(status_code=403, detail="Only vendors manage pricing")
    session.delete(tier)
    session.commit()
    return {"message": "Tier deleted"}
