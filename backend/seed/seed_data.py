"""
Script seed du lieu mau cho VN Fashion Shop.

Chay tu thu muc backend/:
    python -m seed.seed_data

Tao:
- 5 danh muc san pham
- 10 san pham voi hinh anh va bien the
- 2 nguoi dung (admin + user thuong)
"""

import asyncio
import sys
from pathlib import Path

# Dam bao import duoc app package khi chay tu backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory, engine, Base
from app.models.user import User
from app.models.product import Category, Product, ProductImage, ProductVariant
from app.utils.security import hash_password


# ---------------------------------------------------------------------------
# Du lieu seed
# ---------------------------------------------------------------------------

CATEGORIES = [
    {"name": "Áo", "slug": "ao", "description": "Các loại áo thời trang nam nữ"},
    {"name": "Quần", "slug": "quan", "description": "Quần dài, quần short đa phong cách"},
    {"name": "Váy & Đầm", "slug": "vay-dam", "description": "Váy và đầm nữ thanh lịch"},
    {"name": "Phụ kiện", "slug": "phu-kien", "description": "Túi xách, kính mát, trang sức"},
    {"name": "Giày dép", "slug": "giay-dep", "description": "Giày sneaker, sandal, dép thời trang"},
]

PRODUCTS = [
    {
        "name": "Áo thun basic cotton",
        "slug": "ao-thun-basic-cotton",
        "description": "Áo thun nam nữ chất liệu cotton 100%, thoáng mát, phù hợp mặc hàng ngày.",
        "price": 199_000,
        "compare_at_price": 299_000,
        "category_slug": "ao",
        "images": [
            ("https://placehold.co/600x800/f5f5dc/333?text=Ao+Thun+1", "Áo thun mặt trước"),
            ("https://placehold.co/600x800/f5f5dc/333?text=Ao+Thun+2", "Áo thun mặt sau"),
        ],
        "variants": [
            {"size": "S", "color": "Trắng", "sku": "ATBC-TRANG-S", "stock": 50},
            {"size": "M", "color": "Trắng", "sku": "ATBC-TRANG-M", "stock": 80},
            {"size": "L", "color": "Trắng", "sku": "ATBC-TRANG-L", "stock": 60},
            {"size": "M", "color": "Đen", "sku": "ATBC-DEN-M", "stock": 70},
        ],
    },
    {
        "name": "Áo sơ mi linen oversize",
        "slug": "ao-so-mi-linen-oversize",
        "description": "Áo sơ mi linen oversize phong cách Hàn Quốc, thích hợp đi chơi và đi làm.",
        "price": 450_000,
        "compare_at_price": None,
        "category_slug": "ao",
        "images": [
            ("https://placehold.co/600x800/e8d5b7/333?text=So+Mi+1", "Sơ mi mặt trước"),
            ("https://placehold.co/600x800/e8d5b7/333?text=So+Mi+2", "Sơ mi mặt sau"),
            ("https://placehold.co/600x800/e8d5b7/333?text=So+Mi+3", "Sơ mi chi tiết"),
        ],
        "variants": [
            {"size": "M", "color": "Be", "sku": "ASML-BE-M", "stock": 30},
            {"size": "L", "color": "Be", "sku": "ASML-BE-L", "stock": 25},
            {"size": "XL", "color": "Be", "sku": "ASML-BE-XL", "stock": 20},
        ],
    },
    {
        "name": "Quần jeans slim fit",
        "slug": "quan-jeans-slim-fit",
        "description": "Quần jeans nam slim fit co giãn, tôn dáng, phối đồ dễ dàng.",
        "price": 599_000,
        "compare_at_price": 799_000,
        "category_slug": "quan",
        "images": [
            ("https://placehold.co/600x800/4a6fa5/fff?text=Jeans+1", "Quần jeans mặt trước"),
            ("https://placehold.co/600x800/4a6fa5/fff?text=Jeans+2", "Quần jeans mặt sau"),
        ],
        "variants": [
            {"size": "S", "color": "Xanh đậm", "sku": "QJSF-XDAM-S", "stock": 40},
            {"size": "M", "color": "Xanh đậm", "sku": "QJSF-XDAM-M", "stock": 60},
            {"size": "L", "color": "Xanh đậm", "sku": "QJSF-XDAM-L", "stock": 45},
            {"size": "M", "color": "Xanh nhạt", "sku": "QJSF-XNHAT-M", "stock": 35},
        ],
    },
    {
        "name": "Quần short kaki",
        "slug": "quan-short-kaki",
        "description": "Quần short kaki nam thoải mái, phù hợp mùa hè và đi biển.",
        "price": 299_000,
        "compare_at_price": None,
        "category_slug": "quan",
        "images": [
            ("https://placehold.co/600x800/c4a882/333?text=Short+1", "Quần short mặt trước"),
            ("https://placehold.co/600x800/c4a882/333?text=Short+2", "Quần short mặt sau"),
        ],
        "variants": [
            {"size": "M", "color": "Kem", "sku": "QSK-KEM-M", "stock": 100},
            {"size": "L", "color": "Kem", "sku": "QSK-KEM-L", "stock": 80},
            {"size": "M", "color": "Xanh rêu", "sku": "QSK-XREU-M", "stock": 55},
        ],
    },
    {
        "name": "Váy midi hoa nhí",
        "slug": "vay-midi-hoa-nhi",
        "description": "Váy midi hoa nhí nữ tính, chất liệu voan nhẹ nhàng bay bổng.",
        "price": 520_000,
        "compare_at_price": None,
        "category_slug": "vay-dam",
        "images": [
            ("https://placehold.co/600x800/f4c2c2/333?text=Vay+Midi+1", "Váy midi mặt trước"),
            ("https://placehold.co/600x800/f4c2c2/333?text=Vay+Midi+2", "Váy midi mặt sau"),
            ("https://placehold.co/600x800/f4c2c2/333?text=Vay+Midi+3", "Váy midi chi tiết hoa"),
        ],
        "variants": [
            {"size": "S", "color": "Hồng nhạt", "sku": "VMH-HNHAT-S", "stock": 25},
            {"size": "M", "color": "Hồng nhạt", "sku": "VMH-HNHAT-M", "stock": 30},
            {"size": "L", "color": "Hồng nhạt", "sku": "VMH-HNHAT-L", "stock": 20},
        ],
    },
    {
        "name": "Đầm maxi boho",
        "slug": "dam-maxi-boho",
        "description": "Đầm maxi phong cách boho tự do, hoàn hảo cho đi biển và dạo phố.",
        "price": 680_000,
        "compare_at_price": None,
        "category_slug": "vay-dam",
        "images": [
            ("https://placehold.co/600x800/d4a574/fff?text=Dam+Maxi+1", "Đầm maxi toàn thân"),
            ("https://placehold.co/600x800/d4a574/fff?text=Dam+Maxi+2", "Đầm maxi chi tiết"),
        ],
        "variants": [
            {"size": "S", "color": "Nâu đất", "sku": "DMB-NDAT-S", "stock": 15},
            {"size": "M", "color": "Nâu đất", "sku": "DMB-NDAT-M", "stock": 20},
            {"size": "S", "color": "Xanh rêu", "sku": "DMB-XREU-S", "stock": 10},
            {"size": "M", "color": "Xanh rêu", "sku": "DMB-XREU-M", "stock": 12},
        ],
    },
    {
        "name": "Túi tote canvas",
        "slug": "tui-tote-canvas",
        "description": "Túi tote vải canvas bền đẹp, đựng vừa laptop 14 inch, phong cách tối giản.",
        "price": 250_000,
        "compare_at_price": None,
        "category_slug": "phu-kien",
        "images": [
            ("https://placehold.co/600x800/ddd/333?text=Tui+Tote+1", "Túi tote mặt trước"),
            ("https://placehold.co/600x800/ddd/333?text=Tui+Tote+2", "Túi tote đựng đồ"),
        ],
        "variants": [
            {"size": None, "color": "Trắng kem", "sku": "TTC-TKEM", "stock": 90},
            {"size": None, "color": "Đen", "sku": "TTC-DEN", "stock": 75},
        ],
    },
    {
        "name": "Kính mát tròn retro",
        "slug": "kinh-mat-tron-retro",
        "description": "Kính mát gọng tròn phong cách retro, chống UV400, unisex.",
        "price": 350_000,
        "compare_at_price": None,
        "category_slug": "phu-kien",
        "images": [
            ("https://placehold.co/600x800/333/fff?text=Kinh+Mat+1", "Kính mát chính diện"),
            ("https://placehold.co/600x800/333/fff?text=Kinh+Mat+2", "Kính mát cạnh bên"),
        ],
        "variants": [
            {"size": None, "color": "Đen", "sku": "KMTR-DEN", "stock": 60},
            {"size": None, "color": "Nâu", "sku": "KMTR-NAU", "stock": 45},
            {"size": None, "color": "Xanh lá", "sku": "KMTR-XLA", "stock": 30},
        ],
    },
    {
        "name": "Giày sneaker trắng",
        "slug": "giay-sneaker-trang",
        "description": "Giày sneaker trắng đế êm, phối được nhiều outfit khác nhau.",
        "price": 890_000,
        "compare_at_price": 1_200_000,
        "category_slug": "giay-dep",
        "images": [
            ("https://placehold.co/600x800/fff/333?text=Sneaker+1", "Sneaker mặt bên"),
            ("https://placehold.co/600x800/fff/333?text=Sneaker+2", "Sneaker mặt trên"),
            ("https://placehold.co/600x800/fff/333?text=Sneaker+3", "Sneaker phối đồ"),
        ],
        "variants": [
            {"size": "39", "color": "Trắng", "sku": "GST-TRANG-39", "stock": 20},
            {"size": "40", "color": "Trắng", "sku": "GST-TRANG-40", "stock": 30},
            {"size": "41", "color": "Trắng", "sku": "GST-TRANG-41", "stock": 25},
            {"size": "42", "color": "Trắng", "sku": "GST-TRANG-42", "stock": 15},
        ],
    },
    {
        "name": "Sandal quai chéo",
        "slug": "sandal-quai-cheo",
        "description": "Sandal quai chéo đế cao su, thoải mái cho mùa hè, phù hợp nam nữ.",
        "price": 420_000,
        "compare_at_price": None,
        "category_slug": "giay-dep",
        "images": [
            ("https://placehold.co/600x800/8b6914/fff?text=Sandal+1", "Sandal mặt trên"),
            ("https://placehold.co/600x800/8b6914/fff?text=Sandal+2", "Sandal mặt bên"),
        ],
        "variants": [
            {"size": "39", "color": "Đen", "sku": "SQC-DEN-39", "stock": 40},
            {"size": "40", "color": "Đen", "sku": "SQC-DEN-40", "stock": 50},
            {"size": "41", "color": "Nâu", "sku": "SQC-NAU-41", "stock": 35},
        ],
    },
]

