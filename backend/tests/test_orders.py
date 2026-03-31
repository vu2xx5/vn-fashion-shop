"""
Test don hang - tao, xem danh sach, xem chi tiet, huy, admin cap nhat trang thai.

Su dung pytest-asyncio + httpx AsyncClient voi in-memory SQLite.
Cac test o day su dung router /api/v1/orders da dang ky trong app.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import ProductVariant
from app.models.user import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ORDERS_URL = "/api/v1/orders"
CART_ITEMS_URL = "/api/v1/cart/items"

SHIPPING_ADDRESS = {
    "full_name": "Nguyen Van Nhan",
    "phone": "0901234567",
    "street": "123 Nguyen Hue",
    "ward": "Ben Nghe",
    "district": "Quan 1",
    "city": "Ho Chi Minh",
}


async def _fill_cart(
    client: AsyncClient,
    auth_header: dict,
    variant_id: int,
    quantity: int = 2,
) -> None:
    """Helper: them san pham vao gio hang de chuan bi dat don."""
    resp = await client.post(
        CART_ITEMS_URL,
        json={"variant_id": variant_id, "quantity": quantity},
        headers=auth_header,
    )
    assert resp.status_code == 201


# ---------------------------------------------------------------------------
# Test tao don hang
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_order(
    client: AsyncClient,
    user_auth_header: dict,
    sample_variant: ProductVariant,
):
    """Tao don hang thanh cong tu gio hang."""
    await _fill_cart(client, user_auth_header, sample_variant.id, quantity=2)

    resp = await client.post(
        ORDERS_URL,
        json={
            "shipping_address": SHIPPING_ADDRESS,
            "notes": "Giao gio hanh chinh",
        },
        headers=user_auth_header,
    )
    assert resp.status_code == 201

    data = resp.json()
    assert data["status"] == "pending"
    assert data["order_number"] is not None
    assert len(data["items"]) >= 1
    assert data["total"] > 0
    assert data["shipping_address"]["city"] == "Ho Chi Minh"


# ---------------------------------------------------------------------------
# Test xem danh sach don hang
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_user_orders(
    client: AsyncClient,
    user_auth_header: dict,
    sample_variant: ProductVariant,
):
    """Lay danh sach don hang cua nguoi dung."""
    # Tao 1 don hang truoc
    await _fill_cart(client, user_auth_header, sample_variant.id)
    await client.post(
        ORDERS_URL,
        json={"shipping_address": SHIPPING_ADDRESS},
        headers=user_auth_header,
    )

    resp = await client.get(ORDERS_URL, headers=user_auth_header)
    assert resp.status_code == 200

    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "order_number" in data[0]
    assert "total" in data[0]


# ---------------------------------------------------------------------------
# Test xem chi tiet don hang
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_order_detail(
    client: AsyncClient,
    user_auth_header: dict,
    sample_variant: ProductVariant,
):
    """Xem chi tiet mot don hang cu the."""
    await _fill_cart(client, user_auth_header, sample_variant.id)
    create_resp = await client.post(
        ORDERS_URL,
        json={"shipping_address": SHIPPING_ADDRESS},
        headers=user_auth_header,
    )
    order_id = create_resp.json()["id"]

    resp = await client.get(
        f"{ORDERS_URL}/{order_id}", headers=user_auth_header
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["id"] == order_id
    assert data["status"] == "pending"
    assert len(data["items"]) >= 1
    assert data["items"][0]["product_name"] is not None


# ---------------------------------------------------------------------------
# Test huy don hang
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cancel_order(
    client: AsyncClient,
    user_auth_header: dict,
    sample_variant: ProductVariant,
):
    """Huy don hang o trang thai pending."""
    await _fill_cart(client, user_auth_header, sample_variant.id)
    create_resp = await client.post(
        ORDERS_URL,
        json={"shipping_address": SHIPPING_ADDRESS},
        headers=user_auth_header,
    )
    order_id = create_resp.json()["id"]

    # Huy don hang (endpoint POST /{id}/cancel)
    resp = await client.post(
        f"{ORDERS_URL}/{order_id}/cancel", headers=user_auth_header
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["status"] == "cancelled"


# ---------------------------------------------------------------------------
# Test admin cap nhat trang thai don hang
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_update_status(
    client: AsyncClient,
    user_auth_header: dict,
    admin_auth_header: dict,
    sample_variant: ProductVariant,
):
    """Admin cap nhat trang thai don hang tu pending sang paid."""
    # User tao don hang
    await _fill_cart(client, user_auth_header, sample_variant.id)
    create_resp = await client.post(
        ORDERS_URL,
        json={"shipping_address": SHIPPING_ADDRESS},
        headers=user_auth_header,
    )
    order_id = create_resp.json()["id"]

    # Admin cap nhat trang thai
    resp = await client.put(
        f"{ORDERS_URL}/{order_id}/status",
        json={"status": "paid", "notes": "Da xac nhan thanh toan"},
        headers=admin_auth_header,
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["status"] == "paid"
