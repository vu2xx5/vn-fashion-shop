"""
Test gio hang - them, sua, xoa, xem, kiem tra ton kho.

Su dung pytest-asyncio + httpx AsyncClient voi in-memory SQLite.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import ProductVariant


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

CART_URL = "/api/v1/cart"
CART_ITEMS_URL = "/api/v1/cart/items"


# ---------------------------------------------------------------------------
# Test them san pham vao gio hang
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_add_to_cart(
    client: AsyncClient,
    user_auth_header: dict,
    sample_variant: ProductVariant,
):
    """Them san pham vao gio hang thanh cong."""
    resp = await client.post(
        CART_ITEMS_URL,
        json={"variant_id": sample_variant.id, "quantity": 2},
        headers=user_auth_header,
    )
    assert resp.status_code == 201

    data = resp.json()
    assert data["total_items"] == 2
    assert len(data["items"]) == 1
    assert data["items"][0]["variant_id"] == sample_variant.id
    assert data["items"][0]["quantity"] == 2
    assert data["subtotal"] > 0


# ---------------------------------------------------------------------------
# Test cap nhat so luong
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_cart_quantity(
    client: AsyncClient,
    user_auth_header: dict,
    sample_variant: ProductVariant,
):
    """Cap nhat so luong san pham trong gio hang."""
    # Them vao gio truoc
    add_resp = await client.post(
        CART_ITEMS_URL,
        json={"variant_id": sample_variant.id, "quantity": 1},
        headers=user_auth_header,
    )
    assert add_resp.status_code == 201
    item_id = add_resp.json()["items"][0]["id"]

    # Cap nhat so luong
    update_resp = await client.put(
        f"{CART_ITEMS_URL}/{item_id}",
        json={"quantity": 5},
        headers=user_auth_header,
    )
    assert update_resp.status_code == 200

    data = update_resp.json()
    updated_item = next(i for i in data["items"] if i["id"] == item_id)
    assert updated_item["quantity"] == 5


# ---------------------------------------------------------------------------
# Test xoa san pham khoi gio hang
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_remove_from_cart(
    client: AsyncClient,
    user_auth_header: dict,
    sample_variant: ProductVariant,
):
    """Xoa san pham khoi gio hang."""
    # Them vao gio
    add_resp = await client.post(
        CART_ITEMS_URL,
        json={"variant_id": sample_variant.id, "quantity": 1},
        headers=user_auth_header,
    )
    assert add_resp.status_code == 201
    item_id = add_resp.json()["items"][0]["id"]

    # Xoa
    del_resp = await client.delete(
        f"{CART_ITEMS_URL}/{item_id}",
        headers=user_auth_header,
    )
    assert del_resp.status_code == 204

    # Kiem tra gio hang trong
    cart_resp = await client.get(CART_URL, headers=user_auth_header)
    assert cart_resp.status_code == 200
    data = cart_resp.json()
    assert data["total_items"] == 0
    assert len(data["items"]) == 0


# ---------------------------------------------------------------------------
# Test xem gio hang
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_cart(
    client: AsyncClient,
    user_auth_header: dict,
    sample_variant: ProductVariant,
    second_variant: ProductVariant,
):
    """Xem gio hang voi nhieu san pham."""
    # Them 2 variant khac nhau
    await client.post(
        CART_ITEMS_URL,
        json={"variant_id": sample_variant.id, "quantity": 2},
        headers=user_auth_header,
    )
    await client.post(
        CART_ITEMS_URL,
        json={"variant_id": second_variant.id, "quantity": 3},
        headers=user_auth_header,
    )

    resp = await client.get(CART_URL, headers=user_auth_header)
    assert resp.status_code == 200

    data = resp.json()
    assert len(data["items"]) == 2
    assert data["total_items"] == 5  # 2 + 3
    assert data["subtotal"] > 0


# ---------------------------------------------------------------------------
# Test them khi het hang
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_add_to_cart_insufficient_stock(
    client: AsyncClient,
    user_auth_header: dict,
    low_stock_variant: ProductVariant,
):
    """Them san pham het hang phai that bai."""
    # low_stock_variant chi co stock_quantity=1
    resp = await client.post(
        CART_ITEMS_URL,
        json={"variant_id": low_stock_variant.id, "quantity": 10},
        headers=user_auth_header,
    )
    assert resp.status_code == 409