USERS = [
    {
        "email": "admin@vnfashion.vn",
        "password": "Admin123!",
        "full_name": "Quản trị viên VN Fashion",
        "phone": "0909000001",
        "is_admin": True,
    },
    {
        "email": "user@vnfashion.vn",
        "password": "User123!",
        "full_name": "Nguyễn Văn Khách",
        "phone": "0912000002",
        "is_admin": False,
    },
]


# ---------------------------------------------------------------------------
# Seed functions
# ---------------------------------------------------------------------------


async def seed_categories(db: AsyncSession) -> dict[str, int]:
    """Tao danh muc san pham. Tra ve mapping slug -> id."""
    slug_to_id: dict[str, int] = {}

    for cat_data in CATEGORIES:
        # Kiem tra da ton tai chua
        existing = await db.execute(
            select(Category).where(Category.slug == cat_data["slug"])
        )
        category = existing.scalar_one_or_none()

        if category is None:
            category = Category(**cat_data)
            db.add(category)
            await db.flush()
            await db.refresh(category)

        slug_to_id[category.slug] = category.id
        print(f"  [Category] {category.name} (id={category.id})")

    return slug_to_id


async def seed_products(
    db: AsyncSession, category_map: dict[str, int]
) -> None:
    """Tao san pham voi hinh anh va bien the."""
    for prod_data in PRODUCTS:
        # Kiem tra da ton tai chua
        existing = await db.execute(
            select(Product).where(Product.slug == prod_data["slug"])
        )
        if existing.scalar_one_or_none() is not None:
            print(f"  [Product] {prod_data['name']} - da ton tai, bo qua.")
            continue

        product = Product(
            name=prod_data["name"],
            slug=prod_data["slug"],
            description=prod_data["description"],
            price=prod_data["price"],
            compare_at_price=prod_data.get("compare_at_price"),
            category_id=category_map.get(prod_data["category_slug"]),
            is_active=True,
        )
        db.add(product)
        await db.flush()

        # Hinh anh
        for idx, (url, alt) in enumerate(prod_data["images"]):
            img = ProductImage(
                product_id=product.id,
                url=url,
                alt_text=alt,
                position=idx,
            )
            db.add(img)

        # Bien the
        for v_data in prod_data["variants"]:
            variant = ProductVariant(
                product_id=product.id,
                size=v_data["size"],
                color=v_data["color"],
                sku=v_data["sku"],
                stock_quantity=v_data["stock"],
                reserved_quantity=0,
            )
            db.add(variant)

        await db.flush()
        n_imgs = len(prod_data["images"])
        n_vars = len(prod_data["variants"])
        print(
            f"  [Product] {product.name} - {prod_data['price']:,}d "
            f"({n_imgs} hinh, {n_vars} bien the)"
        )


