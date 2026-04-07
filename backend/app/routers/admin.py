"""
Router quan tri - quan ly san pham, don hang, thong ke.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_admin, get_db
from app.models.user import User
from app.schemas.admin import AdminOrderStatusUpdate
from app.schemas.product import (
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
from app.routers.products import _serialize_product

router = APIRouter(prefix="/api/v1/admin", tags=["Quan tri"], dependencies=[Depends(get_current_admin)])


# ---------- Helpers ----------


def _serialize_order(order) -> dict:
    """Chuyen doi Order model sang format frontend."""
    items = []
    for item in (order.items or []):
        items.append({
            "id": str(item.id),
            "productId": str(item.variant_id or ""),
            "productName": item.product_name,
            "variantInfo": item.variant_info,
            "quantity": item.quantity,
            "unitPrice": float(item.unit_price),
            "totalPrice": float(item.line_total),
        })
    status_val = order.status.value if hasattr(order.status, "value") else str(order.status)
    return {
        "id": str(order.id),
        "orderNumber": order.order_number,
        "userId": str(order.user_id),
        "orderStatus": status_val,
        "subtotal": float(order.subtotal),
        "shippingCost": float(order.shipping_fee),
        "total": float(order.total),
        "shippingAddress": order.shipping_address or {},
        "paymentMethod": "cod",
        "paymentStatus": "pending",
        "note": order.notes,
        "items": items,
        "createdAt": order.created_at.isoformat() if order.created_at else None,
        "updatedAt": order.updated_at.isoformat() if order.updated_at else None,
    }


# ---------- San pham ----------


@router.get(
    "/products",
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
    return {
        "data": [_serialize_product(p) for p in result["items"]],
        "pagination": {
            "page": result["page"],
            "limit": page_size,
            "total": result["total"],
            "totalPages": result["total_pages"],
        },
    }


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
    return {
        "data": [_serialize_order(o) for o in result["items"]],
        "pagination": {
            "page": result["page"],
            "limit": page_size,
            "total": result["total"],
            "totalPages": result["total_pages"],
        },
    }


@router.put(
    "/orders/{order_id}/status",
    summary="[Admin] Cap nhat trang thai don hang (PUT)",
)
@router.patch(
    "/orders/{order_id}/status",
    summary="[Admin] Cap nhat trang thai don hang (PATCH)",
    include_in_schema=False,
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
        # Gui email thong bao (bat dong bo)
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

        return {"success": True, "data": _serialize_order(order)}
    except OrderError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ---------- Thong ke ----------


@router.get(
    "/metrics",
    summary="[Admin] Lay thong ke tong quan",
)
async def admin_metrics(db: AsyncSession = Depends(get_db)):
    data = await get_admin_metrics(db)
    return {
        "totalRevenue": int(data.get("total_revenue", 0)),
        "totalOrders": data.get("total_orders", 0),
        "totalCustomers": data.get("total_customers", 0),
        "totalProducts": data.get("total_products", 0),
        "todayOrders": data.get("today_orders", 0),
        "todayRevenue": int(data.get("today_revenue", 0)),
        "ordersByStatus": data.get("orders_by_status", {}),
        # snake_case aliases for backward compat
        "total_revenue": int(data.get("total_revenue", 0)),
        "total_orders": data.get("total_orders", 0),
        "today_orders": data.get("today_orders", 0),
        "today_revenue": int(data.get("today_revenue", 0)),
        "orders_by_status": data.get("orders_by_status", {}),
    }
