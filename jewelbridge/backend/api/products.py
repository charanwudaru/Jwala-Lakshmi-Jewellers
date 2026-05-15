from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from db.database import get_db
from db.models import Product, ProductStatus, User
from schemas.schemas import ProductOut, ProductVisibilityUpdate
from api.auth import get_current_active_user
from services.cloudinary_svc import upload_image
import uuid

router = APIRouter(prefix="/products", tags=["products"])

@router.get("", response_model=List[ProductOut])
async def list_products(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Any active user (vendor or admin) can see available products
    result = await db.execute(select(Product).options(selectinload(Product.owner)))
    return result.scalars().all()

@router.get("/mine", response_model=List[ProductOut])
async def list_my_products(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.owner))
        .where(Product.owner_id == current_user.id)
    )
    return result.scalars().all()

@router.post("", response_model=ProductOut)
async def create_product(
    title: str = Form(...),
    spec: str = Form(...),
    category: str = Form(...),
    image: Optional[UploadFile] = File(None),
    images: Optional[List[UploadFile]] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    uploads = images or ([] if image is None else [image])
    if not uploads:
        raise HTTPException(status_code=400, detail="At least one image is required")

    image_urls = []
    try:
        for upload in uploads[:4]:
            file_contents = await upload.read()
            image_urls.append(upload_image(file_contents))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Cloudinary upload failed: {exc}") from exc
    
    # Generate unique design_id (e.g., JL-xxxx)
    design_id = f"JL-{uuid.uuid4().hex[:6].upper()}"

    new_product = Product(
        design_id=design_id,
        title=title,
        spec=spec,
        category=category,
        image_url=image_urls[0],
        image_urls=image_urls,
        owner_id=current_user.id
    )
    
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    return new_product

@router.put("/{product_id}/visibility", response_model=ProductOut)
async def update_product_visibility(
    product_id: str,
    payload: ProductVisibilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from uuid import UUID
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.owner))
        .where(Product.id == UUID(product_id))
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.owner_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="You can only update your own product visibility")
    if payload.status not in {ProductStatus.available, ProductStatus.hidden, ProductStatus.reserved}:
        raise HTTPException(status_code=400, detail="Invalid visibility")

    product.status = payload.status
    await db.commit()
    await db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from uuid import UUID
    result = await db.execute(select(Product).where(Product.id == UUID(product_id)))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.owner_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="You can only delete your own products")

    await db.delete(product)
    await db.commit()
    return Response(status_code=204)
