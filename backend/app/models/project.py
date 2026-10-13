import enum
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
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class ProjectStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    CHANGES_REQUESTED = "changes_requested"
    APPROVED = "approved"
    REJECTED = "rejected"


class EcosystemType(str, enum.Enum):
    MANGROVE = "mangrove"
    SEAGRASS = "seagrass"
    SALT_MARSH = "salt_marsh"
    COASTAL_WETLAND = "coastal_wetland"
    OTHER = "other"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    owner_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    ecosystem_type: Mapped[EcosystemType] = mapped_column(
        Enum(EcosystemType), nullable=False
    )
    # Geographic location
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    state_province: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Coordinates (centroid point)
    latitude: Mapped[float] = mapped_column(Numeric(10, 8), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(11, 8), nullable=False)
    # Area
    area_hectares: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    # Optional boundary geometry (GeoJSON)
    boundary_geojson: Mapped[dict | None] = mapped_column(Text, nullable=True)
    # Status
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), default=ProjectStatus.DRAFT, nullable=False
    )
    # Timestamps
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="projects", foreign_keys=[owner_id])
    evidence: Mapped[list["Evidence"]] = relationship(
        "Evidence", back_populates="project", cascade="all, delete-orphan"
    )
    monitoring_observations: Mapped[list["MonitoringObservation"]] = relationship(
        "MonitoringObservation", back_populates="project", cascade="all, delete-orphan"
    )
    verification_reviews: Mapped[list["VerificationReview"]] = relationship(
        "VerificationReview", back_populates="project", cascade="all, delete-orphan"
    )
    carbon_calculations: Mapped[list["CarbonCalculation"]] = relationship(
        "CarbonCalculation", back_populates="project", cascade="all, delete-orphan"
    )
    credits: Mapped[list["Credit"]] = relationship(
        "Credit", back_populates="project", cascade="all, delete-orphan"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog", back_populates="project"
    )

    __table_args__ = (
        Index("ix_projects_owner_status", "owner_id", "status"),
        Index("ix_projects_status", "status"),
        Index("ix_projects_ecosystem_type", "ecosystem_type"),
        Index("ix_projects_location", "country", "state_province"),
        Index("ix_projects_coordinates", "latitude", "longitude"),
    )