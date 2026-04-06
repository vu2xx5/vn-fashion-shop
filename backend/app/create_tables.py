"""
Tao tat ca bang trong database tu Base.metadata.

Chay tu thu muc backend/:
    python -m app.create_tables
"""

import asyncio

from app.database import Base, engine

# Import tat ca model de chung duoc dang ky voi Base.metadata
from app.models import (  # noqa: F401
    Address,
    AuditLog,
    Cart,
    CartItem,
    Category,
    Order,
    OrderItem,
    OrderStatus,
    Product,
    ProductImage,
    ProductVariant,
    User,
)


async def create_tables_async() -> None:
    """Tao tat ca bang bat dong bo."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Da tao tat ca bang thanh cong.")


def main() -> None:
    """Entry point dong bo de chay truc tiep."""
    asyncio.run(create_tables_async())


if __name__ == "__main__":
    main()
