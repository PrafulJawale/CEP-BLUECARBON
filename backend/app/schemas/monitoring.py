from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


class MonitoringObservationBase(BaseModel):
    observation_type: str = Field(
        ..., 
        pattern="^(biomass|carbon_stock|tree_height|tree_diameter|canopy_cover|soil_carbon|water_level|salinity|temperature|ph|biodiversity_index|other)$"
    )
    value: float
    unit: str = Field(..., min_length=1, max_length=50)
    source: str = Field(..., pattern="^(manual|sensor|satellite|drone|lab_analysis|imported|simulated)$")
    quality: str = Field(default="raw", pattern="^(raw|validated|flagged|rejected)$")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    depth_meters: Optional[float] = Field(None, ge=0)
    observed_at: datetime
    evidence_id: Optional[UUID] = None
    notes: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None


class MonitoringObservationCreate(MonitoringObservationBase):
    project_id: UUID


class MonitoringObservationUpdate(BaseModel):
    observation_type: Optional[str] = Field(
        None, 
        pattern="^(biomass|carbon_stock|tree_height|tree_diameter|canopy_cover|soil_carbon|water_level|salinity|temperature|ph|biodiversity_index|other)$"
    )
    value: Optional[float] = None
    unit: Optional[str] = Field(None, min_length=1, max_length=50)
    source: Optional[str] = Field(None, pattern="^(manual|sensor|satellite|drone|lab_analysis|imported|simulated)$")
    quality: Optional[str] = Field(None, pattern="^(raw|validated|flagged|rejected)$")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    depth_meters: Optional[float] = Field(None, ge=0)
    observed_at: Optional[datetime] = None
    evidence_id: Optional[UUID] = None
    notes: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None


class MonitoringObservationResponse(MonitoringObservationBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    observer_id: UUID
    created_at: datetime
    updated_at: datetime