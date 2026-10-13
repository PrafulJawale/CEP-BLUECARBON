from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


class AuditLogBase(BaseModel):
    action: str = Field(..., min_length=1, max_length=100)
    entity_type: str = Field(..., min_length=1, max_length=50)
    entity_id: Optional[UUID] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None


class AuditLogCreate(AuditLogBase):
    user_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    ip_address: Optional[str] = Field(None, max_length=45)
    user_agent: Optional[str] = None


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    action: str
    entity_type: str
    entity_id: Optional[UUID] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime


class AuditLogFilter(BaseModel):
    user_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=200)