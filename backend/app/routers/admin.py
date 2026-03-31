"""
Router quan tri - quan ly san pham, don hang, thong ke.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_admin, get_db
from app.models.user import User
from app.schemas.admin import (
    AdminMetricsResponse,
    AdminOrderStatusUpdate,
)
from app.schemas.order import OrderDetailResponse, PaginatedOrderResponse
from app.schemas.product import (
    PaginatedProductResponse,
    ProductCreate as ProductCreateRequest,
    ProductDetailResponse,
    ProductUpdate as ProductUpdateRequest,
)
from app.services.email import send_order_status_update
from app.services.order import (
    OrderError,
    get_admin_metrics,
    get_order,
    list_all_orders,
    update_order_status,
)
from app.services.product import (
    ProductError,
    create_product,
    get_product_by_id,
    list_products,
    update_product,
)

router = APIRouter(prefix="/api/v1/admin", tags=["Quan tri"], dependencies=[Depends(get_current_admin)])


# ---------- San pham ----------


@router.get(
    "/products",
    response_model=PaginatedProductResponse,
    summary="[Admin] Lay danh sach san pham",
)
async def admin_list_products(
    category: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    result = await list_products(
        db,
        category_slug=category,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return result


@router.post(
    "/products",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Tao san pham moi",
)
async def admin_create_product(
    body: ProductCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        product = await create_product(db, body.model_dump())
        return product
    except ProductError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.put(
    "/products/{product_id}",
    response_model=ProductDetailResponse,
    summary="[Admin] Cap nhat san pham",
)
async def admin_update_product(
    product_id: int,
    body: ProductUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        product = await update_product(
            db, product_id, body.model_dump(exclude_unset=True)
        )
        return product
    except ProductError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ---------- Don hang ----------


@router.get(
    "/orders",
    response_model=PaginatedOrderResponse,
    summary="[Admin] Lay danh sach tat ca don hang",
)
async def admin_list_orders(
    order_status: Optional[str] = Query(None, alias="status", description="Loc theo trang thai"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    result = await list_all_orders(
        db, status=order_status, page=page, page_size=page_size
    )
    return result


@router.put(
    "/orders/{order_id}/status",
    response_model=OrderDetailResponse,
    summary="[Admin] Cap nhat trang thai don hang",
)
async def admin_update_order_status(
    order_id: int,
    body: AdminOrderStatusUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        order = await update_order_status(
            db,
            order_id,
            new_status=body.status,
            admin_id=admin.id,
            note=body.note,
        )
        # Gui email thong bao (bat dong bo qua Celery)
        try:
            from sqlalchemy import select
            from app.models.user import User as UserModel
            user_result = await db.execute(
                select(UserModel).where(UserModel.id == order.user_id)
            )
            order_user = user_result.scalar_one_or_none()
            if order_user:
                send_order_status_update(order, order_user, body.status)
        except Exception:
            pass  # Khong de loi email anh huong response

        return order
    except OrderError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ---------- Thong ke ----------


@router.get(
    "/metrics",
    response_model=AdminMetricsResponse,
    summary="[Admin] Lay thong ke tong quan",
)
async def admin_metrics(db: AsyncSession = Depends(get_db)):
    return await get_admin_metrics(db)
