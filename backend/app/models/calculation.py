import enum
import json
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    func,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CalculationStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class CarbonCalculation(Base):
    __tablename__ = "carbon_calculations"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    calculator_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    methodology_name: Mapped[str] = mapped_column(String(255), nullable=False)
    methodology_version: Mapped[str] = mapped_column(String(50), nullable=False)
    methodology_reference: Mapped[str | None] = mapped_column(String(512), nullable=True)
    input_parameters: Mapped[dict] = mapped_column(JSON, nullable=False)
    biomass_tons: Mapped[float | None] = mapped_column(Numeric(15, 4), nullable=True)
    carbon_stock_tons: Mapped[float | None] = mapped_column(Numeric(15, 4), nullable=True)
    co2_equivalent_tons: Mapped[float | None] = mapped_column(Numeric(15, 4), nullable=True)
    annual_sequestration_tons: Mapped[float | None] = mapped_column(Numeric(15, 4), nullable=True)
    potential_credits: Mapped[float | None] = mapped_column(Numeric(15, 4), nullable=True)
    unit: Mapped[str] = mapped_column(String(50), default="tCO2e", nullable=False)
    assumptions: Mapped[str | None] = mapped_column(Text, nullable=True)
    limitations: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_provenance: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[CalculationStatus] = mapped_column(
        Enum(CalculationStatus), default=CalculationStatus.DRAFT, nullable=False
    )
    reviewer_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewer_comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        
        nullable=False,
    )

    project: Mapped["Project"] = relationship(
        "Project", back_populates="carbon_calculations"
    )
    calculator: Mapped["User"] = relationship(
        "User", back_populates="carbon_calculations", foreign_keys=[calculator_id]
    )
    reviewer: Mapped["User | None"] = relationship("User", foreign_keys=[reviewer_id])

    __table_args__ = (
        Index("ix_calculation_project_status", "project_id", "status"),
        Index("ix_calculation_methodology", "methodology_name", "methodology_version"),
    )