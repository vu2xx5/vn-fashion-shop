"""
Model gio hang - Ho tro ca khach vang lai (guest) va nguoi dung da dang nhap.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Cart(Base):
    """Gio hang - user_id nullable de ho tro khach vang lai qua session_id."""
    __tablename__ = "carts"
    __table_args__ = (
        Index("ix_carts_user_id", "user_id"),
        Index("ix_carts_session_id", "session_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
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
    items: Mapped[list["CartItem"]] = relationship(
        back_populates="cart", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Cart id={self.id} user_id={self.user_id}>"


class CartItem(Base):
    """Mot dong trong gio hang."""
    __tablename__ = "cart_items"
    __table_args__ = (
        Index("ix_cart_items_cart_id", "cart_id"),
        Index("ix_cart_items_variant_id", "variant_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    cart_id: Mapped[int] = mapped_column(
        ForeignKey("carts.id", ondelete="CASCADE"), nullable=False
    )
    variant_id: Mapped[int] = mapped_column(
        ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Quan he
    cart: Mapped["Cart"] = relationship(back_populates="items")
    variant: Mapped["ProductVariant"] = relationship(lazy="selectin")  # noqa: F821

    def __repr__(self) -> str:
        return f"<CartItem id={self.id} variant_id={self.variant_id} qty={self.quantity}>"
