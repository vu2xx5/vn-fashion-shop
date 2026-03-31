"""
Router dia chi giao hang - CRUD dia chi cua nguoi dung.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import Address, User
from app.schemas.user import AddressCreate, AddressResponse

router = APIRouter(prefix="/api/v1/addresses", tags=["Addresses"])


def _address_to_frontend(addr: Address) -> dict:
    """Chuyen doi Address model sang format frontend."""
    return {
        "id": str(addr.id),
        "fullName": addr.full_name,
        "phone": addr.phone,
        "streetAddress": addr.street,
        "ward": addr.ward,
        "district": addr.district,
        "province": addr.city,
        "isDefault": addr.is_default,
    }


@router.get("")
async def list_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lay danh sach dia chi cua nguoi dung."""
    stmt = (
        select(Address)
        .where(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.id.desc())
    )
    result = await db.execute(stmt)
    addresses = result.scalars().all()
    return {
        "success": True,
        "data": [_address_to_frontend(a) for a in addresses],
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_address(
    body: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Tao dia chi moi."""
    # Neu la default, bo flag default cua cac dia chi khac
    if body.is_default:
        stmt = select(Address).where(
            Address.user_id == current_user.id, Address.is_default.is_(True)
        )
        result = await db.execute(stmt)
        for existing in result.scalars().all():
            existing.is_default = False

    address = Address(
        user_id=current_user.id,
        full_name=body.full_name,
        phone=body.phone,
        street=body.street,
        ward=body.ward,
        district=body.district,
        city=body.city,
        is_default=body.is_default,
    )
    db.add(address)
    await db.flush()
    await db.refresh(address)
    return {"success": True, "data": _address_to_frontend(address)}


@router.put("/{address_id}")
async def update_address(
    address_id: int,
    body: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cap nhat dia chi."""
    stmt = select(Address).where(
        Address.id == address_id, Address.user_id == current_user.id
    )
    result = await db.execute(stmt)
    address = result.scalar_one_or_none()

    if address is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dia chi khong ton tai.",
        )

    if body.is_default and not address.is_default:
        reset_stmt = select(Address).where(
            Address.user_id == current_user.id,
            Address.is_default.is_(True),
            Address.id != address_id,
        )
        reset_result = await db.execute(reset_stmt)
        for existing in reset_result.scalars().all():
            existing.is_default = False

    address.full_name = body.full_name
    address.phone = body.phone
    address.street = body.street
    address.ward = body.ward
    address.district = body.district
    address.city = body.city
    address.is_default = body.is_default
    await db.flush()
    await db.refresh(address)
    return {"success": True, "data": _address_to_frontend(address)}


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Xoa dia chi."""
    stmt = select(Address).where(
        Address.id == address_id, Address.user_id == current_user.id
    )
    result = await db.execute(stmt)
    address = result.scalar_one_or_none()

    if address is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dia chi khong ton tai.",
        )

    await db.delete(address)
    await db.flush()
