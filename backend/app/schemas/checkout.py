"""
Schemas thanh toan va van chuyen.
"""

from typing import Optional

from pydantic import BaseModel, Field


class CreateOrderRequest(BaseModel):
    address_id: int
    shipping_option: str = Field("standard", description="standard | express | same_day")
    note: Optional[str] = Field(None, max_length=500)


class CreateOrderResponse(BaseModel):
    order_id: int
    total: int
    status: str
    message: str


class PaymentIntentRequest(BaseModel):
    order_id: int


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: int
    currency: str


class ShippingOption(BaseModel):
    id: str
    name: str
    description: str
    price: int
    estimated_days: str
