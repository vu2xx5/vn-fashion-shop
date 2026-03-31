"""
Dang ky tat ca cac router cua ung dung.
"""

from fastapi import FastAPI

from app.routers.auth import router as auth_router
from app.routers.products import router as products_router, categories_router
from app.routers.cart import router as cart_router
from app.routers.checkout import router as checkout_router
from app.routers.orders import router as orders_router
from app.routers.admin import router as admin_router
from app.routers.webhooks import router as webhooks_router


def register_routers(app: FastAPI) -> None:
    """Them tat ca router vao ung dung FastAPI."""
    app.include_router(auth_router)
    app.include_router(products_router)
    app.include_router(categories_router)
    app.include_router(cart_router)
    app.include_router(checkout_router)
    app.include_router(orders_router)
    app.include_router(admin_router)
    app.include_router(webhooks_router)
