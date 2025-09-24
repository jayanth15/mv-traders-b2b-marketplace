from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from database import get_session
from models import User, UserRole, OrganizationType
from auth import verify_token
from typing import Optional

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    phone_number = verify_token(token)
    
    if phone_number is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = session.exec(select(User).where(User.phone_number == phone_number)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def require_role(required_roles: list[UserRole]):
    """Decorator to require specific roles"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

def require_app_owner(current_user: User = Depends(get_current_user)) -> User:
    """Require AppOwner role"""
    if current_user.organization_type != OrganizationType.APP_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only AppOwner can perform this action"
        )
    return current_user

def require_company_or_app_owner(current_user: User = Depends(get_current_user)) -> User:
    """Allow Company or AppOwner users"""
    if current_user.organization_type not in [OrganizationType.COMPANY, OrganizationType.APP_OWNER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Company or AppOwner can perform this action"
        )
    return current_user

def require_super_admin_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require SuperAdmin or Admin role"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SuperAdmin or Admin can perform this action"
        )
    return current_user

def require_same_organization(current_user: User = Depends(get_current_user)):
    """Check if user belongs to the same organization"""
    def org_checker(organization_id: int) -> User:
        if current_user.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Different organization"
            )
        return current_user
    return org_checker
