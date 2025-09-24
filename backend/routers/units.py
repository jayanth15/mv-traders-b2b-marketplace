from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Unit, UnitCreate, UnitRead, User, OrganizationType, UnitCreateInput, UnitUpdateInput
from dependencies import get_current_user, require_super_admin_or_admin

router = APIRouter(prefix="/units", tags=["Units"])

@router.get("/", response_model=List[UnitRead])
def read_units(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all units (filtered by vendor for vendors)"""
    if current_user.organization_type == OrganizationType.VENDOR:
        # Vendors can only see their own units
        units = session.exec(
            select(Unit)
            .where(Unit.vendor_id == current_user.organization_id)
            .offset(skip)
            .limit(limit)
        ).all()
    else:
        # Companies can see all units
        units = session.exec(select(Unit).offset(skip).limit(limit)).all()
    
    return units

@router.get("/{unit_id}", response_model=UnitRead)
def read_unit(
    unit_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get unit by ID"""
    unit = session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    # Vendors can only see their own units
    if (current_user.organization_type == OrganizationType.VENDOR and 
        unit.vendor_id != current_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot view other vendor's units"
        )
    
    return unit

@router.post("/", response_model=UnitRead)
def create_unit(
    unit_data: UnitCreateInput,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Create a new unit (only vendor SuperAdmin/Admin)"""
    if current_user.organization_type != OrganizationType.VENDOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors can create units"
        )
    
    # Build full UnitCreate with vendor_id from current user
    to_create = UnitCreate(
        unit_name=unit_data.unit_name,
        unit_description=unit_data.unit_description,
        vendor_id=current_user.organization_id,
    )
    db_unit = Unit(**to_create.dict())
    session.add(db_unit)
    session.commit()
    session.refresh(db_unit)
    return db_unit

@router.put("/{unit_id}", response_model=UnitRead)
def update_unit(
    unit_id: int,
    unit_data: UnitUpdateInput,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Update unit (only vendor SuperAdmin/Admin)"""
    unit = session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    # Check if unit belongs to current user's vendor
    if unit.vendor_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot update other vendor's units"
        )
    
    # Apply only provided fields; vendor_id remains unchanged and enforced by check
    upd = unit_data.dict(exclude_unset=True)
    for field, value in upd.items():
        setattr(unit, field, value)
    
    session.add(unit)
    session.commit()
    session.refresh(unit)
    return unit

@router.delete("/{unit_id}")
def delete_unit(
    unit_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Delete unit (only vendor SuperAdmin/Admin)"""
    unit = session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    # Check if unit belongs to current user's vendor
    if unit.vendor_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot delete other vendor's units"
        )
    
    session.delete(unit)
    session.commit()
    return {"message": "Unit deleted successfully"}
