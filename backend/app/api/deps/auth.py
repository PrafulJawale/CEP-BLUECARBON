from typing import Optional
from uuid import UUID

from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token, TokenData
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import TokenPayload


async def get_current_user(
    request: Request,
    access_token: Optional[str] = Cookie(None, alias="access_token"),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(access_token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user


def require_roles(*allowed_roles: UserRole):
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {', '.join(r.value for r in allowed_roles)}",
            )
        return current_user
    return role_checker


require_admin = require_roles(UserRole.ADMIN)
require_gov_officer = require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN)
require_project_developer = require_roles(UserRole.PROJECT_DEVELOPER, UserRole.ADMIN)
require_buyer = require_roles(UserRole.BUYER, UserRole.ADMIN)
require_researcher = require_roles(UserRole.RESEARCHER, UserRole.ADMIN)
require_community = require_roles(UserRole.COMMUNITY_REPRESENTATIVE, UserRole.ADMIN)


async def get_optional_user(
    request: Request,
    access_token: Optional[str] = Cookie(None, alias="access_token"),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not access_token:
        return None

    payload = decode_token(access_token)
    if not payload or payload.get("type") != "access":
        return None

    user_id_str = payload.get("sub")
    if not user_id_str:
        return None

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        return None

    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or user.status != UserStatus.ACTIVE:
        return None

    return user