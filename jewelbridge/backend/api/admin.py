from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from db.database import get_db
from db.models import User, RoleEnum, Inquiry, RequestStatus, Product
from schemas.schemas import UserCreate, UserOut, InquiryOut
from core.security import get_password_hash
from api.auth import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])

DEFAULT_PASSWORD = "Password@123"


@router.post("/onboard", response_model=UserOut)
async def onboard_vendor(
    vendor: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    # Check if email or phone already exists
    result = await db.execute(
        select(User).where(
            (User.email == vendor.email) |
            (User.phone == vendor.phone if vendor.phone else False)
        )
    )
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or phone already registered")

    new_user = User(
        email=vendor.email,
        hashed_password=get_password_hash(DEFAULT_PASSWORD),
        business_name=vendor.business_name,
        phone=vendor.phone,
        role=RoleEnum.vendor,
        must_change_password=True   # Force password change on first login
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.get("/vendors", response_model=List[UserOut])
async def list_vendors(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(User).where(User.role == RoleEnum.vendor))
    return result.scalars().all()


@router.get("/requests", response_model=List[InquiryOut])
async def list_all_requests(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    result = await db.execute(
        select(Inquiry).options(
            selectinload(Inquiry.product).selectinload(Product.owner),
            selectinload(Inquiry.vendor)
        )
    )
    return result.scalars().all()


@router.put("/requests/{inquiry_id}/status", response_model=InquiryOut)
async def update_request_status(
    inquiry_id: str,
    new_status: RequestStatus,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    from uuid import UUID
    result = await db.execute(
        select(Inquiry)
        .options(selectinload(Inquiry.product).selectinload(Product.owner), selectinload(Inquiry.vendor))
        .where(Inquiry.id == UUID(inquiry_id))
    )
    inquiry = result.scalars().first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Request not found")

    inquiry.status = new_status
    await db.commit()
    await db.refresh(inquiry)
    return inquiry
