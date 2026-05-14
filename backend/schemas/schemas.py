from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from db.models import RoleEnum, ProductStatus, RequestStatus

class UserBase(BaseModel):
    email: str
    business_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    # Admin-only: no password field — default Password@123 is set by the backend
    role: RoleEnum = RoleEnum.vendor

class UserOut(UserBase):
    id: UUID
    role: RoleEnum
    is_active: bool
    must_change_password: bool

    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    new_password: str

class ProductBase(BaseModel):
    design_id: str
    title: str
    spec: str
    category: str

class ProductCreate(ProductBase):
    pass

class ProductVisibilityUpdate(BaseModel):
    status: ProductStatus

class ProductOut(ProductBase):
    id: UUID
    image_url: str
    image_urls: Optional[List[str]] = None
    owner_id: Optional[UUID] = None
    owner: Optional[UserOut] = None
    status: ProductStatus

    class Config:
        from_attributes = True

class InquiryBase(BaseModel):
    product_id: UUID
    quantity: int = 1
    customization_notes: Optional[str] = None

class InquiryCreate(InquiryBase):
    pass

class InquiryOut(InquiryBase):
    id: UUID
    vendor_id: UUID
    status: RequestStatus

    product: Optional[ProductOut] = None
    vendor: Optional[UserOut] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    must_change_password: bool

class TokenData(BaseModel):
    email: Optional[str] = None
