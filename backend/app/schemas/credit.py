from datetime import datetime
from uuid import UUID
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict


class CreditBase(BaseModel):
    methodology_name: str = Field(..., min_length=1, max_length=255)
    methodology_version: str = Field(..., min_length=1, max_length=50)
    vintage_year: int = Field(..., ge=2000, le=2100)
    unit: str = Field(default="tCO2e", min_length=1, max_length=50)


class CreditCreate(CreditBase):
    project_id: UUID
    calculation_id: Optional[UUID] = None
    batch_id: str = Field(..., min_length=1, max_length=100)
    quantity: float = Field(..., gt=0)
    serial_number_start: Optional[int] = None
    serial_number_end: Optional[int] = None


class CreditUpdate(BaseModel):
    status: Optional[str] = Field(
        None, 
        pattern="^(proposed|issued|listed|sold|transferred|retired|cancelled)$"
    )
    retired_at: Optional[datetime] = None
    retirement_reason: Optional[str] = Field(None, max_length=255)
    serial_number_start: Optional[int] = None
    serial_number_end: Optional[int] = None


class CreditIssuance(BaseModel):
    calculation_id: UUID
    batch_id: str = Field(..., min_length=1, max_length=100)
    quantity: float = Field(..., gt=0)
    vintage_year: int = Field(..., ge=2000, le=2100)
    issuance_tx_hash: Optional[str] = Field(None, max_length=128)
    serial_number_start: Optional[int] = None
    serial_number_end: Optional[int] = None


class CreditRetirement(BaseModel):
    quantity: float = Field(..., gt=0)
    retirement_reason: str = Field(..., min_length=1, max_length=255)


class CreditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    calculation_id: Optional[UUID] = None
    batch_id: str
    quantity: float
    unit: str
    vintage_year: int
    status: str
    issued_by: Optional[UUID] = None
    issued_at: Optional[datetime] = None
    issuance_tx_hash: Optional[str] = None
    retired_at: Optional[datetime] = None
    retirement_reason: Optional[str] = None
    methodology_name: str
    methodology_version: str
    serial_number_start: Optional[int] = None
    serial_number_end: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class CreditListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    batch_id: str
    quantity: float
    unit: str
    vintage_year: int
    status: str
    issued_at: Optional[datetime] = None
    methodology_name: str