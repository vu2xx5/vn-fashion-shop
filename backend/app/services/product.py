"""
Dich vu san pham - CRUD, tim kiem, loc, phan trang.
"""

from typing import Any, Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.product import Category, Product, ProductImage, ProductVariant


class ProductError(Exception):
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


async def list_products(
    db: AsyncSession,
    *,
    category_slug: Optional[str] = None,
    size: Optional[str] = None,
    color: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 20,
) -> dict[str, Any]:
    """
    Lay danh sach san pham voi bo loc, sap xep, phan trang.
    Tra ve dict chua items + thong tin phan trang.
    """
    stmt = (
        select(Product)
        .where(Product.is_active == True)  # noqa: E712
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            joinedload(Product.category),
        )
    )

    # --- Bo loc ---
    if category_slug:
        stmt = stmt.join(Product.category).where(Category.slug == category_slug)

    if size or color:
        # Loc theo bien the san pham
        variant_filters = []
        if size:
            variant_filters.append(ProductVariant.size == size)
        if color:
            variant_filters.append(ProductVariant.color == color)

        variant_subq = (
            select(ProductVariant.product_id)
            .where(*variant_filters)
            .distinct()
            .subquery()
        )
        stmt = stmt.where(Product.id.in_(select(variant_subq.c.product_id)))

    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price)

    # --- Dem tong ---
    count_stmt = select(func.count()).select_from(
        stmt.with_only_columns(Product.id).subquery()
    )
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    # --- Sap xep ---
    sort_column = _get_sort_column(sort_by)
    if sort_order == "asc":
        stmt = stmt.order_by(sort_column.asc())
    else:
        stmt = stmt.order_by(sort_column.desc())

    # --- Phan trang ---
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await db.execute(stmt)
    products = result.unique().scalars().all()

    return {
        "items": list(products),
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
    }


async def get_product(db: AsyncSession, slug: str) -> Product:
    """
    Lay chi tiet san pham theo slug, kem hinh anh, bien the, danh muc.
    """
    stmt = (
        select(Product)
        .where(Product.slug == slug, Product.is_active == True)  # noqa: E712
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            joinedload(Product.category),
        )
    )
    result = await db.execute(stmt)
    product = result.unique().scalar_one_or_none()
    if product is None:
        raise ProductError("San pham khong ton tai.", status_code=404)
    return product


async def create_product(db: AsyncSession, data: dict[str, Any]) -> Product:
    """
    Tao san pham moi (admin).
    data bao gom thong tin san pham, danh sach variants va images.
    """
    variants_data = data.pop("variants", [])
    images_data = data.pop("images", [])

    product = Product(**data)
    db.add(product)
    await db.flush()

    for v in variants_data:
        variant = ProductVariant(product_id=product.id, **v)
        db.add(variant)

    for idx, img in enumerate(images_data):
        image = ProductImage(
            product_id=product.id,
            url=img["url"],
            alt_text=img.get("alt_text", ""),
            position=img.get("position", idx),
        )
        db.add(image)

    await db.flush()
    await db.refresh(product)

    # Load lai quan he
    stmt = (
        select(Product)
        .where(Product.id == product.id)
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            joinedload(Product.category),
        )
    )
    result = await db.execute(stmt)
    return result.unique().scalar_one()


async def update_product(
    db: AsyncSession, product_id: int, data: dict[str, Any]
) -> Product:
    """
    Cap nhat san pham (admin).
    Chi cap nhat cac truong duoc truyen vao.
    """
    stmt = (
        select(Product)
        .where(Product.id == product_id)
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            joinedload(Product.category),
        )
    )
    result = await db.execute(stmt)
    product = result.unique().scalar_one_or_none()
    if product is None:
        raise ProductError("San pham khong ton tai.", status_code=404)

    # Cap nhat variants neu co
    variants_data = data.pop("variants", None)
    images_data = data.pop("images", None)

    for key, value in data.items():
        if hasattr(product, key):
            setattr(product, key, value)

    if variants_data is not None:
        # Xoa bien the cu va tao moi
        for existing_variant in product.variants:
            await db.delete(existing_variant)
        for v in variants_data:
            variant = ProductVariant(product_id=product.id, **v)
            db.add(variant)

    if images_data is not None:
        for existing_image in product.images:
            await db.delete(existing_image)
        for idx, img in enumerate(images_data):
            image = ProductImage(
                product_id=product.id,
                url=img["url"],
                alt_text=img.get("alt_text", ""),
                position=img.get("position", idx),
            )
            db.add(image)

    await db.flush()
    await db.refresh(product)

    # Reload
    stmt = (
        select(Product)
        .where(Product.id == product.id)
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            joinedload(Product.category),
        )
    )
    result = await db.execute(stmt)
    return result.unique().scalar_one()


async def search_products(
    db: AsyncSession,
    query: str,
    page: int = 1,
    page_size: int = 20,
) -> dict[str, Any]:
    """
    Tim kiem san pham theo ten hoac mo ta (ILIKE).
    """
    search_term = f"%{query}%"
    stmt = (
        select(Product)
        .where(
            Product.is_active == True,  # noqa: E712
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
            ),
        )
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            joinedload(Product.category),
        )
    )

    count_stmt = select(func.count()).select_from(
        stmt.with_only_columns(Product.id).subquery()
    )
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    stmt = stmt.order_by(Product.name.asc()).offset(offset).limit(page_size)

    result = await db.execute(stmt)
    products = result.unique().scalars().all()

    return {
        "items": list(products),
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
    }


async def list_categories(db: AsyncSession) -> list[Category]:
    """Lay tat ca danh muc."""
    from sqlalchemy.orm import selectinload
    stmt = (
        select(Category)
        .where(Category.parent_id == None)  # noqa: E711
        .options(selectinload(Category.children), selectinload(Category.products))
        .order_by(Category.name.asc())
    )
    result = await db.execute(stmt)
    return list(result.unique().scalars().all())


async def get_product_by_id(db: AsyncSession, product_id: int) -> Product:
    """Lay san pham theo ID (dung cho admin)."""
    stmt = (
        select(Product)
        .where(Product.id == product_id)
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            joinedload(Product.category),
        )
    )
    result = await db.execute(stmt)
    product = result.unique().scalar_one_or_none()
    if product is None:
        raise ProductError("San pham khong ton tai.", status_code=404)
    return product


def _get_sort_column(sort_by: str):
    """Map ten truong sap xep sang column cua Product."""
    mapping = {
        "created_at": Product.created_at,
        "price": Product.price,
        "name": Product.name,
        "updated_at": Product.updated_at,
    }
    return mapping.get(sort_by, Product.created_at)
