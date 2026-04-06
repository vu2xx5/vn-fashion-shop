"""
Test san pham - danh sach, chi tiet, tim kiem, loc theo danh muc.

Su dung pytest-asyncio + httpx AsyncClient voi in-memory SQLite.
"""

import pytest
from httpx import AsyncClient

from app.models.product import Category, Product, ProductVariant


PRODUCTS_URL = "/api/v1/products"
CATEGORIES_URL = "/api/v1/categories"


# ---------------------------------------------------------------------------
# Test danh sach san pham
# ---------------------------------------------------------------------------


async def test_list_products_empty(client: AsyncClient):
    """Danh sach san pham khi chua co san pham."""
    resp = await client.get(PRODUCTS_URL)
    assert resp.status_code == 200

    body = resp.json()
    assert "data" in body
    assert "pagination" in body
    assert isinstance(body["data"], list)


async def test_list_products_with_data(
    client: AsyncClient,
    sample_product: Product,
):
    """Danh sach san pham khi co du lieu."""
    resp = await client.get(PRODUCTS_URL)
    assert resp.status_code == 200

    body = resp.json()
    assert len(body["data"]) >= 1
    product = body["data"][0]
    assert "id" in product
    assert "name" in product
    assert "price" in product
    assert "slug" in product


# ---------------------------------------------------------------------------
# Test chi tiet san pham theo slug
# ---------------------------------------------------------------------------


async def test_get_product_by_slug(
    client: AsyncClient,
    sample_product: Product,
):
    """Lay chi tiet san pham theo slug."""
    resp = await client.get(f"{PRODUCTS_URL}/{sample_product.slug}")
    assert resp.status_code == 200

    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["slug"] == sample_product.slug
    assert data["name"] == sample_product.name
    assert "variants" in data
    assert "images" in data


async def test_get_product_not_found(client: AsyncClient):
    """Lay san pham khong ton tai phai tra ve 404."""
    resp = await client.get(f"{PRODUCTS_URL}/san-pham-khong-ton-tai")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Test tim kiem san pham
# ---------------------------------------------------------------------------


async def test_search_products(
    client: AsyncClient,
    sample_product: Product,
):
    """Tim kiem san pham theo tu khoa."""
    resp = await client.get(PRODUCTS_URL, params={"search": "thun"})
    assert resp.status_code == 200

    body = resp.json()
    assert "data" in body
    # San pham "Ao thun basic cotton" phai duoc tim thay
    names = [p["name"] for p in body["data"]]
    assert any("thun" in n.lower() for n in names)


async def test_search_products_no_results(
    client: AsyncClient,
    sample_product: Product,
):
    """Tim kiem san pham khong co ket qua."""
    resp = await client.get(PRODUCTS_URL, params={"search": "xyz123notfound"})
    assert resp.status_code == 200

    body = resp.json()
    assert body["data"] == []


# ---------------------------------------------------------------------------
# Test loc san pham theo danh muc
# ---------------------------------------------------------------------------


async def test_filter_by_category(
    client: AsyncClient,
    sample_product: Product,
    sample_category: Category,
):
    """Loc san pham theo danh muc."""
    resp = await client.get(PRODUCTS_URL, params={"category": sample_category.slug})
    assert resp.status_code == 200

    body = resp.json()
    assert "data" in body
    assert len(body["data"]) >= 1


# ---------------------------------------------------------------------------
# Test phan trang
# ---------------------------------------------------------------------------


async def test_pagination(
    client: AsyncClient,
    sample_product: Product,
):
    """Kiem tra thong tin phan trang."""
    resp = await client.get(PRODUCTS_URL, params={"page": 1, "limit": 5})
    assert resp.status_code == 200

    body = resp.json()
    pagination = body["pagination"]
    assert pagination["page"] == 1
    assert pagination["limit"] == 5
    assert "total" in pagination
    assert "totalPages" in pagination


# ---------------------------------------------------------------------------
# Test danh muc
# ---------------------------------------------------------------------------


async def test_list_categories(
    client: AsyncClient,
    sample_category: Category,
):
    """Lay danh sach danh muc."""
    resp = await client.get(CATEGORIES_URL)
    assert resp.status_code == 200

    body = resp.json()
    assert body["success"] is True
    assert "data" in body
    assert isinstance(body["data"], list)
    assert len(body["data"]) >= 1
    cat = body["data"][0]
    assert "id" in cat
    assert "name" in cat
    assert "slug" in cat


# ---------------------------------------------------------------------------
# Test san pham noi bat va moi
# ---------------------------------------------------------------------------


async def test_featured_products(
    client: AsyncClient,
    sample_product: Product,
):
    """Lay san pham noi bat."""
    resp = await client.get(f"{PRODUCTS_URL}/featured")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "data" in body


async def test_new_arrivals(
    client: AsyncClient,
    sample_product: Product,
):
    """Lay san pham moi."""
    resp = await client.get(f"{PRODUCTS_URL}/new-arrivals")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "data" in body
