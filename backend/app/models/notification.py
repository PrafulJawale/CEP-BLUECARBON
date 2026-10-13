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


class NotificationType(str, enum.Enum):
    PROJECT_SUBMITTED = "project_submitted"
    PROJECT_APPROVED = "project_approved"
    PROJECT_REJECTED = "project_rejected"
    CHANGES_REQUESTED = "changes_requested"
    EVIDENCE_REVIEWED = "evidence_reviewed"
    CREDITS_ISSUED = "credits_issued"
    LISTING_CREATED = "listing_created"
    LISTING_SOLD = "listing_sold"
    PURCHASE_COMPLETED = "purchase_completed"
    VERIFICATION_STARTED = "verification_started"
    CALCULATION_REVIEWED = "calculation_reviewed"
    SYSTEM_ALERT = "system_alert"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    reference_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), nullable=True
    )
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_read: Mapped[bool] = mapped_column(default=False, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications", foreign_keys="Notification.user_id")

    __table_args__ = (
        Index("ix_notification_user_read", "user_id", "is_read"),
        Index("ix_notification_user_created", "user_id", "created_at"),
        Index("ix_notification_type", "type"),
    )