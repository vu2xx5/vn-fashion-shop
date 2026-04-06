"""
Router don hang - tao, xem, huy, cap nhat trang thai.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_admin, get_current_user
from app.models.cart import Cart, CartItem
from app.models.order import AuditLog, Order, OrderItem, OrderStatus
from app.models.product import ProductVariant
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderListResponse,
    OrderResponse,
    OrderStatusUpdate,
)
from app.services.cart import get_cart
from app.utils.security import generate_order_number

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])


def _serialize_order(order) -> dict:
    """Chuyen doi Order model sang format camelCase cho frontend."""
    items_data = []
    for item in (order.items or []):
        items_data.append({
            "id": str(item.id),
            "productId": str(item.variant_id or ""),
            "productName": item.product_name,
            "productImage": "",
            "variantInfo": item.variant_info,
            "quantity": item.quantity,
            "unitPrice": float(item.unit_price),
            "totalPrice": float(item.line_total),
        })
    return {
        "id": str(order.id),
        "orderNumber": order.order_number,
        "userId": str(order.user_id),
        "orderStatus": order.status.value,
        "subtotal": float(order.subtotal),
        "shippingCost": float(order.shipping_fee),
        "tax": 0,
        "discount": 0,
        "total": float(order.total),
        "shippingAddress": order.shipping_address or {},
        "shippingMethod": "standard",
        "paymentMethod": "cod",
        "paymentStatus": "pending",
        "note": order.notes,
        "items": items_data,
        "createdAt": order.created_at.isoformat() if order.created_at else None,
        "updatedAt": order.updated_at.isoformat() if order.updated_at else None,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_order(
    body: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Tao don hang tu gio hang hien tai.
    Chuyen tat ca items trong gio hang thanh order items.
    """
    # Lay gio hang
    cart = await get_cart(db, user_id=current_user.id)
    if cart is None or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gio hang trong. Vui long them san pham truoc khi dat hang.",
        )

    # Tinh tong tien va tao order items
    subtotal = 0
    order_items_data = []

    for cart_item in cart.items:
        variant = cart_item.variant
        product = variant.product if variant else None

        if variant is None or product is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="San pham khong ton tai. Vui long kiem tra gio hang.",
            )

        # Kiem tra ton kho
        if variant.stock_quantity < cart_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"San pham '{product.name}' khong du hang. "
                       f"Con lai: {variant.stock_quantity}.",
            )

        unit_price = float(variant.price_override or product.price)
        line_total = unit_price * cart_item.quantity
        subtotal += line_total

        variant_parts = []
        if variant.size:
            variant_parts.append(f"Size {variant.size}")
        if variant.color:
            variant_parts.append(variant.color)

        order_items_data.append({
            "variant_id": variant.id,
            "product_name": product.name,
            "variant_info": " - ".join(variant_parts) if variant_parts else "Default",
            "quantity": cart_item.quantity,
            "unit_price": unit_price,
        })

        # Giam ton kho
        variant.stock_quantity -= cart_item.quantity

    # Phi ship - mien phi don tren 500k
    shipping_fee = 0 if subtotal >= 500_000 else 30_000
    total = subtotal + shipping_fee

    # Dia chi giao hang
    shipping_address = body.shipping_address.model_dump()

    # Tao don hang
    order = Order(
        user_id=current_user.id,
        order_number=generate_order_number(),
        status=OrderStatus.PENDING,
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        total=total,
        shipping_address=shipping_address,
        notes=body.notes,
    )
    db.add(order)
    await db.flush()

    # Tao order items
    for item_data in order_items_data:
        order_item = OrderItem(order_id=order.id, **item_data)
        db.add(order_item)

    # Xoa gio hang
    for cart_item in cart.items:
        await db.delete(cart_item)

    await db.flush()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="create_order",
        entity_type="order",
        entity_id=order.id,
        details={"order_number": order.order_number, "total": float(total)},
    )
    db.add(audit)
    await db.flush()

    # Reload order with items
    stmt = (
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.items))
    )
    result = await db.execute(stmt)
    order = result.scalar_one()
    return {"success": True, "data": _serialize_order(order)}


@router.get("")
async def list_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lay danh sach don hang cua nguoi dung hien tai."""
    stmt = (
        select(Order)
        .where(Order.user_id == current_user.id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()

    data = [_serialize_order(order) for order in orders]
    return {"success": True, "data": data}


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lay chi tiet don hang."""
    stmt = (
        select(Order)
        .where(Order.id == order_id, Order.user_id == current_user.id)
        .options(selectinload(Order.items))
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Don hang khong ton tai.",
        )
    return {"success": True, "data": _serialize_order(order)}


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Huy don hang (chi cho phep khi trang thai la PENDING)."""
    stmt = (
        select(Order)
        .where(Order.id == order_id, Order.user_id == current_user.id)
        .options(selectinload(Order.items))
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Don hang khong ton tai.",
        )

    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Khong the huy don hang o trang thai '{order.status.value}'.",
        )

    # Hoan lai ton kho
    for item in order.items:
        if item.variant_id:
            variant_stmt = select(ProductVariant).where(
                ProductVariant.id == item.variant_id
            )
            variant_result = await db.execute(variant_stmt)
            variant = variant_result.scalar_one_or_none()
            if variant:
                variant.stock_quantity += item.quantity

    order.status = OrderStatus.CANCELLED
    await db.flush()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="cancel_order",
        entity_type="order",
        entity_id=order.id,
        details={"order_number": order.order_number},
    )
    db.add(audit)
    await db.flush()
    await db.refresh(order)

    return {"success": True, "data": _serialize_order(order)}


@router.put("/{order_id}/status")
async def admin_update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Cap nhat trang thai don hang (chi admin)."""
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Don hang khong ton tai.",
        )

    old_status = order.status
    order.status = body.status
    if body.notes:
        order.notes = body.notes

    await db.flush()

    # Audit log
    audit = AuditLog(
        user_id=admin_user.id,
        action="update_order_status",
        entity_type="order",
        entity_id=order.id,
        details={
            "order_number": order.order_number,
            "old_status": old_status.value,
            "new_status": body.status.value,
        },
    )
    db.add(audit)
    await db.flush()
    await db.refresh(order)

    return {"success": True, "data": _serialize_order(order)}
