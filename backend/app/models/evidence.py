import enum
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class EvidenceType(str, enum.Enum):
    DRONE_IMAGE = "drone_image"
    SATELLITE_IMAGE = "satellite_image"
    FIELD_PHOTO = "field_photo"
    DOCUMENT = "document"
    MAP = "map"
    IoT_DATA = "iot_data"
    OTHER = "other"


class EvidenceStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    uploader_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)
    evidence_type: Mapped[EvidenceType] = mapped_column(
        Enum(EvidenceType), nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[EvidenceStatus] = mapped_column(
        Enum(EvidenceStatus), default=EvidenceStatus.PENDING, nullable=False
    )
    reviewer_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewer_comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(
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

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="evidence")
    uploader: Mapped["User"] = relationship("User", back_populates="evidence_uploads", foreign_keys="Evidence.uploader_id")
    reviewer: Mapped["User | None"] = relationship("User", foreign_keys=[reviewer_id])

    __table_args__ = (
        Index("ix_evidence_project_status", "project_id", "status"),
        Index("ix_evidence_uploader", "uploader_id"),
        Index("ix_evidence_type", "evidence_type"),
    )