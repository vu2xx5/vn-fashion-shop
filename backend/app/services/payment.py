"""
Dich vu thanh toan - Stripe payment intent, webhook xu ly.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Optional

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models.order import AuditLog, Order, OrderStatus
from app.services.inventory import bulk_confirm_stock, bulk_release_stock

logger = logging.getLogger(__name__)
settings = get_settings()

# Cau hinh Stripe SDK
stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentError(Exception):
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


async def create_payment_intent(
    db: AsyncSession, order: Order
) -> dict[str, Any]:
    """
    Tao Stripe PaymentIntent cho don hang.
    Luu payment_intent_id vao order de theo doi.
    Don vi tien te la VND (khong co phan le).
    """
    current_status = order.status.value if isinstance(order.status, OrderStatus) else order.status
    if current_status != "pending":
        raise PaymentError("Chi co the thanh toan don hang dang cho xu ly.")

    if order.payment_intent_id:
        # Da co payment intent, tra ve thong tin cu
        try:
            intent = stripe.PaymentIntent.retrieve(order.payment_intent_id)
            return {
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "amount": intent.amount,
                "currency": intent.currency,
            }
        except stripe.error.InvalidRequestError:
            pass  # Intent khong con hop le, tao moi

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(order.total),  # VND khong co phan le
            currency=settings.STRIPE_CURRENCY,
            metadata={
                "order_id": str(order.id),
                "user_id": str(order.user_id),
            },
            description=f"VN Fashion Shop - Don hang #{order.order_number}",
            idempotency_key=f"order_{order.id}_payment",
        )
    except stripe.error.StripeError as e:
        logger.error("Stripe error khi tao payment intent: %s", str(e))
        raise PaymentError(f"Loi thanh toan: {str(e)}")

    # Luu payment intent ID vao order
    order.payment_intent_id = intent.id
    await db.flush()

    return {
        "client_secret": intent.client_secret,
        "payment_intent_id": intent.id,
        "amount": intent.amount,
        "currency": intent.currency,
    }


async def handle_webhook(
    db: AsyncSession, payload: bytes, sig_header: str
) -> dict[str, str]:
    """
    Xu ly Stripe webhook.
    Xac minh chu ky, xu ly cac su kien lien quan.
    Co che idempotency: kiem tra event_id da xu ly chua.
    """
    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except ValueError:
        raise PaymentError("Payload webhook khong hop le.", status_code=400)
    except stripe.error.SignatureVerificationError:
        raise PaymentError("Chu ky webhook khong hop le.", status_code=400)

    event_id = event.get("id")
    event_type = event.get("type")
    logger.info("Nhan webhook Stripe: type=%s, id=%s", event_type, event_id)

    # Idempotency: kiem tra audit log da ghi su kien nay chua
    existing_log = await db.execute(
        select(AuditLog).where(
            AuditLog.action.contains("payment"),
            AuditLog.details["stripe_event_id"].as_string() == event_id,
        )
    )
    if existing_log.scalar_one_or_none() is not None:
        logger.info("Webhook event %s da duoc xu ly truoc do.", event_id)
        return {"status": "already_processed"}

    # Xu ly tung loai su kien
    handlers = {
        "payment_intent.succeeded": _handle_payment_succeeded,
        "payment_intent.payment_failed": _handle_payment_failed,
    }

    handler = handlers.get(event_type)
    if handler is not None:
        await handler(db, event, event_id)
    else:
        logger.info("Bo qua webhook event type: %s", event_type)

    return {"status": "processed", "event_type": event_type}


async def _handle_payment_succeeded(
    db: AsyncSession, event: dict, event_id: str
) -> None:
    """Xu ly khi thanh toan thanh cong."""
    payment_intent = event["data"]["object"]
    order_id = payment_intent.get("metadata", {}).get("order_id")

    if not order_id:
        logger.warning("Payment succeeded nhung khong co order_id trong metadata.")
        return

    stmt = (
        select(Order)
        .where(Order.id == int(order_id))
        .options(selectinload(Order.items))
    )
    result = await db.execute(stmt)
    order = result.unique().scalar_one_or_none()

    if order is None:
        logger.warning("Order %s khong ton tai cho payment intent.", order_id)
        return

    current_status = order.status.value if isinstance(order.status, OrderStatus) else order.status
    if current_status != "pending":
        logger.info("Order %s da o trang thai %s, bo qua.", order_id, current_status)
        return

    # Cap nhat trang thai don hang sang "paid"
    order.status = OrderStatus.PAID
    order.updated_at = datetime.now(timezone.utc)

    # Xac nhan ton kho
    stock_items = [
        {"variant_id": item.variant_id, "quantity": item.quantity}
        for item in order.items
        if item.variant_id is not None
    ]
    await bulk_confirm_stock(db, stock_items)

    # Audit log voi idempotency marker
    audit = AuditLog(
        user_id=order.user_id,
        action="payment_succeeded",
        entity_type="order",
        entity_id=order.id,
        details={
            "old_status": "pending",
            "new_status": "paid",
            "stripe_event_id": event_id,
            "note": "Thanh toan thanh cong qua Stripe.",
        },
    )
    db.add(audit)
    await db.flush()

    logger.info("Don hang %s da duoc xac nhan thanh toan.", order_id)


async def _handle_payment_failed(
    db: AsyncSession, event: dict, event_id: str
) -> None:
    """Xu ly khi thanh toan that bai."""
    payment_intent = event["data"]["object"]
    order_id = payment_intent.get("metadata", {}).get("order_id")

    if not order_id:
        return

    stmt = (
        select(Order)
        .where(Order.id == int(order_id))
        .options(selectinload(Order.items))
    )
    result = await db.execute(stmt)
    order = result.unique().scalar_one_or_none()

    if order is None:
        return

    current_status = order.status.value if isinstance(order.status, OrderStatus) else order.status
    if current_status != "pending":
        return

    # Giai phong ton kho da giu cho
    stock_items = [
        {"variant_id": item.variant_id, "quantity": item.quantity}
        for item in order.items
        if item.variant_id is not None
    ]
    await bulk_release_stock(db, stock_items)

    # Audit log
    failure_message = (
        payment_intent.get("last_payment_error", {}).get("message", "Khong ro ly do")
    )
    audit = AuditLog(
        user_id=order.user_id,
        action="payment_failed",
        entity_type="order",
        entity_id=order.id,
        details={
            "old_status": current_status,
            "stripe_event_id": event_id,
            "note": f"Thanh toan that bai: {failure_message}.",
        },
    )
    db.add(audit)
    await db.flush()

    logger.warning("Thanh toan that bai cho don hang %s: %s", order_id, failure_message)
