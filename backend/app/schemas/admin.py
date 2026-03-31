"""
Schemas quan tri.
"""

from typing import Optional

from pydantic import BaseModel, Field


class AdminOrderStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        description="Trang thai moi: paid, shipped, delivered, cancelled",
    )
    note: Optional[str] = Field(None, max_length=500)


class AdminMetricsResponse(BaseModel):
    total_orders: int = 0
    total_revenue: int = 0
    today_orders: int = 0
    today_revenue: int = 0
    orders_by_status: dict[str, int] = {}
