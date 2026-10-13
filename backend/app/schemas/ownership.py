from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class CreditOwnershipBase(BaseModel):
    credit_id: UUID
    owner_id: UUID
    quantity: float = Field(..., gt=0)


class CreditOwnershipCreate(CreditOwnershipBase):
    transaction_id: Optional[UUID] = None


class CreditOwnershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    credit_id: UUID
    owner_id: UUID
    quantity: float
    acquired_at: datetime
    transaction_id: Optional[UUID] = None
    is_current: bool
    created_at: datetime