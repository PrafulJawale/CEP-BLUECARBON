from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class EvidenceBase(BaseModel):
    description: Optional[str] = None
    evidence_type: str = Field(..., pattern="^(drone_image|satellite_image|field_photo|document|map|iot_data|other)$")


class EvidenceCreate(EvidenceBase):
    project_id: UUID


class EvidenceUpdate(BaseModel):
    description: Optional[str] = None
    evidence_type: Optional[str] = Field(None, pattern="^(drone_image|satellite_image|field_photo|document|map|iot_data|other)$")
    status: Optional[str] = Field(None, pattern="^(pending|under_review|approved|rejected)$")
    reviewer_comments: Optional[str] = None


class EvidenceReview(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    comments: Optional[str] = None


class EvidenceResponse(EvidenceBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    uploader_id: UUID
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    mime_type: str
    checksum: Optional[str] = None
    status: str
    reviewer_id: Optional[UUID] = None
    reviewer_comments: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    uploaded_at: datetime
    created_at: datetime
    updated_at: datetime


class EvidenceUploadResponse(BaseModel):
    id: UUID
    filename: str
    status: str
    message: str