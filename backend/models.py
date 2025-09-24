from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    SUPER_ADMIN = "SuperAdmin"
    ADMIN = "Admin"
    USER = "User"
    APP_ADMIN = "AppAdmin"

class OrganizationType(str, Enum):
    VENDOR = "Vendor"
    COMPANY = "Company"
    APP_OWNER = "AppOwner"

class OrderStatus(str, Enum):
    REQUESTED = "Requested"
    APPROVED = "Approved"
    WAITING_TO_BE_ACCEPTED = "WaitingToBeAccepted"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    OUT_FOR_DELIVERY = "OutForDelivery"
    DELIVERED = "Delivered"

class ItemStatus(str, Enum):
    ACCEPTED = "Accepted"
    OUT_OF_STOCK = "OutOfStock"
    REJECTED = "Rejected"
    OUT_FOR_DELIVERY = "OutForDelivery"
    DELIVERED = "Delivered"

class ApprovalStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class DocumentType(str, Enum):
    INVOICE = "invoice"
    PURCHASE_ORDER = "purchase_order"

# Base User model
class UserBase(SQLModel):
    full_name: str
    phone_number: str = Field(unique=True, index=True)
    role: UserRole
    organization_id: Optional[int] = Field(default=None, foreign_key="organization.id")
    organization_type: OrganizationType

