"""
Schema san pham, danh muc, bien the.
"""

from datetime import datetime

from pydantic import BaseModel, Field


# ---- Danh muc ----

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    description: str | None = None
    image_url: str | None = None
    parent_id: int | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    image_url: str | None = None
    parent_id: int | None = None
    children: list["CategoryResponse"] = []

    model_config = {"from_attributes": True}


# ---- Hinh anh ----

class ProductImageCreate(BaseModel):
    url: str
    alt_text: str | None = None
    position: int = 0


class ProductImageResponse(BaseModel):
    id: int
    url: str
    alt_text: str | None = None
    position: int

    model_config = {"from_attributes": True}


# ---- Bien the ----

class VariantCreate(BaseModel):
    size: str | None = None
    color: str | None = None
    sku: str = Field(min_length=1, max_length=100)
    price_override: float | None = None
    stock_quantity: int = Field(default=0, ge=0)


class VariantResponse(BaseModel):
    id: int
    size: str | None = None
    color: str | None = None
    sku: str
    price_override: float | None = None
    stock_quantity: int
    reserved_quantity: int
    available_quantity: int

    model_config = {"from_attributes": True}


# ---- San pham ----

class ProductCreate(BaseModel):
    """Tao san pham moi."""
    name: str = Field(min_length=1, max_length=500)
    slug: str = Field(min_length=1, max_length=500)
    description: str | None = None
    price: float = Field(gt=0, description="Gia ban (VND)")
    compare_at_price: float | None = Field(
        default=None, gt=0, description="Gia goc truoc khi giam"
    )
    category_id: int | None = None
    is_active: bool = True
    images: list[ProductImageCreate] = []
    variants: list[VariantCreate] = []


class ProductUpdate(BaseModel):
    """Cap nhat san pham."""
    name: str | None = Field(default=None, min_length=1, max_length=500)
    slug: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    price: float | None = Field(default=None, gt=0)
    compare_at_price: float | None = Field(default=None, gt=0)
    category_id: int | None = None
    is_active: bool | None = None


class ProductResponse(BaseModel):
    """Chi tiet san pham."""
    id: int
    name: str
    slug: str
    description: str | None = None
    price: float
    compare_at_price: float | None = None
    category_id: int | None = None
    category: CategoryResponse | None = None
    is_active: bool
    images: list[ProductImageResponse] = []
    variants: list[VariantResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    """San pham trong danh sach (khong kem bien the chi tiet)."""
    id: int
    name: str
    slug: str
    price: float
    compare_at_price: float | None = None
    is_active: bool
    image_url: str | None = None  # Hinh anh dau tien
    category: CategoryResponse | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductDetailResponse(ProductResponse):
    """Chi tiet san pham day du (alias cho ProductResponse)."""
    pass


class PaginatedProductResponse(BaseModel):
    """Ket qua phan trang san pham."""
    items: list[ProductListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ProductFilter(BaseModel):
    """Bo loc san pham."""
    category_id: int | None = None
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, ge=0)
    search: str | None = Field(default=None, max_length=200)
    is_active: bool | None = None
    sort_by: str = Field(
        default="created_at",
        pattern="^(created_at|price|name)$",
    )
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
