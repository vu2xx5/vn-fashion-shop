"""
Cau hinh chung cho test suite - fixtures, database, client.

Su dung in-memory SQLite async de test nhanh va doc lap.
Override dependency get_db de su dung test database.
"""

import asyncio
from collections.abc import AsyncGenerator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.database import Base, get_db
from app.models import (  # noqa: F401 - ensure all models registered with Base
    Address,
    AuditLog,
    Cart,
    CartItem,
    Category,
    Order,
    OrderItem,
    Product,
    ProductImage,
    ProductVariant,
    User,
)
from app.utils.security import create_token_pair, hash_password

# ---------------------------------------------------------------------------
# Async event loop
# ---------------------------------------------------------------------------

pytest_plugins = ("pytest_asyncio",)


# ---------------------------------------------------------------------------
# Test database - SQLite async in-memory
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    # SQLite does not support pool_size / max_overflow
)


@event.listens_for(test_engine.sync_engine, "connect")
def _enable_sqlite_fk(dbapi_conn, connection_record):
    """Bat foreign key constraint cho SQLite."""
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


test_session_factory = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ---------------------------------------------------------------------------
# Database setup / teardown cho moi test
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture(autouse=True)
async def _setup_database():
    """
    Tao tat ca bang truoc moi test va xoa sau khi test ket thuc.
    Dam bao moi test bat dau voi database sach.
    """
    # SQLite khong ho tro Enum native va JSONB -> dung JSON thay the
    # Override JSONB -> JSON cho SQLite
    from sqlalchemy import JSON
    from app.models.order import Order, AuditLog

    # Tam thoi khong can override column type vi ta da dung sa.JSON fallback
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ---------------------------------------------------------------------------
# Override get_db dependency
# ---------------------------------------------------------------------------


async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """Cung cap test session thay vi production session."""
    async with test_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ---------------------------------------------------------------------------
# FastAPI test app & HTTP client
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def app():
    """FastAPI app instance voi dependency overrides."""
    # Import main app - lazy de tranh side effects khi load module
    from app.main import app as _app

    _app.dependency_overrides[get_db] = _override_get_db
    yield _app
    _app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    """httpx AsyncClient cho integration test."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# Database session cho truc tiep tao du lieu test
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Session truc tiep de seed du lieu test."""
    async with test_session_factory() as session:
        yield session
        await session.commit()


# ---------------------------------------------------------------------------
# User fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Tao nguoi dung thuong cho test."""
    user = User(
        email="testuser@example.com",
        hashed_password=hash_password("TestPass123!"),
        full_name="Nguyen Van Test",
        phone="0901234567",
        is_active=True,
        is_admin=False,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """Tao nguoi dung admin cho test."""
    user = User(
        email="admin@example.com",
        hashed_password=hash_password("AdminPass123!"),
        full_name="Admin VN Fashion",
        phone="0909999999",
        is_active=True,
        is_admin=True,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Auth header fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def user_auth_header(test_user: User) -> dict[str, str]:
    """Authorization header voi access token cua user thuong."""
    tokens = create_token_pair(test_user.id, is_admin=False)
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest_asyncio.fixture
async def admin_auth_header(admin_user: User) -> dict[str, str]:
    """Authorization header voi access token cua admin."""
    tokens = create_token_pair(admin_user.id, is_admin=True)
    return {"Authorization": f"Bearer {tokens['access_token']}"}


# ---------------------------------------------------------------------------
# Catalog fixtures - Category, Product, Variant, Image
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def sample_category(db_session: AsyncSession) -> Category:
    """Tao mot danh muc mau."""
    category = Category(
        name="Ao",
        slug="ao",
        description="Cac loai ao thoi trang",
    )
    db_session.add(category)
    await db_session.flush()
    await db_session.refresh(category)
    return category


@pytest_asyncio.fixture
async def sample_product(
    db_session: AsyncSession, sample_category: Category
) -> Product:
    """Tao mot san pham mau voi images va variants."""
    product = Product(
        name="Ao thun basic cotton",
        slug="ao-thun-basic-cotton",
        description="Ao thun nam nu chat lieu cotton 100%, thoang mat.",
        price=199_000,
        compare_at_price=299_000,
        category_id=sample_category.id,
        is_active=True,
    )
    db_session.add(product)
    await db_session.flush()

    # Images
    for idx, alt in enumerate(["Mat truoc", "Mat sau"]):
        img = ProductImage(
            product_id=product.id,
            url=f"https://placehold.co/600x800/eee/999?text=Ao+Thun+{idx + 1}",
            alt_text=alt,
            position=idx,
        )
        db_session.add(img)

    # Variants - 4 bien the (S/M/L/XL, mau Trang)
    for size in ["S", "M", "L", "XL"]:
        variant = ProductVariant(
            product_id=product.id,
            size=size,
            color="Trang",
            sku=f"ATBC-TRANG-{size}",
            stock_quantity=50,
            reserved_quantity=0,
        )
        db_session.add(variant)

    await db_session.flush()
    await db_session.refresh(product)
    return product


@pytest_asyncio.fixture
async def sample_variant(
    db_session: AsyncSession, sample_product: Product
) -> ProductVariant:
    """Tra ve variant dau tien cua san pham mau."""
    from sqlalchemy import select

    stmt = select(ProductVariant).where(
        ProductVariant.product_id == sample_product.id
    ).limit(1)
    result = await db_session.execute(stmt)
    return result.scalar_one()


@pytest_asyncio.fixture
async def second_variant(
    db_session: AsyncSession, sample_product: Product
) -> ProductVariant:
    """Tra ve variant thu hai cua san pham mau (size khac)."""
    from sqlalchemy import select

    stmt = (
        select(ProductVariant)
        .where(ProductVariant.product_id == sample_product.id)
        .offset(1)
        .limit(1)
    )
    result = await db_session.execute(stmt)
    return result.scalar_one()


@pytest_asyncio.fixture
async def low_stock_variant(
    db_session: AsyncSession, sample_category: Category
) -> ProductVariant:
    """Tao san pham voi ton kho thap (chi con 1)."""
    product = Product(
        name="Ao gioi han",
        slug="ao-gioi-han",
        description="San pham sap het hang",
        price=500_000,
        category_id=sample_category.id,
        is_active=True,
    )
    db_session.add(product)
    await db_session.flush()

    variant = ProductVariant(
        product_id=product.id,
        size="M",
        color="Den",
        sku="AGH-DEN-M",
        stock_quantity=1,
        reserved_quantity=0,
    )
    db_session.add(variant)
    await db_session.flush()
    await db_session.refresh(variant)
    return variant