class User(UserBase, table=True):
    user_id: Optional[int] = Field(default=None, primary_key=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[int] = Field(default=None, foreign_key="user.user_id")
    updated_by: Optional[int] = Field(default=None, foreign_key="user.user_id")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    placed_orders: List["Order"] = Relationship(back_populates="placed_by_user", sa_relationship_kwargs={"foreign_keys": "Order.placed_by_user_id"})
    approved_orders: List["Order"] = Relationship(back_populates="approved_by_user", sa_relationship_kwargs={"foreign_keys": "Order.approved_by_user_id"})
    accepted_orders: List["Order"] = Relationship(back_populates="accepted_by_user", sa_relationship_kwargs={"foreign_keys": "Order.accepted_by_user_id"})

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    user_id: int
    created_at: datetime
    updated_at: datetime

class UserUpdate(SQLModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[UserRole] = None

# Organization models (for both Vendor and Company)
class OrganizationBase(SQLModel):
    name: str
    description: Optional[str] = None
    organization_type: OrganizationType

class Organization(OrganizationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    products: List["Product"] = Relationship(back_populates="vendor")
    units: List["Unit"] = Relationship(back_populates="vendor")

class OrganizationCreate(OrganizationBase):
    admin_name: Optional[str] = None
    admin_phone: Optional[str] = None

class OrganizationRead(OrganizationBase):
    id: int
    created_at: datetime

class AdminUserResponse(SQLModel):
    id: int
    phone_number: str
    full_name: str
    role: UserRole
    temporary_password: str

class OrganizationCreateResponse(SQLModel):
    organization: OrganizationRead
    admin_user: AdminUserResponse

# Product model
class ProductBase(SQLModel):
    product_name: str
    product_description: Optional[str] = None
    price: float
    unit_id: int = Field(foreign_key="unit.unit_id")
    vendor_id: int = Field(foreign_key="organization.id")

class Product(ProductBase, table=True):
    product_id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    vendor: Optional[Organization] = Relationship(back_populates="products")
    unit: Optional["Unit"] = Relationship(back_populates="products")

class ProductCreate(ProductBase):
    pass

class ProductCreateInput(SQLModel):
    product_name: str
    product_description: Optional[str] = None
    price: float
    unit_id: int

class ProductUpdateInput(SQLModel):
    product_name: Optional[str] = None
    product_description: Optional[str] = None
    price: Optional[float] = None
    unit_id: Optional[int] = None

class ProductRead(ProductBase):
    product_id: int
    created_at: datetime

# Unit model
class UnitBase(SQLModel):
    unit_name: str
    unit_description: Optional[str] = None
    vendor_id: int = Field(foreign_key="organization.id")

class Unit(UnitBase, table=True):
    unit_id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    vendor: Optional[Organization] = Relationship(back_populates="units")
    products: List[Product] = Relationship(back_populates="unit")

class UnitCreate(UnitBase):
    pass

class UnitRead(UnitBase):
    unit_id: int
    created_at: datetime

# Request DTOs for Units (exclude vendor_id from client payload)
class UnitCreateInput(SQLModel):
    unit_name: str
    unit_description: Optional[str] = None

class UnitUpdateInput(SQLModel):
    unit_name: Optional[str] = None
    unit_description: Optional[str] = None

# Order model
class OrderBase(SQLModel):
    placed_by_org_id: int = Field(foreign_key="organization.id")
    status: OrderStatus = OrderStatus.REQUESTED

class Order(OrderBase, table=True):
    order_id: Optional[int] = Field(default=None, primary_key=True)
    placed_by_user_id: int = Field(foreign_key="user.user_id")
    approved_by_user_id: Optional[int] = Field(default=None, foreign_key="user.user_id")
    accepted_by_user_id: Optional[int] = Field(default=None, foreign_key="user.user_id")
    placed_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    placed_by_user: Optional[User] = Relationship(back_populates="placed_orders", sa_relationship_kwargs={"foreign_keys": "Order.placed_by_user_id"})
    approved_by_user: Optional[User] = Relationship(back_populates="approved_orders", sa_relationship_kwargs={"foreign_keys": "Order.approved_by_user_id"})
    accepted_by_user: Optional[User] = Relationship(back_populates="accepted_orders", sa_relationship_kwargs={"foreign_keys": "Order.accepted_by_user_id"})
    order_items: List["OrderItem"] = Relationship(back_populates="order")
    invoices: List["Invoice"] = Relationship(back_populates="order")
    documents: List["Document"] = Relationship(back_populates="order")
    approvals: List["OrderApproval"] = Relationship(back_populates="order")

class OrderCreate(OrderBase):
    pass

class OrderRead(OrderBase):
    order_id: int
    placed_by_user_id: int
    placed_at: datetime
    created_at: datetime
    updated_at: datetime

# Order Item model
class OrderItemBase(SQLModel):
    order_id: int = Field(foreign_key="order.order_id")
    product_id: int = Field(foreign_key="product.product_id")  # Direct reference to product
    item_name: str
    item_price: float | None = None
    item_status: ItemStatus = ItemStatus.ACCEPTED
    purchase_order: Optional[str] = None
    # New pricing fields (Phase 1-3)
    quantity: int = 1
    zone_code: Optional[str] = None
    calculated_unit_price: Optional[float] = None  # result of rule calculation
    final_unit_price: Optional[float] = None       # vendor override or same as calculated
    pricing_source: Optional[str] = None  # 'Auto' | 'ManualOverride'

class OrderItem(OrderItemBase, table=True):
    order_item_id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    order: Optional[Order] = Relationship(back_populates="order_items")
    product: Optional[Product] = Relationship()
    history: List["OrderItemHistory"] = Relationship(back_populates="order_item")

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemCreateRequest(SQLModel):
    order_id: int
    product_id: int
    item_name: Optional[str] = None

class OrderItemRead(OrderItemBase):
    order_item_id: int
    created_at: datetime

# Order Item History model
class OrderItemHistoryBase(SQLModel):
    order_item_id: int = Field(foreign_key="orderitem.order_item_id")
    status: ItemStatus
    # Optional pricing change snapshot
    old_price: Optional[float] = None
    new_price: Optional[float] = None
    price_change_reason: Optional[str] = None

class OrderItemHistory(OrderItemHistoryBase, table=True):
    order_item_history_id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    order_item: Optional[OrderItem] = Relationship(back_populates="history")

class OrderItemHistoryCreate(OrderItemHistoryBase):
    pass

class OrderItemHistoryRead(OrderItemHistoryBase):
    order_item_history_id: int
    created_at: datetime

# Pricing rule tables (Phase 2)
class ProductZoneAdjustment(SQLModel, table=True):
    product_zone_adjustment_id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.product_id", index=True)
    zone_code: str  # e.g., 'NEAR', 'MID', 'FAR'
    adjustment_type: str  # 'Absolute' | 'Percent'
    amount: float
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductZoneAdjustmentCreate(SQLModel):
    zone_code: str
    adjustment_type: str
    amount: float
    active: Optional[bool] = True

class ProductZoneAdjustmentRead(ProductZoneAdjustmentCreate):
    product_zone_adjustment_id: int
    product_id: int
    created_at: datetime

class ProductQuantityTier(SQLModel, table=True):
    product_quantity_tier_id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.product_id", index=True)
    min_qty: int
    discount_type: str  # 'Absolute' | 'Percent'
    discount_amount: float
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductQuantityTierCreate(SQLModel):
    min_qty: int
    discount_type: str
    discount_amount: float
    active: Optional[bool] = True

class ProductQuantityTierRead(ProductQuantityTierCreate):
    product_quantity_tier_id: int
    product_id: int
    created_at: datetime

# Invoice model
class InvoiceBase(SQLModel):
    order_id: int = Field(foreign_key="order.order_id")
    file_url: str

class Invoice(InvoiceBase, table=True):
    invoice_id: Optional[int] = Field(default=None, primary_key=True)
    created_by_user_id: int = Field(foreign_key="user.user_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    order: Optional[Order] = Relationship(back_populates="invoices")

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceRead(InvoiceBase):
    invoice_id: int
    created_by_user_id: int
    created_at: datetime

# Document model
class DocumentBase(SQLModel):
    order_id: int = Field(foreign_key="order.order_id")
    file_url: str
    document_type: DocumentType

class Document(DocumentBase, table=True):
    document_id: Optional[int] = Field(default=None, primary_key=True)
    uploaded_by_user_id: int = Field(foreign_key="user.user_id")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    order: Optional[Order] = Relationship(back_populates="documents")

class DocumentCreate(DocumentBase):
    pass

class DocumentRead(DocumentBase):
    document_id: int
    uploaded_by_user_id: int
    uploaded_at: datetime

# Order Approval model
class OrderApprovalBase(SQLModel):
    order_id: int = Field(foreign_key="order.order_id")
    requested_by_user_id: int = Field(foreign_key="user.user_id")
    status: ApprovalStatus = ApprovalStatus.PENDING

class OrderApproval(OrderApprovalBase, table=True):
    approval_id: Optional[int] = Field(default=None, primary_key=True)
    approved_by_user_id: Optional[int] = Field(default=None, foreign_key="user.user_id")
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None
    
    # Relationships
    order: Optional[Order] = Relationship(back_populates="approvals")

class OrderApprovalCreate(OrderApprovalBase):
    pass

class OrderApprovalRead(OrderApprovalBase):
    approval_id: int
    requested_at: datetime
    approved_at: Optional[datetime] = None
