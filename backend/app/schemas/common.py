"""
Schema dung chung - phan trang, thong bao.
"""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class MessageResponse(BaseModel):
    """Phan hoi thong bao don gian."""
    message: str
    success: bool = True


class PaginatedResponse(BaseModel, Generic[T]):
    """Phan hoi co phan trang."""
    items: list[T]
    total: int = Field(description="Tong so ban ghi")
    page: int = Field(ge=1, description="Trang hien tai")
    page_size: int = Field(ge=1, le=100, description="So ban ghi moi trang")
    total_pages: int = Field(description="Tong so trang")
