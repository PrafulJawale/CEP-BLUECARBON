from datetime import datetime
from uuid import UUID
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict, field_validator


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    ecosystem_type: str = Field(..., pattern="^(mangrove|seagrass|salt_marsh|coastal_wetland|other)$")
    country: str = Field(..., min_length=1, max_length=100)
    state_province: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    area_hectares: float = Field(..., gt=0)
    boundary_geojson: Optional[Dict[str, Any]] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    ecosystem_type: Optional[str] = Field(None, pattern="^(mangrove|seagrass|salt_marsh|coastal_wetland|other)$")
    country: Optional[str] = Field(None, min_length=1, max_length=100)
    state_province: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    area_hectares: Optional[float] = Field(None, gt=0)
    boundary_geojson: Optional[Dict[str, Any]] = None


class ProjectStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|submitted|under_review|changes_requested|approved|rejected)$")
    comments: Optional[str] = None


class ProjectOwnerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str
    organization: Optional[str] = None


class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    owner: Optional[ProjectOwnerResponse] = None
    status: str
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    ecosystem_type: str
    country: str
    state_province: Optional[str] = None
    latitude: float
    longitude: float
    area_hectares: float
    status: str
    owner_id: UUID
    created_at: datetime
    updated_at: datetime


class ProjectFilterParams(BaseModel):
    status: Optional[str] = None
    ecosystem_type: Optional[str] = None
    country: Optional[str] = None
    state_province: Optional[str] = None
    owner_id: Optional[UUID] = None
    search: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class ProjectPagination(BaseModel):
    items: List[ProjectListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int