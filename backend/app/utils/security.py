"""
Tien ich bao mat - JWT, hash mat khau, sinh ma don hang.
"""

import uuid
from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt
from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()

# --- Hash mat khau ---


def hash_password(password: str) -> str:
    """Ma hoa mat khau."""
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Xac minh mat khau."""
    return _bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


# --- JWT ---

def create_access_token(
    subject: int | str,
    extra_claims: dict | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """Tao access token JWT."""
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta
        or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(
    subject: int | str,
    expires_delta: timedelta | None = None,
) -> str:
    """Tao refresh token JWT."""
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta
        or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    payload = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
        "type": "refresh",
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Giai ma va xac minh JWT token. Nem JWTError neu khong hop le."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        raise


def create_token_pair(user_id: int, is_admin: bool = False) -> dict:
    """Tao cap access + refresh token."""
    access = create_access_token(
        subject=user_id,
        extra_claims={"is_admin": is_admin},
    )
    refresh = create_refresh_token(subject=user_id)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


# --- Ma don hang ---

def generate_order_number() -> str:
    """
    Sinh ma don hang duy nhat.
    Dinh dang: VNF-YYYYMMDD-XXXXXX (6 ky tu hex ngau nhien)
    """
    now = datetime.now(timezone.utc)
    date_part = now.strftime("%Y%m%d")
    random_part = uuid.uuid4().hex[:6].upper()
    return f"VNF-{date_part}-{random_part}"
