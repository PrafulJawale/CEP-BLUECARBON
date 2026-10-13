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


class ObservationType(str, enum.Enum):
    BIOMASS = "biomass"
    CARBON_STOCK = "carbon_stock"
    TREE_HEIGHT = "tree_height"
    TREE_DIAMETER = "tree_diameter"
    CANOPY_COVER = "canopy_cover"
    SOIL_CARBON = "soil_carbon"
    WATER_LEVEL = "water_level"
    SALINITY = "salinity"
    TEMPERATURE = "temperature"
    PH = "ph"
    BIODIVERSITY_INDEX = "biodiversity_index"
    OTHER = "other"


class ObservationSource(str, enum.Enum):
    MANUAL = "manual"
    SENSOR = "sensor"
    SATELLITE = "satellite"
    DRONE = "drone"
    LAB_ANALYSIS = "lab_analysis"
    IMPORTED = "imported"
    SIMULATED = "simulated"


class DataQuality(str, enum.Enum):
    RAW = "raw"
    VALIDATED = "validated"
    FLAGGED = "flagged"
    REJECTED = "rejected"


class MonitoringObservation(Base):
    __tablename__ = "monitoring_observations"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    observer_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    observation_type: Mapped[ObservationType] = mapped_column(
        Enum(ObservationType), nullable=False
    )
    value: Mapped[float] = mapped_column(Numeric(15, 6), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    source: Mapped[ObservationSource] = mapped_column(
        Enum(ObservationSource), nullable=False
    )
    quality: Mapped[DataQuality] = mapped_column(
        Enum(DataQuality), default=DataQuality.RAW, nullable=False
    )
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 8), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(11, 8), nullable=True)
    depth_meters: Mapped[float | None] = mapped_column(Numeric(8, 3), nullable=True)
    observed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    evidence_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("evidence.id", ondelete="SET NULL"),
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        
        nullable=False,
    )

    # Relationships
    project: Mapped["Project"] = relationship(
        "Project", back_populates="monitoring_observations"
    )
    observer: Mapped["User"] = relationship(
        "User", back_populates="monitoring_observations", foreign_keys="MonitoringObservation.observer_id"
    )
    evidence: Mapped["Evidence | None"] = relationship("Evidence")

    __table_args__ = (
        Index("ix_monitoring_project_type", "project_id", "observation_type"),
        Index("ix_monitoring_project_date", "project_id", "observed_at"),
        Index("ix_monitoring_source", "source"),
        Index("ix_monitoring_quality", "quality"),
    )