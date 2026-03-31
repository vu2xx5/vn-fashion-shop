"""
Dich vu ton kho - kiem tra, giu cho, giai phong, xac nhan.
Su dung SELECT FOR UPDATE de dam bao toan ven du lieu.
"""

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import ProductVariant


class InventoryError(Exception):
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


async def check_stock(db: AsyncSession, variant_id: int, quantity: int) -> bool:
    """
    Kiem tra co du hang trong kho khong.
    Tra ve True neu stock_quantity >= quantity.
    """
    stmt = select(ProductVariant.stock_quantity).where(
        ProductVariant.id == variant_id
    )
    result = await db.execute(stmt)
    stock = result.scalar_one_or_none()
    if stock is None:
        return False
    return stock >= quantity


async def reserve_stock(db: AsyncSession, variant_id: int, quantity: int) -> None:
    """
    Giu cho hang - giam stock_quantity, tang reserved_quantity.
    Su dung SELECT FOR UPDATE de tranh race condition.
    Raise InventoryError neu khong du hang.
    """
    stmt = (
        select(ProductVariant)
        .where(ProductVariant.id == variant_id)
        .with_for_update()
    )
    result = await db.execute(stmt)
    variant = result.scalar_one_or_none()

    if variant is None:
        raise InventoryError("Bien the san pham khong ton tai.", status_code=404)

    available = variant.stock_quantity - getattr(variant, "reserved_quantity", 0)
    if available < quantity:
        raise InventoryError(
            f"Khong du hang trong kho cho '{variant_id}'. "
            f"Con lai: {available}, yeu cau: {quantity}.",
            status_code=409,
        )

    variant.stock_quantity -= quantity
    variant.reserved_quantity = getattr(variant, "reserved_quantity", 0) + quantity
    await db.flush()


async def release_stock(db: AsyncSession, variant_id: int, quantity: int) -> None:
    """
    Giai phong hang da giu cho - tang lai stock_quantity, giam reserved_quantity.
    Goi khi don hang bi huy truoc khi thanh toan.
    """
    stmt = (
        select(ProductVariant)
        .where(ProductVariant.id == variant_id)
        .with_for_update()
    )
    result = await db.execute(stmt)
    variant = result.scalar_one_or_none()

    if variant is None:
        raise InventoryError("Bien the san pham khong ton tai.", status_code=404)

    variant.stock_quantity += quantity
    current_reserved = getattr(variant, "reserved_quantity", 0)
    variant.reserved_quantity = max(0, current_reserved - quantity)
    await db.flush()


async def confirm_stock(db: AsyncSession, variant_id: int, quantity: int) -> None:
    """
    Xac nhan hang da ban - giam reserved_quantity sau khi thanh toan thanh cong.
    stock_quantity da duoc giam tu buoc reserve.
    """
    stmt = (
        select(ProductVariant)
        .where(ProductVariant.id == variant_id)
        .with_for_update()
    )
    result = await db.execute(stmt)
    variant = result.scalar_one_or_none()

    if variant is None:
        raise InventoryError("Bien the san pham khong ton tai.", status_code=404)

    current_reserved = getattr(variant, "reserved_quantity", 0)
    variant.reserved_quantity = max(0, current_reserved - quantity)
    await db.flush()


async def bulk_reserve_stock(
    db: AsyncSession, items: list[dict]
) -> None:
    """
    Giu cho nhieu san pham cung luc (dung khi tao don hang).
    items: [{"variant_id": int, "quantity": int}, ...]
    Tat ca se duoc reserve hoac khong co gi duoc reserve (atomic).
    """
    reserved: list[dict] = []
    try:
        for item in items:
            await reserve_stock(db, item["variant_id"], item["quantity"])
            reserved.append(item)
    except InventoryError:
        # Rollback cac item da reserve
        for r in reserved:
            await release_stock(db, r["variant_id"], r["quantity"])
        raise


async def bulk_release_stock(
    db: AsyncSession, items: list[dict]
) -> None:
    """Giai phong nhieu san pham cung luc."""
    for item in items:
        await release_stock(db, item["variant_id"], item["quantity"])


async def bulk_confirm_stock(
    db: AsyncSession, items: list[dict]
) -> None:
    """Xac nhan nhieu san pham cung luc sau thanh toan."""
    for item in items:
        await confirm_stock(db, item["variant_id"], item["quantity"])
