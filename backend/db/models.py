from sqlalchemy import Column, String, Boolean, ForeignKey, Integer, Text, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from db.database import Base

class RoleEnum(str, enum.Enum):
    admin = "admin"
    vendor = "vendor"

class ProductStatus(str, enum.Enum):
    available = "available"
    reserved = "reserved"
    hidden = "hidden"

class RequestStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    fulfilled = "fulfilled"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    business_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.vendor)
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=True)

    requests = relationship("Inquiry", back_populates="vendor")
    products = relationship("Product", back_populates="owner")


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    design_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    spec = Column(String, nullable=False)
    category = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    image_urls = Column(JSON, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(Enum(ProductStatus), default=ProductStatus.available)

    inquiries = relationship("Inquiry", back_populates="product")
    owner = relationship("User", back_populates="products")


class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    quantity = Column(Integer, default=1)
    customization_notes = Column(Text, nullable=True)
    status = Column(Enum(RequestStatus), default=RequestStatus.pending)

    product = relationship("Product", back_populates="inquiries")
    vendor = relationship("User", back_populates="requests")
