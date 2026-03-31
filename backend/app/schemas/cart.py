"""
Schema gio hang.
"""

from pydantic import BaseModel, Field


class CartItemAdd(BaseModel):
    """Them san pham vao gio hang."""
    variant_id: int
    quantity: int = Field(default=1, ge=1, le=99)


class CartItemUpdate(BaseModel):
    """Cap nhat so luong trong gio hang."""
    quantity: int = Field(ge=0, le=99)  # quantity=0 nghia la xoa


class CartItemResponse(BaseModel):
    """Mot dong trong gio hang."""
    id: int
    variant_id: int
    quantity: int
    product_name: str | None = None
    variant_info: str | None = None  # VD: "Size M - Den"
    unit_price: float = 0
    line_total: float = 0

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    """Toan bo gio hang."""
    id: int
    items: list[CartItemResponse] = []
    total_items: int = 0
    subtotal: float = 0

    model_config = {"from_attributes": True}
