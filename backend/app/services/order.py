"""
Dich vu don hang - tao, xem, cap nhat trang thai, huy.
"""

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import Cart, CartItem
from app.models.order import AuditLog, Order, OrderItem, OrderStatus
from app.models.product import ProductVariant
from app.models.user import Address, User
from app.services.inventory import bulk_release_stock, bulk_reserve_stock
from app.utils.security import generate_order_number


class OrderError(Exception):
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


# Dinh nghia trang thai don hang hop le (khop voi OrderStatus enum)
ORDER_STATUS_FLOW = {
    "pending": ["paid", "cancelled"],
    "paid": ["shipped", "cancelled"],
    "shipped": ["delivered"],
    "delivered": [],
    "cancelled": [],
}


async def create_order(
    db: AsyncSession,
    user: User,
    cart: Cart,
    address_id: int,
    shipping_option: str = "standard",
    note: Optional[str] = None,
) -> Order:
    """
    Tao don hang tu gio hang.
    - Kiem tra gio hang co san pham
    - Tinh tong tien
    - Giu cho ton kho
    - Tao don hang va cac order items
    - Xoa gio hang
    """
    from sqlalchemy.orm import joinedload

    # Load cart items voi variant va product
    cart_items_stmt = (
        select(CartItem)
        .where(CartItem.cart_id == cart.id)
        .options(
            joinedload(CartItem.variant).joinedload(ProductVariant.product)
        )
    )
    result = await db.execute(cart_items_stmt)
    cart_items = result.unique().scalars().all()

    if not cart_items:
        raise OrderError("Gio hang trong. Khong the tao don hang.")

    # Kiem tra dia chi
    addr_stmt = select(Address).where(
        Address.id == address_id, Address.user_id == user.id
    )
    addr_result = await db.execute(addr_stmt)
    address = addr_result.scalar_one_or_none()
    if address is None:
        raise OrderError("Dia chi khong ton tai.", status_code=404)

    # Tinh toan
    shipping_fee = _calculate_shipping(shipping_option)
    subtotal = sum(
        float(item.variant.price_override or item.variant.product.price) * item.quantity
        for item in cart_items
    )
    total = subtotal + shipping_fee

    # Giu cho ton kho
    stock_items = [
        {"variant_id": item.variant_id, "quantity": item.quantity}
        for item in cart_items
    ]
    await bulk_reserve_stock(db, stock_items)

    # Snapshot dia chi giao hang thanh JSONB dict
    shipping_address_data = {
        "full_name": address.full_name,
        "phone": address.phone or user.phone or "",
        "street": address.street,
        "ward": address.ward,
        "district": address.district,
        "city": address.city,
    }

    # Tao don hang
    order = Order(
        user_id=user.id,
        order_number=generate_order_number(),
        status=OrderStatus.PENDING,
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        total=total,
        shipping_address=shipping_address_data,
        notes=note,
    )
    db.add(order)
    await db.flush()

    # Tao order items
    for cart_item in cart_items:
        variant = cart_item.variant
        product = variant.product
        unit_price = float(variant.price_override or product.price)

        variant_parts = []
        if variant.size:
            variant_parts.append(f"Size {variant.size}")
        if variant.color:
            variant_parts.append(variant.color)

        order_item = OrderItem(
            order_id=order.id,
            variant_id=cart_item.variant_id,
            product_name=product.name,
            variant_info=" - ".join(variant_parts) if variant_parts else "Default",
            quantity=cart_item.quantity,
            unit_price=unit_price,
        )
        db.add(order_item)

    # Tao audit log
    audit = AuditLog(
        user_id=user.id,
        action="create_order",
        entity_type="order",
        entity_id=order.id,
        details={"order_number": order.order_number, "total": float(total)},
    )
    db.add(audit)

    # Xoa gio hang
    for cart_item in cart_items:
        await db.delete(cart_item)
    await db.delete(cart)

    await db.flush()
    await db.refresh(order)
    return order


