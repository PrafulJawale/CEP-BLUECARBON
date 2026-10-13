from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


class CarbonCalculationBase(BaseModel):
    methodology_name: str = Field(..., min_length=1, max_length=255)
    methodology_version: str = Field(..., min_length=1, max_length=50)
    methodology_reference: Optional[str] = Field(None, max_length=512)
    input_parameters: Dict[str, Any]
    assumptions: Optional[str] = None
    limitations: Optional[str] = None
    data_provenance: Optional[Dict[str, Any]] = None


class CarbonCalculationCreate(CarbonCalculationBase):
    project_id: UUID


class CarbonCalculationUpdate(BaseModel):
    methodology_name: Optional[str] = Field(None, min_length=1, max_length=255)
    methodology_version: Optional[str] = Field(None, min_length=1, max_length=50)
    methodology_reference: Optional[str] = Field(None, max_length=512)
    input_parameters: Optional[Dict[str, Any]] = None
    biomass_tons: Optional[float] = None
    carbon_stock_tons: Optional[float] = None
    co2_equivalent_tons: Optional[float] = None
    annual_sequestration_tons: Optional[float] = None
    potential_credits: Optional[float] = None
    unit: Optional[str] = Field(None, min_length=1, max_length=50)
    assumptions: Optional[str] = None
    limitations: Optional[str] = None
    data_provenance: Optional[Dict[str, Any]] = None
    status: Optional[str] = Field(None, pattern="^(draft|submitted|under_review|approved|rejected)$")
    reviewer_comments: Optional[str] = None


class CarbonCalculationReview(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    reviewer_comments: Optional[str] = None


class CarbonCalculationResponse(CarbonCalculationBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    calculator_id: UUID
    biomass_tons: Optional[float] = None
    carbon_stock_tons: Optional[float] = None
    co2_equivalent_tons: Optional[float] = None
    annual_sequestration_tons: Optional[float] = None
    potential_credits: Optional[float] = None
    unit: str
    status: str
    reviewer_id: Optional[UUID] = None
    reviewer_comments: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    calculated_at: datetime
    created_at: datetime
    updated_at: datetime