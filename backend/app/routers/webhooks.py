"""
Router webhook - xu ly callback tu Stripe.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.services.payment import PaymentError, handle_webhook

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/webhooks", tags=["Webhooks"])


@router.post(
    "/stripe",
    status_code=status.HTTP_200_OK,
    summary="Stripe webhook endpoint",
)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db),
):
    """
    Nhan va xu ly webhook tu Stripe.
    Xac minh chu ky truoc khi xu ly.
    Can doc raw body (bytes) de xac minh.
    """
    payload = await request.body()

    try:
        result = await handle_webhook(db, payload, stripe_signature)
        return result
    except PaymentError as e:
        logger.warning("Webhook error: %s", e.detail)
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.exception("Loi khong mong doi khi xu ly Stripe webhook")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Loi xu ly webhook.",
        )
