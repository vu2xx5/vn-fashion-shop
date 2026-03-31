"""
Router thanh toan - tao payment intent, tao don hang, shipping options.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.checkout import (
    CreateOrderRequest,
    CreateOrderResponse,
    PaymentIntentRequest,
    PaymentIntentResponse,
    ShippingOption,
)
from app.services.cart import CartError, get_cart, get_or_create_cart
from app.services.email import send_order_confirmation
from app.services.order import OrderError, create_order, get_order
from app.services.payment import PaymentError, create_payment_intent

router = APIRouter(prefix="/api/v1/checkout", tags=["Thanh toan"])


@router.post(
    "/create-order",
    response_model=CreateOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tao don hang tu gio hang",
)
async def create_order_endpoint(
    body: CreateOrderRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Tao don hang tu gio hang hien tai.
    Yeu cau nguoi dung da dang nhap va co dia chi giao hang.
    """
    cart = await get_cart(db, user_id=user.id)
    if cart is None or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gio hang trong.",
        )

    try:
        order = await create_order(
            db,
            user=user,
            cart=cart,
            address_id=body.address_id,
            shipping_option=body.shipping_option,
            note=body.note,
        )
    except OrderError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

    return CreateOrderResponse(
        order_id=order.id,
        total=order.total,
        status=order.status,
        message="Don hang da duoc tao thanh cong.",
    )


@router.post(
    "/create-payment-intent",
    response_model=PaymentIntentResponse,
    summary="Tao Stripe payment intent cho don hang",
)
async def create_payment_intent_endpoint(
    body: PaymentIntentRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Tao payment intent de thanh toan qua Stripe."""
    try:
        order = await get_order(db, body.order_id, user_id=user.id)
    except OrderError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

    try:
        intent_data = await create_payment_intent(db, order)
        return PaymentIntentResponse(**intent_data)
    except PaymentError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get(
    "/shipping-options",
    response_model=list[ShippingOption],
    summary="Lay danh sach phuong thuc van chuyen",
)
async def get_shipping_options():
    """Tra ve cac phuong thuc van chuyen kha dung."""
    return [
        ShippingOption(
            id="standard",
            name="Giao hang tieu chuan",
            description="Nhan hang trong 3-5 ngay lam viec",
            price=30_000,
            estimated_days="3-5 ngay",
        ),
        ShippingOption(
            id="express",
            name="Giao hang nhanh",
            description="Nhan hang trong 1-2 ngay lam viec",
            price=50_000,
            estimated_days="1-2 ngay",
        ),
        ShippingOption(
            id="same_day",
            name="Giao hang trong ngay",
            description="Nhan hang trong ngay (noi thanh HN, HCM)",
            price=80_000,
            estimated_days="Trong ngay",
        ),
    ]