async def seed_users(db: AsyncSession) -> None:
    """Tao nguoi dung admin va user thuong."""
    for user_data in USERS:
        existing = await db.execute(
            select(User).where(User.email == user_data["email"])
        )
        if existing.scalar_one_or_none() is not None:
            print(f"  [User] {user_data['email']} - da ton tai, bo qua.")
            continue

        user = User(
            email=user_data["email"],
            hashed_password=hash_password(user_data["password"]),
            full_name=user_data["full_name"],
            phone=user_data["phone"],
            is_active=True,
            is_admin=user_data["is_admin"],
        )
        db.add(user)
        await db.flush()

        role = "ADMIN" if user.is_admin else "USER"
        print(f"  [User] {user.email} ({role}, id={user.id})")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def main() -> None:
    """Chay toan bo seed."""
    print("=" * 60)
    print("VN Fashion Shop - Seed du lieu mau")
    print("=" * 60)

    # Tao bang neu chua co (huu ich khi chay lan dau khong co migration)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        try:
            print("\n[1/3] Tao danh muc...")
            category_map = await seed_categories(db)

            print("\n[2/3] Tao san pham...")
            await seed_products(db, category_map)

            print("\n[3/3] Tao nguoi dung...")
            await seed_users(db)

            await db.commit()
            print("\n" + "=" * 60)
            print("Seed du lieu thanh cong!")
            print("=" * 60)
            print("\nTai khoan test:")
            print("  Admin: admin@vnfashion.vn / Admin123!")
            print("  User:  user@vnfashion.vn  / User123!")

        except Exception as e:
            await db.rollback()
            print(f"\nLOI: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
