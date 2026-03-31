"""
Schemas xac thuc - dang ky, dang nhap, token, OAuth.
"""

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=20)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


class OAuthRequest(BaseModel):
    """Du lieu OAuth nhan tu frontend sau khi user dang nhap voi provider."""
    email: EmailStr
    name: str | None = None
    id: str | None = None
    picture: str | None = None
    access_token: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

    class Config:
        from_attributes = True
