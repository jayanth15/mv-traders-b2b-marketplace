from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import User, UserCreate, UserRead, UserUpdate, UserRole
from dependencies import get_current_user, require_super_admin_or_admin
from auth import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserRead])
def read_users(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Get all users - AppOwner sees all, others see only same organization"""
    query = select(User).offset(skip).limit(limit)
    
    # AppOwner can see all users, others only see same organization
    if current_user.organization_type != "AppOwner":
        query = query.where(User.organization_id == current_user.organization_id)
    
    users = session.exec(query).all()
    return users

@router.get("/{user_id}", response_model=UserRead)
def read_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get user by ID"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user belongs to same organization
    if user.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Different organization"
        )
    
    return user

@router.post("/", response_model=UserRead)
def create_user(
    user_data: UserCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Create a new user"""
    # Check if phone number already exists
    existing_user = session.exec(select(User).where(User.phone_number == user_data.phone_number)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Admin cannot create SuperAdmin or other Admins
    if current_user.role == UserRole.ADMIN and user_data.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin cannot create SuperAdmin or other Admins"
        )
    
    # Determine organization assignment
    if current_user.organization_type == "AppOwner":
        # AppOwner can assign users to any organization if specified
        target_org_id = getattr(user_data, 'organization_id', current_user.organization_id)
        target_org_type = getattr(user_data, 'organization_type', current_user.organization_type)
    else:
        # Regular admins can only create users in their own organization
        target_org_id = current_user.organization_id
        target_org_type = current_user.organization_type

    db_user = User(
        full_name=user_data.full_name,
        phone_number=user_data.phone_number,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        organization_id=target_org_id,
        organization_type=target_org_type,
        created_by=current_user.user_id
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user

@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Update user"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user belongs to same organization
    if user.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Different organization"
        )
    
    # Admin cannot update SuperAdmin or other Admins
    if current_user.role == UserRole.ADMIN and user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin cannot update SuperAdmin or other Admins"
        )
    
    user_data_dict = user_data.dict(exclude_unset=True)
    for field, value in user_data_dict.items():
        setattr(user, field, value)
    
    user.updated_by = current_user.user_id
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin_or_admin)
):
    """Delete user"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user belongs to same organization
    if user.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Different organization"
        )
    
    # Admin cannot delete SuperAdmin or other Admins
    if current_user.role == UserRole.ADMIN and user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin cannot delete SuperAdmin or other Admins"
        )
    
    session.delete(user)
    session.commit()
    
    return {"message": "User deleted successfully"}
