"""
Router gio hang - them, sua, xoa, xem gio hang.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartResponse, CartItemResponse
from app.services.cart import (
    CartError,
    add_to_cart,
    get_cart,
    get_or_create_cart,
    remove_from_cart,
    update_cart_item,
)

router = APIRouter(prefix="/api/v1/cart", tags=["Cart"])


def _build_cart_response(cart) -> dict:
    """Xay dung response cho gio hang."""
    if cart is None:
        return {"id": 0, "items": [], "total_items": 0, "subtotal": 0}

    items = []
    subtotal = 0
    for item in cart.items:
        variant = item.variant
        product = variant.product if variant else None
        unit_price = float(variant.price_override or (product.price if product else 0))
        line_total = unit_price * item.quantity
        subtotal += line_total

        variant_parts = []
        if variant and variant.size:
            variant_parts.append(f"Size {variant.size}")
        if variant and variant.color:
            variant_parts.append(variant.color)

        items.append({
            "id": item.id,
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "product_name": product.name if product else None,
            "variant_info": " - ".join(variant_parts) if variant_parts else None,
            "unit_price": unit_price,
            "line_total": line_total,
        })

    return {
        "id": cart.id,
        "items": items,
        "total_items": sum(i["quantity"] for i in items),
        "subtotal": subtotal,
    }


@router.get("", response_model=CartResponse)
async def get_user_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lay gio hang hien tai."""
    cart = await get_cart(db, user_id=current_user.id)
    return _build_cart_response(cart)


@router.post("/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def add_item_to_cart(
    body: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Them san pham vao gio hang."""
    try:
        cart = await get_or_create_cart(db, user_id=current_user.id)
        await add_to_cart(db, cart, body.variant_id, body.quantity)
        # Reload full cart with fresh query
        cart = await get_cart(db, user_id=current_user.id)
        return _build_cart_response(cart)
    except CartError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.put("/items/{item_id}", response_model=CartResponse)
async def update_item_quantity(
    item_id: int,
    body: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cap nhat so luong san pham trong gio hang."""
    try:
        cart = await get_or_create_cart(db, user_id=current_user.id)
        if body.quantity == 0:
            await remove_from_cart(db, cart, item_id)
        else:
            await update_cart_item(db, cart, item_id, body.quantity)
        cart = await get_cart(db, user_id=current_user.id)
        return _build_cart_response(cart)
    except CartError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Xoa san pham khoi gio hang."""
    try:
        cart = await get_or_create_cart(db, user_id=current_user.id)
        await remove_from_cart(db, cart, item_id)
    except CartError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
