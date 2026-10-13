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
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CreditStatus(str, enum.Enum):
    PROPOSED = "proposed"
    ISSUED = "issued"
    LISTED = "listed"
    SOLD = "sold"
    TRANSFERRED = "transferred"
    RETIRED = "retired"
    CANCELLED = "cancelled"


class Credit(Base):
    __tablename__ = "credits"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    calculation_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("carbon_calculations.id", ondelete="SET NULL"),
        nullable=True,
    )
    # Unique identifier for the credit batch
    batch_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    quantity: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), default="tCO2e", nullable=False)
    vintage_year: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[CreditStatus] = mapped_column(
        Enum(CreditStatus), default=CreditStatus.PROPOSED, nullable=False
    )
    # Issuance details
    issued_by: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    issuance_tx_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    # Retirement details
    retired_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    retirement_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Metadata
    methodology_name: Mapped[str] = mapped_column(String(255), nullable=False)
    methodology_version: Mapped[str] = mapped_column(String(50), nullable=False)
    serial_number_start: Mapped[int | None] = mapped_column(nullable=True)
    serial_number_end: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        
        nullable=False,
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="credits")
    calculation: Mapped["CarbonCalculation | None"] = relationship("CarbonCalculation")
    issuer: Mapped["User | None"] = relationship("User", foreign_keys=[issued_by])
    ownership_records: Mapped[list["CreditOwnership"]] = relationship(
        "CreditOwnership", back_populates="credit", cascade="all, delete-orphan"
    )
    marketplace_listings: Mapped[list["MarketplaceListing"]] = relationship(
        "MarketplaceListing", back_populates="credit"
    )

    __table_args__ = (
        Index("ix_credits_project_status", "project_id", "status"),
        Index("ix_credits_vintage", "vintage_year"),
        Index("ix_credits_batch", "batch_id"),
        UniqueConstraint("project_id", "batch_id", name="uq_credit_project_batch"),
    )