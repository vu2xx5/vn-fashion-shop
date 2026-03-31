"""Initial migration - Tao tat ca cac bang.

Revision ID: 001
Revises: None
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ========================================
    # 1. BANG NGUOI DUNG (users)
    # ========================================
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # ========================================
    # 2. BANG DIA CHI (addresses)
    # ========================================
    op.create_table(
        "addresses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("street", sa.String(500), nullable=False),
        sa.Column("ward", sa.String(100), nullable=False),
        sa.Column("district", sa.String(100), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_addresses_user_id", "addresses", ["user_id"])

    # ========================================
    # 3. BANG DANH MUC (categories)
    # ========================================
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
        sa.ForeignKeyConstraint(["parent_id"], ["categories.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"])

    # ========================================
    # 4. BANG SAN PHAM (products)
    # ========================================
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("slug", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Numeric(12, 0), nullable=False),
        sa.Column("compare_at_price", sa.Numeric(12, 0), nullable=True),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_products_slug", "products", ["slug"], unique=True)
    op.create_index("ix_products_category_id", "products", ["category_id"])
    op.create_index("ix_products_is_active", "products", ["is_active"])

    # ========================================
    # 5. BANG HINH ANH SAN PHAM (product_images)
    # ========================================
    op.create_table(
        "product_images",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("alt_text", sa.String(500), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_product_images_product_id", "product_images", ["product_id"])

    # ========================================
    # 6. BANG BIEN THE SAN PHAM (product_variants)
    # ========================================
    op.create_table(
        "product_variants",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("size", sa.String(20), nullable=True),
        sa.Column("color", sa.String(50), nullable=True),
        sa.Column("sku", sa.String(100), nullable=False),
        sa.Column("price_override", sa.Numeric(12, 0), nullable=True),
        sa.Column("stock_quantity", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("reserved_quantity", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sku"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_product_variants_product_id", "product_variants", ["product_id"])
    op.create_index("ix_product_variants_sku", "product_variants", ["sku"], unique=True)

    # ========================================
    # 7. BANG GIO HANG (carts)
    # ========================================
    op.create_table(
        "carts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("session_id", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_carts_user_id", "carts", ["user_id"])
    op.create_index("ix_carts_session_id", "carts", ["session_id"])

    # ========================================
    # 8. BANG CHI TIET GIO HANG (cart_items)
    # ========================================
    op.create_table(
        "cart_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("cart_id", sa.Integer(), nullable=False),
        sa.Column("variant_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["cart_id"], ["carts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["variant_id"], ["product_variants.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_cart_items_cart_id", "cart_items", ["cart_id"])
    op.create_index("ix_cart_items_variant_id", "cart_items", ["variant_id"])

    # ========================================
    # 9. ENUM TRANG THAI DON HANG
    # ========================================
    order_status_enum = postgresql.ENUM(
        "pending", "paid", "shipped", "delivered", "cancelled",
        name="order_status",
        create_type=True,
    )
    order_status_enum.create(op.get_bind(), checkfirst=True)

    # ========================================
    # 10. BANG DON HANG (orders)
    # ========================================
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("order_number", sa.String(30), nullable=False),
        sa.Column(
            "status",
            order_status_enum,
            nullable=False,
            server_default=sa.text("'pending'"),
        ),
        sa.Column("subtotal", sa.Numeric(14, 0), nullable=False),
        sa.Column("shipping_fee", sa.Numeric(12, 0), nullable=False, server_default=sa.text("0")),
        sa.Column("total", sa.Numeric(14, 0), nullable=False),
        sa.Column("shipping_address", postgresql.JSONB(), nullable=False),
        sa.Column("payment_intent_id", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_number"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"])
    op.create_index("ix_orders_order_number", "orders", ["order_number"], unique=True)
    op.create_index("ix_orders_status", "orders", ["status"])
    op.create_index("ix_orders_created_at", "orders", ["created_at"])

    # ========================================
    # 11. BANG CHI TIET DON HANG (order_items)
    # ========================================
    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("variant_id", sa.Integer(), nullable=True),
        sa.Column("product_name", sa.String(500), nullable=False),
        sa.Column("variant_info", sa.String(255), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 0), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["variant_id"], ["product_variants.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])

    # ========================================
    # 12. BANG NHAT KY THAO TAC (audit_logs)
    # ========================================
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("details", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_entity", "audit_logs", ["entity_type", "entity_id"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    # Xoa bang theo thu tu nguoc lai (do rang buoc khoa ngoai)
    op.drop_table("audit_logs")
    op.drop_table("order_items")
    op.drop_table("orders")

    # Xoa enum sau khi xoa bang orders
    sa.Enum(name="order_status").drop(op.get_bind(), checkfirst=True)

    op.drop_table("cart_items")
    op.drop_table("carts")
    op.drop_table("product_variants")
    op.drop_table("product_images")
    op.drop_table("products")
    op.drop_table("categories")
    op.drop_table("addresses")
    op.drop_table("users")
