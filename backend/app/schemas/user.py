"""
Schema nguoi dung - dang ky, dang nhap, thong tin, dia chi.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


# ---- Xac thuc ----

class UserCreate(BaseModel):
    """Dang ky tai khoan."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=20)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Mat khau phai co it nhat 1 ky tu in hoa")
        if not any(c.isdigit() for c in v):
            raise ValueError("Mat khau phai co it nhat 1 chu so")
        return v


class UserLogin(BaseModel):
    """Dang nhap."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Phan hoi token JWT."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Thoi gian het han (giay)")


class UserResponse(BaseModel):
    """Thong tin nguoi dung tra ve client."""
    id: int
    email: str
    full_name: str
    phone: str | None = None
    is_active: bool
    is_admin: bool
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Cap nhat thong tin nguoi dung."""
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    avatar_url: str | None = None


# ---- Dia chi ----

class AddressCreate(BaseModel):
    """Tao dia chi giao hang moi."""
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=20)
    street: str = Field(min_length=1, max_length=500)
    ward: str = Field(min_length=1, max_length=100)
    district: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=100)
    is_default: bool = False


class AddressResponse(BaseModel):
    """Thong tin dia chi tra ve."""
    id: int
    full_name: str
    phone: str
    street: str
    ward: str
    district: str
    city: str
    is_default: bool

    model_config = {"from_attributes": True}
