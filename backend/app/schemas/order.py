"""
Schema don hang.
"""

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.order import OrderStatus


# ---- Dia chi giao hang trong don ----

class ShippingAddressInput(BaseModel):
    """Dia chi giao hang khi dat don."""
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=20)
    street: str = Field(min_length=1, max_length=500)
    ward: str = Field(min_length=1, max_length=100)
    district: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=100)


# ---- Don hang ----

class OrderCreate(BaseModel):
    """Tao don hang moi."""
    shipping_address: ShippingAddressInput
    address_id: int | None = Field(
        default=None,
        description="ID dia chi da luu (neu co, se ghi de shipping_address)",
    )
    notes: str | None = Field(default=None, max_length=1000)


class OrderItemResponse(BaseModel):
    """Mot dong trong don hang."""
    id: int
    variant_id: int | None
    product_name: str
    variant_info: str
    quantity: int
    unit_price: float
    line_total: float

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    """Chi tiet don hang."""
    id: int
    order_number: str
    status: OrderStatus
    subtotal: float
    shipping_fee: float
    total: float
    shipping_address: dict
    payment_intent_id: str | None = None
    notes: str | None = None
    items: list[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    """Don hang trong danh sach (rut gon)."""
    id: int
    order_number: str
    status: OrderStatus
    total: float
    total_items: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    """Cap nhat trang thai don hang (admin)."""
    status: OrderStatus
    notes: str | None = Field(default=None, max_length=1000)


class OrderDetailResponse(OrderResponse):
    """Chi tiet don hang day du (alias cho OrderResponse)."""
    pass


class PaginatedOrderResponse(BaseModel):
    """Ket qua phan trang don hang."""
    items: list[OrderListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