async def get_user_orders(
    db: AsyncSession,
    user_id: int,
    page: int = 1,
    page_size: int = 10,
) -> dict[str, Any]:
    """Lay danh sach don hang cua user voi phan trang."""
    base_stmt = select(Order).where(Order.user_id == user_id)

    count_stmt = select(func.count()).select_from(base_stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    stmt = (
        base_stmt
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    orders = result.unique().scalars().all()

    return {
        "items": list(orders),
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
    }


async def get_order(
    db: AsyncSession, order_id: int, user_id: Optional[int] = None
) -> Order:
    """
    Lay chi tiet don hang.
    Neu user_id duoc truyen, chi tra ve don hang cua user do.
    """
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    if user_id is not None:
        stmt = stmt.where(Order.user_id == user_id)

    result = await db.execute(stmt)
    order = result.unique().scalar_one_or_none()
    if order is None:
        raise OrderError("Don hang khong ton tai.", status_code=404)
    return order


async def update_order_status(
    db: AsyncSession,
    order_id: int,
    new_status: str,
    admin_id: Optional[int] = None,
    note: Optional[str] = None,
) -> Order:
    """
    Cap nhat trang thai don hang (admin).
    Kiem tra luong trang thai hop le.
    """
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    result = await db.execute(stmt)
    order = result.unique().scalar_one_or_none()
    if order is None:
        raise OrderError("Don hang khong ton tai.", status_code=404)

    current_status = order.status.value if isinstance(order.status, OrderStatus) else order.status
    allowed = ORDER_STATUS_FLOW.get(current_status, [])
    if new_status not in allowed:
        raise OrderError(
            f"Khong the chuyen trang thai tu '{current_status}' sang '{new_status}'. "
            f"Trang thai hop le: {', '.join(allowed) if allowed else 'khong co'}."
        )

    old_status = current_status
    order.status = new_status
    order.updated_at = datetime.now(timezone.utc)

    # Ghi audit log
    audit = AuditLog(
        user_id=admin_id,
        action="status_change",
        entity_type="order",
        entity_id=order.id,
        details={
            "old_status": old_status,
            "new_status": new_status,
            "note": note or f"Trang thai chuyen tu {old_status} sang {new_status}.",
        },
    )
    db.add(audit)

    await db.flush()
    await db.refresh(order)
    return order


async def cancel_order(
    db: AsyncSession, order_id: int, user_id: int
) -> Order:
    """
    Huy don hang (user).
    Chi cho phep huy khi trang thai la pending hoac paid.
    Giai phong ton kho da giu cho.
    """
    stmt = (
        select(Order)
        .where(Order.id == order_id, Order.user_id == user_id)
        .options(selectinload(Order.items))
    )
    result = await db.execute(stmt)
    order = result.unique().scalar_one_or_none()
    if order is None:
        raise OrderError("Don hang khong ton tai.", status_code=404)

    current_status = order.status.value if isinstance(order.status, OrderStatus) else order.status
    if current_status not in ("pending", "paid"):
        raise OrderError(
            "Chi co the huy don hang o trang thai 'cho xu ly' hoac 'da thanh toan'."
        )

    old_status = current_status
    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.now(timezone.utc)

    # Giai phong ton kho
    stock_items = [
        {"variant_id": item.variant_id, "quantity": item.quantity}
        for item in order.items
    ]
    await bulk_release_stock(db, stock_items)

    # Audit log
    audit = AuditLog(
        user_id=user_id,
        action="cancel_order",
        entity_type="order",
        entity_id=order.id,
        details={
            "old_status": old_status,
            "new_status": "cancelled",
            "note": "Don hang bi huy boi nguoi dung.",
        },
    )
    db.add(audit)

    await db.flush()
    await db.refresh(order)
    return order


async def list_all_orders(
    db: AsyncSession,
    *,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict[str, Any]:
    """Lay tat ca don hang (admin), co loc theo trang thai."""
    base_stmt = select(Order)
    if status:
        base_stmt = base_stmt.where(Order.status == status)

    count_stmt = select(func.count()).select_from(base_stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    stmt = (
        base_stmt
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    orders = result.unique().scalars().all()

    return {
        "items": list(orders),
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
    }


async def get_admin_metrics(db: AsyncSession) -> dict[str, Any]:
    """Lay thong ke co ban cho admin dashboard."""
    # Tong don hang
    total_orders_result = await db.execute(select(func.count(Order.id)))
    total_orders = total_orders_result.scalar() or 0

    # Tong doanh thu (chi tinh don delivered)
    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.total), 0)).where(
            Order.status == "delivered"
        )
    )
    total_revenue = revenue_result.scalar() or 0

    # Don hang theo trang thai
    status_counts_result = await db.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    )
    status_counts = {row[0]: row[1] for row in status_counts_result.all()}

    # Don hang hom nay
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    today_orders_result = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= today_start)
    )
    today_orders = today_orders_result.scalar() or 0

    # Doanh thu hom nay
    today_revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.total), 0)).where(
            Order.created_at >= today_start,
            Order.status == "delivered",
        )
    )
    today_revenue = today_revenue_result.scalar() or 0

    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "today_orders": today_orders,
        "today_revenue": today_revenue,
        "orders_by_status": status_counts,
    }


def _calculate_shipping(shipping_option: str) -> int:
    """Tinh phi van chuyen theo phuong thuc. Don vi: VND."""
    shipping_rates = {
        "standard": 30_000,
        "express": 50_000,
        "same_day": 80_000,
    }
    return shipping_rates.get(shipping_option, 30_000)
