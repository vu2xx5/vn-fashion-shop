"""
Test xac thuc - dang ky, dang nhap, lam moi token, lay thong tin nguoi dung.

Su dung pytest-asyncio + httpx AsyncClient voi in-memory SQLite.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"
ME_URL = "/api/v1/auth/me"
REFRESH_URL = "/api/v1/auth/refresh"

VALID_USER = {
    "email": "newuser@example.com",
    "password": "Strong1Pass!",
    "full_name": "Tran Van Moi",
    "phone": "0912345678",
}


# ---------------------------------------------------------------------------
# Test dang ky
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """Dang ky thanh cong voi du lieu hop le."""
    resp = await client.post(REGISTER_URL, json=VALID_USER)
    assert resp.status_code == 201

    data = resp.json()
    assert data["email"] == VALID_USER["email"]
    assert data["full_name"] == VALID_USER["full_name"]
    assert data["is_admin"] is False
    assert data["is_active"] is True
    # Khong tra ve password
    assert "password" not in data
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Dang ky voi email da ton tai phai that bai 409."""
    # Dang ky lan dau
    resp1 = await client.post(REGISTER_URL, json=VALID_USER)
    assert resp1.status_code == 201

    # Dang ky lan hai voi cung email
    resp2 = await client.post(REGISTER_URL, json=VALID_USER)
    assert resp2.status_code == 409


# ---------------------------------------------------------------------------
# Test dang nhap
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Dang nhap thanh cong va nhan duoc token."""
    # Tao tai khoan truoc
    await client.post(REGISTER_URL, json=VALID_USER)

    resp = await client.post(
        LOGIN_URL,
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    assert resp.status_code == 200

    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """Dang nhap sai mat khau phai that bai 401."""
    # Tao tai khoan truoc
    await client.post(REGISTER_URL, json=VALID_USER)

    resp = await client.post(
        LOGIN_URL,
        json={"email": VALID_USER["email"], "password": "WrongPassword1!"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Test lay thong tin nguoi dung hien tai
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, user_auth_header: dict):
    """Lay thong tin user hien tai voi token hop le."""
    resp = await client.get(ME_URL, headers=user_auth_header)
    assert resp.status_code == 200

    data = resp.json()
    assert data["email"] == "testuser@example.com"
    assert data["full_name"] == "Nguyen Van Test"
    assert data["is_admin"] is False


# ---------------------------------------------------------------------------
# Test lam moi token
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    """Lam moi access token tu refresh token hop le."""
    # Dang ky va dang nhap de lay refresh token
    await client.post(REGISTER_URL, json=VALID_USER)
    login_resp = await client.post(
        LOGIN_URL,
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    tokens = login_resp.json()
    refresh_tok = tokens["refresh_token"]

    # Gui yeu cau lam moi
    resp = await client.post(REFRESH_URL, json={"refresh_token": refresh_tok})
    assert resp.status_code == 200

    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


# ---------------------------------------------------------------------------
# Test truy cap trai phep
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    """Truy cap endpoint bao ve khong co token phai tra ve 401."""
    resp = await client.get(ME_URL)
    assert resp.status_code == 401
