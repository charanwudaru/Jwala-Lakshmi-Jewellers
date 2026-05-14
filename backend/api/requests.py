from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from db.database import get_db
from db.models import Inquiry, Product, User, RequestStatus
from schemas.schemas import InquiryCreate, InquiryOut
from api.auth import get_current_active_user

router = APIRouter(prefix="/requests", tags=["requests"])

@router.post("", response_model=InquiryOut)
async def submit_request(
    request_data: InquiryCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    # Verify product exists
    result = await db.execute(select(Product).where(Product.id == request_data.product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_inquiry = Inquiry(
        product_id=request_data.product_id,
        vendor_id=current_user.id,
        quantity=request_data.quantity,
        customization_notes=request_data.customization_notes,
        status=RequestStatus.pending
    )
    
    db.add(new_inquiry)
    await db.commit()
    await db.refresh(new_inquiry)
    
    # Reload with relationships (chain product.owner to avoid lazy-load in async)
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Inquiry)
        .options(
            selectinload(Inquiry.product).selectinload(Product.owner),
            selectinload(Inquiry.vendor)
        )
        .where(Inquiry.id == new_inquiry.id)
    )
    loaded_inquiry = result.scalars().first()
    
    return loaded_inquiry


@router.get("/mine", response_model=list[InquiryOut])
async def list_my_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Inquiry)
        .options(
            selectinload(Inquiry.product).selectinload(Product.owner),
            selectinload(Inquiry.vendor)
        )
        .where(Inquiry.vendor_id == current_user.id)
    )
    return result.scalars().all()
