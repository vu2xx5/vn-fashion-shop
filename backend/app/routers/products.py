"""
Router san pham - danh sach, chi tiet, tim kiem, danh muc.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.services.product import (
    ProductError,
    get_product,
    list_categories,
    list_products,
    search_products,
)

router = APIRouter(prefix="/api/v1/products", tags=["San pham"])


def _serialize_product(product) -> dict:
    """Chuyen doi Product model sang format frontend."""
    primary_image = None
    images = []
    for img in (product.images or []):
        img_data = {
            "id": str(img.id),
            "url": img.url,
            "alt": img.alt_text or product.name,
            "width": 800,
            "height": 800,
            "isPrimary": img.position == 0,
            "sortOrder": img.position,
        }
        images.append(img_data)
        if img.position == 0:
            primary_image = img.url

    variants = []
    sizes = []
    colors = []
    seen_sizes = set()
    seen_colors = set()
    for v in (product.variants or []):
        variants.append({
            "id": str(v.id),
            "productId": str(product.id),
            "size": {"id": v.size or "", "name": v.size or "", "value": v.size or "", "sortOrder": 0},
            "color": {"id": v.color or "", "name": v.color or "", "hex": "#000000", "sortOrder": 0},
            "sku": v.sku,
            "price": float(v.price_override or product.price),
            "stock": v.stock_quantity,
            "isActive": True,
        })
        if v.size and v.size not in seen_sizes:
            seen_sizes.add(v.size)
            sizes.append({"id": v.size, "name": v.size, "value": v.size, "sortOrder": len(sizes)})
        if v.color and v.color not in seen_colors:
            seen_colors.add(v.color)
            colors.append({"id": v.color, "name": v.color, "hex": "#000000", "sortOrder": len(colors)})

    cat = None
    if product.category:
        cat = {
            "id": str(product.category.id),
            "name": product.category.name,
            "slug": product.category.slug,
            "description": product.category.description,
            "image": product.category.image_url,
            "productCount": 0,
            "isActive": True,
            "sortOrder": 0,
        }

    total_stock = sum(v.stock_quantity for v in (product.variants or []))
    return {
        "id": str(product.id),
        "slug": product.slug,
        "name": product.name,
        "description": product.description or "",
        "shortDescription": (product.description or "")[:200],
        "price": float(product.price),
        "compareAtPrice": float(product.compare_at_price) if product.compare_at_price else None,
        "images": images,
        "category": cat,
        "categoryId": str(product.category_id) if product.category_id else None,
        "variants": variants,
        "sizes": sizes,
        "colors": colors,
        "tags": [],
        "sku": product.slug,
        "stock": total_stock,
        "isActive": product.is_active,
        "isFeatured": False,
        "rating": 0,
        "reviewCount": 0,
        "createdAt": product.created_at.isoformat() if product.created_at else None,
        "updatedAt": product.updated_at.isoformat() if product.updated_at else None,
    }


def _serialize_category(cat, include_children: bool = True) -> dict:
    """Chuyen doi Category model sang format frontend."""
    result = {
        "id": str(cat.id),
        "name": cat.name,
        "slug": cat.slug,
        "description": cat.description,
        "image": cat.image_url,
        "productCount": len(cat.products) if hasattr(cat, 'products') and cat.products else 0,
        "isActive": True,
        "sortOrder": 0,
    }
    if include_children and hasattr(cat, 'children') and cat.children:
        result["children"] = [_serialize_category(c, include_children=False) for c in cat.children]
    else:
        result["children"] = []
    return result


@router.get("", summary="Lay danh sach san pham")
async def get_products(
    category: Optional[str] = Query(None, description="Slug danh muc"),
    size: Optional[str] = Query(None, description="Kich co (S, M, L, XL, ...)"),
    color: Optional[str] = Query(None, description="Mau sac"),
    min_price: Optional[int] = Query(None, ge=0, description="Gia toi thieu (VND)"),
    max_price: Optional[int] = Query(None, ge=0, description="Gia toi da (VND)"),
    sort: Optional[str] = Query(None, description="Sap xep"),
    search: Optional[str] = Query(None, description="Tim kiem"),
    page: int = Query(1, ge=1, description="Trang hien tai"),
    limit: int = Query(20, ge=1, le=100, alias="limit", description="So san pham moi trang"),
    db: AsyncSession = Depends(get_db),
):
    sort_by = "created_at"
    sort_order = "desc"
    if sort:
        sort_map = {
            "newest": ("created_at", "desc"),
            "price-asc": ("price", "asc"),
            "price-desc": ("price", "desc"),
            "name-asc": ("name", "asc"),
            "name-desc": ("name", "desc"),
        }
        sort_by, sort_order = sort_map.get(sort, ("created_at", "desc"))

    if search:
        result = await search_products(db, query=search, page=page, page_size=limit)
    else:
        result = await list_products(
            db,
            category_slug=category,
            size=size,
            color=color,
            min_price=min_price,
            max_price=max_price,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=limit,
        )

    return {
        "data": [_serialize_product(p) for p in result["items"]],
        "pagination": {
            "page": result["page"],
            "limit": limit,
            "total": result["total"],
            "totalPages": result["total_pages"],
        },
    }


@router.get("/featured", summary="San pham noi bat")
async def get_featured(db: AsyncSession = Depends(get_db)):
    result = await list_products(db, page=1, page_size=8)
    return {"success": True, "data": [_serialize_product(p) for p in result["items"]]}


@router.get("/new-arrivals", summary="San pham moi")
async def get_new_arrivals(db: AsyncSession = Depends(get_db)):
    result = await list_products(db, sort_by="created_at", sort_order="desc", page=1, page_size=8)
    return {"success": True, "data": [_serialize_product(p) for p in result["items"]]}


@router.get("/search", summary="Tim kiem san pham")
async def search(
    q: str = Query(..., min_length=1, max_length=200, description="Tu khoa tim kiem"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    result = await search_products(db, query=q, page=page, page_size=limit)
    return {"success": True, "data": [_serialize_product(p) for p in result["items"]]}


@router.get("/{slug}", summary="Lay chi tiet san pham theo slug")
async def get_product_detail(slug: str, db: AsyncSession = Depends(get_db)):
    try:
        product = await get_product(db, slug)
        return {"success": True, "data": _serialize_product(product)}
    except ProductError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# --- Danh muc ---

categories_router = APIRouter(prefix="/api/v1/categories", tags=["Danh muc"])


@categories_router.get("", summary="Lay danh sach danh muc")
async def get_categories(db: AsyncSession = Depends(get_db)):
    cats = await list_categories(db)
    return {"success": True, "data": [_serialize_category(c) for c in cats]}
