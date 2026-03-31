"""
Model don hang, chi tiet don hang, va nhat ky thao tac (audit log).
"""

import enum
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OrderStatus(str, enum.Enum):
    """Trang thai don hang."""
    PENDING = "pending"         # Cho xu ly
    PAID = "paid"               # Da thanh toan
    SHIPPED = "shipped"         # Dang giao
    DELIVERED = "delivered"     # Da giao
    CANCELLED = "cancelled"     # Da huy


class Order(Base):
    """Don hang."""
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_user_id", "user_id"),
        Index("ix_orders_order_number", "order_number", unique=True),
        Index("ix_orders_status", "status"),
        Index("ix_orders_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    order_number: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status", native_enum=True),
        default=OrderStatus.PENDING,
        nullable=False,
    )
    subtotal: Mapped[float] = mapped_column(Numeric(14, 0), nullable=False)
    shipping_fee: Mapped[float] = mapped_column(
        Numeric(12, 0), default=0, nullable=False
    )
    total: Mapped[float] = mapped_column(Numeric(14, 0), nullable=False)
    shipping_address: Mapped[dict] = mapped_column(JSONB, nullable=False)
    payment_intent_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
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
    user: Mapped["User"] = relationship(back_populates="orders")  # noqa: F821
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} number={self.order_number} status={self.status}>"


class OrderItem(Base):
    """Chi tiet mot dong trong don hang - luu snapshot thong tin tai thoi diem dat."""
    __tablename__ = "order_items"
    __table_args__ = (
        Index("ix_order_items_order_id", "order_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    variant_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True
    )
    product_name: Mapped[str] = mapped_column(String(500), nullable=False)
    variant_info: Mapped[str] = mapped_column(
        String(255), nullable=False  # VD: "Size M - Mau Den"
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 0), nullable=False)

    # Quan he
    order: Mapped["Order"] = relationship(back_populates="items")

    @property
    def line_total(self) -> float:
        return self.quantity * self.unit_price

    def __repr__(self) -> str:
        return f"<OrderItem id={self.id} product={self.product_name}>"


class AuditLog(Base):
    """Nhat ky thao tac he thong - Ghi lai moi hanh dong quan trong."""
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_user_id", "user_id"),
        Index("ix_audit_logs_entity", "entity_type", "entity_id"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action={self.action} entity={self.entity_type}:{self.entity_id}>"
