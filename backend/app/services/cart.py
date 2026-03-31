"""
Dich vu gio hang - them, sua, xoa, lay gio hang.
"""

from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.cart import Cart, CartItem
from app.models.product import Product, ProductVariant
from app.services.inventory import check_stock


class CartError(Exception):
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


async def get_or_create_cart(
    db: AsyncSession,
    user_id: Optional[int] = None,
    session_id: Optional[str] = None,
) -> Cart:
    """
    Lay gio hang hien tai hoac tao moi.
    Uu tien user_id; neu chua dang nhap dung session_id.
    """
    cart = await _find_cart(db, user_id=user_id, session_id=session_id)
    if cart is not None:
        return cart

    cart = Cart(user_id=user_id, session_id=session_id)
    db.add(cart)
    await db.flush()
    await db.refresh(cart)
    return cart


async def get_cart(
    db: AsyncSession,
    user_id: Optional[int] = None,
    session_id: Optional[str] = None,
) -> Optional[Cart]:
    """
    Lay gio hang voi day du thong tin items, variants, products.
    """
    cart = await _find_cart(db, user_id=user_id, session_id=session_id)
    if cart is None:
        return None

    # Load day du quan he
    stmt = (
        select(Cart)
        .where(Cart.id == cart.id)
        .options(
            selectinload(Cart.items).joinedload(CartItem.variant).joinedload(
                ProductVariant.product
            ).selectinload(Product.images),
        )
    )
    result = await db.execute(stmt)
    return result.unique().scalar_one_or_none()


async def add_to_cart(
    db: AsyncSession,
    cart: Cart,
    variant_id: int,
    quantity: int,
) -> CartItem:
    """
    Them san pham vao gio hang.
    Neu da co variant nay trong gio thi tang so luong.
    Kiem tra ton kho truoc khi them.
    """
    if quantity <= 0:
        raise CartError("So luong phai lon hon 0.")

    # Kiem tra variant ton tai
    variant = await _get_variant(db, variant_id)

    # Kiem tra da co trong gio chua
    stmt = select(CartItem).where(
        CartItem.cart_id == cart.id,
        CartItem.variant_id == variant_id,
    )
    result = await db.execute(stmt)
    existing_item = result.scalar_one_or_none()

    total_quantity = quantity
    if existing_item is not None:
        total_quantity += existing_item.quantity

    # Kiem tra ton kho
    in_stock = await check_stock(db, variant_id, total_quantity)
    if not in_stock:
        raise CartError(
            f"Khong du hang trong kho. Chi con {variant.stock_quantity} san pham.",
            status_code=409,
        )

    if existing_item is not None:
        existing_item.quantity = total_quantity
        await db.flush()
        await db.refresh(existing_item)
        return existing_item

    item = CartItem(
        cart_id=cart.id,
        variant_id=variant_id,
        quantity=quantity,
        unit_price=variant.product.price if hasattr(variant, "product") and variant.product else 0,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def update_cart_item(
    db: AsyncSession,
    cart: Cart,
    item_id: int,
    quantity: int,
) -> CartItem:
    """
    Cap nhat so luong san pham trong gio hang.
    """
    if quantity <= 0:
        raise CartError("So luong phai lon hon 0. Dung xoa de bo san pham.")

    item = await _get_cart_item(db, cart.id, item_id)

    in_stock = await check_stock(db, item.variant_id, quantity)
    if not in_stock:
        raise CartError("Khong du hang trong kho.", status_code=409)

    item.quantity = quantity
    await db.flush()
    await db.refresh(item)
    return item


async def remove_from_cart(
    db: AsyncSession,
    cart: Cart,
    item_id: int,
) -> None:
    """Xoa san pham khoi gio hang."""
    item = await _get_cart_item(db, cart.id, item_id)
    await db.delete(item)
    await db.flush()


async def merge_cart(
    db: AsyncSession, user_id: int, session_id: str
) -> Optional[Cart]:
    """
    Gop gio hang khach (session) vao gio hang user sau khi dang nhap.
    """
    guest_cart = await _find_cart(db, session_id=session_id)
    if guest_cart is None:
        return await _find_cart(db, user_id=user_id)

    user_cart = await _find_cart(db, user_id=user_id)
    if user_cart is None:
        # Chuyen gio khach thanh gio user
        guest_cart.user_id = user_id
        guest_cart.session_id = None
        await db.flush()
        return guest_cart

    # Gop items tu gio khach sang gio user
    guest_items_stmt = select(CartItem).where(CartItem.cart_id == guest_cart.id)
    guest_items_result = await db.execute(guest_items_stmt)
    guest_items = guest_items_result.scalars().all()

    for guest_item in guest_items:
        user_item_stmt = select(CartItem).where(
            CartItem.cart_id == user_cart.id,
            CartItem.variant_id == guest_item.variant_id,
        )
        user_item_result = await db.execute(user_item_stmt)
        user_item = user_item_result.scalar_one_or_none()

        if user_item is not None:
            user_item.quantity += guest_item.quantity
        else:
            guest_item.cart_id = user_cart.id
            # flush to move item before deleting guest cart

    await db.delete(guest_cart)
    await db.flush()
    return user_cart


# ---------- Helpers ----------


async def _find_cart(
    db: AsyncSession,
    user_id: Optional[int] = None,
    session_id: Optional[str] = None,
) -> Optional[Cart]:
    """Tim gio hang theo user_id hoac session_id."""
    if user_id is not None:
        stmt = select(Cart).where(Cart.user_id == user_id)
    elif session_id is not None:
        stmt = select(Cart).where(Cart.session_id == session_id)
    else:
        return None

    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _get_variant(db: AsyncSession, variant_id: int) -> ProductVariant:
    """Lay bien the san pham, raise loi neu khong ton tai."""
    stmt = (
        select(ProductVariant)
        .where(ProductVariant.id == variant_id)
        .options(joinedload(ProductVariant.product))
    )
    result = await db.execute(stmt)
    variant = result.unique().scalar_one_or_none()
    if variant is None:
        raise CartError("Bien the san pham khong ton tai.", status_code=404)
    return variant


async def _get_cart_item(db: AsyncSession, cart_id: int, item_id: int) -> CartItem:
    """Lay item trong gio hang, raise loi neu khong ton tai."""
    stmt = select(CartItem).where(
        CartItem.id == item_id,
        CartItem.cart_id == cart_id,
    )
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()
    if item is None:
        raise CartError("San pham khong co trong gio hang.", status_code=404)
    return item
