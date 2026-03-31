"""
Dich vu xac thuc - dang ky, dang nhap, lam moi token, OAuth2.
"""

from typing import Any, Optional

from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import User
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)

settings = get_settings()


class AuthError(Exception):
    """Loi xac thuc co the ban ra tu service layer."""

    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


async def register_user(db: AsyncSession, user_data: dict[str, Any]) -> User:
    """
    Tao tai khoan nguoi dung moi.
    Kiem tra trung email truoc khi tao.
    """
    existing = await db.execute(
        select(User).where(User.email == user_data["email"])
    )
    if existing.scalar_one_or_none() is not None:
        raise AuthError("Email da duoc su dung.", status_code=409)

    user = User(
        email=user_data["email"],
        full_name=user_data["full_name"],
        hashed_password=hash_password(user_data["password"]),
        phone=user_data.get("phone"),
        is_active=True,
        is_admin=False,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> dict[str, Any]:
    """
    Xac thuc nguoi dung qua email + mat khau.
    Tra ve cap access/refresh token.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(password, user.hashed_password):
        raise AuthError("Email hoac mat khau khong chinh xac.", status_code=401)

    if not user.is_active:
        raise AuthError("Tai khoan da bi vo hieu hoa.", status_code=403)

    return _build_token_response(user)


async def refresh_token(db: AsyncSession, token: str) -> dict[str, Any]:
    """
    Lam moi access token tu refresh token hop le.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: Optional[str] = payload.get("sub")
        token_type: Optional[str] = payload.get("type")

        if user_id is None or token_type != "refresh":
            raise AuthError("Refresh token khong hop le.", status_code=401)
    except JWTError:
        raise AuthError("Refresh token khong hop le hoac da het han.", status_code=401)

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise AuthError("Nguoi dung khong ton tai hoac da bi vo hieu hoa.", status_code=401)

    return _build_token_response(user)


async def get_or_create_oauth_user(
    db: AsyncSession, provider: str, oauth_data: dict[str, Any]
) -> dict[str, Any]:
    """
    Dang nhap / dang ky qua OAuth (Google, Facebook).
    Neu user chua ton tai thi tao moi, neu da co thi tra ve token.
    """
    email = oauth_data.get("email")
    if not email:
        raise AuthError("Khong lay duoc email tu nha cung cap OAuth.", status_code=400)

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            email=email,
            full_name=oauth_data.get("name", ""),
            hashed_password="",  # oauth user - khong co password
            oauth_provider=provider,
            oauth_provider_id=oauth_data.get("id", ""),
            avatar_url=oauth_data.get("picture"),
            is_active=True,
            is_admin=False,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
    else:
        # Cap nhat thong tin OAuth neu can
        if not user.oauth_provider:
            user.oauth_provider = provider
            user.oauth_provider_id = oauth_data.get("id", "")
        if oauth_data.get("picture") and not user.avatar_url:
            user.avatar_url = oauth_data["picture"]
        await db.flush()

    if not user.is_active:
        raise AuthError("Tai khoan da bi vo hieu hoa.", status_code=403)

    return _build_token_response(user)


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Tra ve user theo email, hoac None."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def update_user_password(db: AsyncSession, user: User, new_password: str) -> None:
    """Cap nhat mat khau cho user."""
    user.hashed_password = hash_password(new_password)
    await db.flush()


def _build_token_response(user: User) -> dict[str, Any]:
    """Tao response chua access va refresh token va user."""
    return {
        "access_token": create_access_token(
            subject=user.id,
            extra_claims={"is_admin": user.is_admin},
        ),
        "refresh_token": create_refresh_token(subject=user.id),
        "token_type": "bearer",
        "user": user,
    }
