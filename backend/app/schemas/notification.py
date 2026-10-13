from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class NotificationBase(BaseModel):
    type: str = Field(..., pattern="^(project_submitted|project_approved|project_rejected|changes_requested|evidence_reviewed|credits_issued|listing_created|listing_sold|purchase_completed|verification_started|calculation_reviewed|system_alert)$")
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    reference_id: Optional[UUID] = None
    reference_type: Optional[str] = Field(None, max_length=50)


class NotificationCreate(NotificationBase):
    user_id: UUID


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    type: str
    title: str
    message: str
    reference_id: Optional[UUID] = None
    reference_type: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime


class NotificationListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: str
    title: str
    message: str
    reference_id: Optional[UUID] = None
    reference_type: Optional[str] = None
    is_read: bool
    created_at: datetime