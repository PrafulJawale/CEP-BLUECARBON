from datetime import datetime
from uuid import UUID
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict


class MarketplaceListingBase(BaseModel):
    quantity: float = Field(..., gt=0)
    price_per_unit: float = Field(..., gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    description: Optional[str] = None
    expires_at: Optional[datetime] = None


class MarketplaceListingCreate(MarketplaceListingBase):
    credit_id: UUID


class MarketplaceListingUpdate(BaseModel):
    quantity: Optional[float] = Field(None, gt=0)
    price_per_unit: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|sold|cancelled|expired)$")
    expires_at: Optional[datetime] = None


class MarketplaceListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    credit_id: UUID
    seller_id: UUID
    quantity: float
    price_per_unit: float
    total_price: float
    currency: str
    status: str
    description: Optional[str] = None
    listed_at: datetime
    sold_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    @property
    def total_price(self) -> float:
        return round(self.quantity * self.price_per_unit, 4)


class MarketplaceListingListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    credit_id: UUID
    seller_id: UUID
    quantity: float
    price_per_unit: float
    currency: str
    status: str
    listed_at: datetime
    expires_at: Optional[datetime] = None


class TransactionBase(BaseModel):
    quantity: float = Field(..., gt=0)
    price_per_unit: float = Field(..., gt=0)
    total_amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    payment_reference: Optional[str] = Field(None, max_length=255)
    payment_method: Optional[str] = Field(None, max_length=50)


class TransactionCreate(TransactionBase):
    listing_id: UUID


class TransactionUpdate(BaseModel):
    status: Optional[str] = Field(
        None, 
        pattern="^(pending|completed|failed|cancelled|refunded)$"
    )
    payment_reference: Optional[str] = Field(None, max_length=255)
    payment_method: Optional[str] = Field(None, max_length=50)


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    listing_id: UUID
    buyer_id: UUID
    seller_id: UUID
    credit_id: UUID
    quantity: float
    price_per_unit: float
    total_amount: float
    currency: str
    status: str
    payment_reference: Optional[str] = None
    payment_method: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class TransactionListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    listing_id: UUID
    buyer_id: UUID
    seller_id: UUID
    credit_id: UUID
    quantity: float
    price_per_unit: float
    total_amount: float
    currency: str
    status: str
    created_at: datetime