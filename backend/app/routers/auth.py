"""
Router xac thuc - dang ky, dang nhap, lam moi token, thong tin nguoi dung.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.auth import AuthError, authenticate_user, refresh_token, register_user
from app.config import get_settings

settings = get_settings()

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


def _user_to_frontend(user: User) -> dict:
    """Chuyen doi User model sang format frontend mong doi."""
    role = "admin" if user.is_admin else "customer"
    return {
        "id": str(user.id),
        "email": user.email,
        "fullName": user.full_name,
        "phone": user.phone,
        "avatar": user.avatar_url,
        "role": role,
        "addresses": [],
        "isEmailVerified": True,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Dang ky tai khoan moi."""
    try:
        user = await register_user(db, body.model_dump())
        result = await authenticate_user(db, body.email, body.password)
        return {
            "success": True,
            "data": {
                "user": _user_to_frontend(user),
                "token": result["access_token"],
            },
        }
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/login")
async def login(
    body: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """Dang nhap va nhan JWT token."""
    try:
        result = await authenticate_user(db, body.email, body.password)
        user = result["user"]
        return {
            "success": True,
            "data": {
                "user": _user_to_frontend(user),
                "token": result["access_token"],
            },
        }
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/refresh")
async def refresh(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Lam moi access token tu refresh token."""
    token = body.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Thieu refresh_token",
        )
    try:
        result = await refresh_token(db, token)
        return {
            "success": True,
            "data": {
                "token": result["access_token"],
            },
        }
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """Lay thong tin nguoi dung hien tai."""
    return {"success": True, "data": _user_to_frontend(current_user)}


@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
):
    """Lay thong tin nguoi dung hien tai (alias cho /me)."""
    return {"success": True, "data": _user_to_frontend(current_user)}


@router.post("/logout")
async def logout():
    """Dang xuat (client-side xoa token)."""
    return {"success": True, "message": "Dang xuat thanh cong"}
