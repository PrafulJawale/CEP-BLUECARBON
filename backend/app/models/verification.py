import enum
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class VerificationDecision(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CHANGES_REQUESTED = "changes_requested"


class VerificationReview(Base):
    __tablename__ = "verification_reviews"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    reviewer_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    decision: Mapped[VerificationDecision] = mapped_column(
        Enum(VerificationDecision), default=VerificationDecision.PENDING, nullable=False
    )
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_reviewed: Mapped[bool] = mapped_column(default=False, nullable=False)
    calculation_reviewed: Mapped[bool] = mapped_column(default=False, nullable=False)
    methodology_compliant: Mapped[bool | None] = mapped_column(nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
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
        "Project", back_populates="verification_reviews"
    )
    reviewer: Mapped["User"] = relationship(
        "User", back_populates="verification_reviews", foreign_keys="VerificationReview.reviewer_id"
    )

    __table_args__ = (
        Index("ix_verification_project", "project_id"),
        Index("ix_verification_reviewer", "reviewer_id"),
        Index("ix_verification_decision", "decision"),
    )