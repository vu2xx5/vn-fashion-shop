"""
Model san pham, danh muc, hinh anh, bien the.
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Category(Base):
    """Danh muc san pham - ho tro danh muc cha/con (self-referential)."""
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )

    # Quan he tu tham chieu
    parent: Mapped["Category | None"] = relationship(
        back_populates="children", remote_side="Category.id", lazy="selectin"
    )
    children: Mapped[list["Category"]] = relationship(
        back_populates="parent", lazy="selectin"
    )
    products: Mapped[list["Product"]] = relationship(
        back_populates="category", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name}>"


class Product(Base):
    """San pham thoi trang."""
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_category_id", "category_id"),
        Index("ix_products_slug", "slug", unique=True),
        Index("ix_products_is_active", "is_active"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(
        Numeric(12, 0), nullable=False  # Gia VND khong can thap phan
    )
    compare_at_price: Mapped[float | None] = mapped_column(
        Numeric(12, 0), nullable=True  # Gia goc truoc khi giam
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Quan he
    category: Mapped["Category | None"] = relationship(back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product", cascade="all, delete-orphan",
        lazy="selectin", order_by="ProductImage.position"
    )
    variants: Mapped[list["ProductVariant"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name}>"


class ProductImage(Base):
    """Hinh anh san pham."""
    __tablename__ = "product_images"
    __table_args__ = (
        Index("ix_product_images_product_id", "product_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(500), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Quan he
    product: Mapped["Product"] = relationship(back_populates="images")

    def __repr__(self) -> str:
        return f"<ProductImage id={self.id} product_id={self.product_id}>"


class ProductVariant(Base):
    """Bien the san pham (kich thuoc, mau sac, ton kho)."""
    __tablename__ = "product_variants"
    __table_args__ = (
        Index("ix_product_variants_product_id", "product_id"),
        Index("ix_product_variants_sku", "sku", unique=True),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    size: Mapped[str | None] = mapped_column(String(20), nullable=True)     # S, M, L, XL ...
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)    # Den, Trang, Do ...
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    price_override: Mapped[float | None] = mapped_column(
        Numeric(12, 0), nullable=True  # Gia rieng cho bien the (neu co)
    )
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reserved_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Quan he
    product: Mapped["Product"] = relationship(back_populates="variants")

    @property
    def available_quantity(self) -> int:
        """So luong co the ban."""
        return self.stock_quantity - self.reserved_quantity

    def __repr__(self) -> str:
        return f"<ProductVariant id={self.id} sku={self.sku}>"
