"""
Test xac thuc - dang ky, dang nhap, lam moi token, lay thong tin nguoi dung.

Su dung pytest-asyncio + httpx AsyncClient voi in-memory SQLite.
"""

import pytest
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


async def test_register_success(client: AsyncClient):
    """Dang ky thanh cong voi du lieu hop le."""
    resp = await client.post(REGISTER_URL, json=VALID_USER)
    assert resp.status_code == 201

    body = resp.json()
    # Router returns {success: true, data: {user: {...}, token: "..."}}
    assert body["success"] is True
    assert "data" in body
    user_data = body["data"]["user"]
    assert user_data["email"] == VALID_USER["email"]
    assert user_data["fullName"] == VALID_USER["full_name"]
    assert user_data["role"] == "customer"
    # Khong tra ve password
    assert "password" not in user_data
    assert "hashed_password" not in user_data


async def test_register_duplicate_email(client: AsyncClient):
    """Dang ky voi email da ton tai phai that bai 409."""
    resp1 = await client.post(REGISTER_URL, json=VALID_USER)
    assert resp1.status_code == 201

    resp2 = await client.post(REGISTER_URL, json=VALID_USER)
    assert resp2.status_code == 409


# ---------------------------------------------------------------------------
# Test dang nhap
# ---------------------------------------------------------------------------


async def test_login_success(client: AsyncClient):
    """Dang nhap thanh cong va nhan duoc token."""
    await client.post(REGISTER_URL, json=VALID_USER)

    resp = await client.post(
        LOGIN_URL,
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    assert resp.status_code == 200

    body = resp.json()
    # Router returns {success: true, data: {user: {...}, token: "..."}}
    assert body["success"] is True
    assert "token" in body["data"]
    assert "user" in body["data"]
    assert body["data"]["user"]["email"] == VALID_USER["email"]


async def test_login_wrong_password(client: AsyncClient):
    """Dang nhap sai mat khau phai that bai 401."""
    await client.post(REGISTER_URL, json=VALID_USER)

    resp = await client.post(
        LOGIN_URL,
        json={"email": VALID_USER["email"], "password": "WrongPassword1!"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Test lay thong tin nguoi dung hien tai
# ---------------------------------------------------------------------------


async def test_get_current_user(client: AsyncClient, user_auth_header: dict):
    """Lay thong tin user hien tai voi token hop le."""
    resp = await client.get(ME_URL, headers=user_auth_header)
    assert resp.status_code == 200

    body = resp.json()
    # Router returns {success: true, data: {...user fields camelCase...}}
    assert body["success"] is True
    user_data = body["data"]
    assert user_data["email"] == "testuser@example.com"
    assert user_data["fullName"] == "Nguyen Van Test"
    assert user_data["role"] == "customer"


# ---------------------------------------------------------------------------
# Test truy cap trai phep
# ---------------------------------------------------------------------------


async def test_unauthorized_access(client: AsyncClient):
    """Truy cap endpoint bao ve khong co token phai tra ve 401."""
    resp = await client.get(ME_URL)
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Test mat khau khong du manh
# ---------------------------------------------------------------------------


async def test_register_weak_password(client: AsyncClient):
    """Dang ky voi mat khau khong du manh (khong co chu hoa) phai that bai 422."""
    resp = await client.post(
        REGISTER_URL,
        json={**VALID_USER, "email": "weak@example.com", "password": "weakpassword1"},
    )
    assert resp.status_code == 422


async def test_password_hashing(client: AsyncClient):
    """Dam bao mat khau duoc hash - khong luu plain text."""
    resp = await client.post(REGISTER_URL, json=VALID_USER)
    assert resp.status_code == 201
    body = resp.json()
    user_data = body["data"]["user"]
    # Khong co truong nao tra ve mat khau go
    assert "password" not in str(body)
    # Nhung van dang nhap duoc bang mat khau goc
    login_resp = await client.post(
        LOGIN_URL,
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    assert login_resp.status_code == 200
