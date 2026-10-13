from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class VerificationReviewBase(BaseModel):
    pass


class VerificationReviewCreate(BaseModel):
    project_id: UUID


class VerificationReviewDecision(BaseModel):
    decision: str = Field(..., pattern="^(approved|rejected|changes_requested)$")
    comments: Optional[str] = None
    evidence_reviewed: bool = False
    calculation_reviewed: bool = False
    methodology_compliant: Optional[bool] = None


class VerificationReviewUpdate(BaseModel):
    decision: Optional[str] = Field(None, pattern="^(pending|approved|rejected|changes_requested)$")
    comments: Optional[str] = None
    evidence_reviewed: Optional[bool] = None
    calculation_reviewed: Optional[bool] = None
    methodology_compliant: Optional[bool] = None


class VerificationReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    reviewer_id: UUID
    decision: str
    comments: Optional[str] = None
    evidence_reviewed: bool
    calculation_reviewed: bool
    methodology_compliant: Optional[bool] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime