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


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PROJECT_DEVELOPER = "project_developer"
    GOVERNMENT_OFFICER = "government_officer"
    RESEARCHER = "researcher"
    BUYER = "buyer"
    COMMUNITY_REPRESENTATIVE = "community_representative"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING_VERIFICATION = "pending_verification"
    SUSPENDED = "suspended"


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.PROJECT_DEVELOPER, nullable=False
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus), default=UserStatus.PENDING_VERIFICATION, nullable=False
    )
    organization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    projects: Mapped[list["Project"]] = relationship(
        "Project", back_populates="owner", foreign_keys="Project.owner_id"
    )
    evidence_uploads: Mapped[list["Evidence"]] = relationship(
        "Evidence", back_populates="uploader", foreign_keys="Evidence.uploader_id"
    )
    monitoring_observations: Mapped[list["MonitoringObservation"]] = relationship(
        "MonitoringObservation", back_populates="observer", foreign_keys="MonitoringObservation.observer_id"
    )
    verification_reviews: Mapped[list["VerificationReview"]] = relationship(
        "VerificationReview", back_populates="reviewer", foreign_keys="VerificationReview.reviewer_id"
    )
    carbon_calculations: Mapped[list["CarbonCalculation"]] = relationship(
        "CarbonCalculation", back_populates="calculator", foreign_keys="CarbonCalculation.calculator_id"
    )
    credit_ownership: Mapped[list["CreditOwnership"]] = relationship(
        "CreditOwnership", back_populates="owner"
    )
    transactions_as_buyer: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="buyer", foreign_keys="Transaction.buyer_id"
    )
    transactions_as_seller: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="seller", foreign_keys="Transaction.seller_id"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user", foreign_keys="Notification.user_id"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog", back_populates="user", foreign_keys="AuditLog.user_id"
    )

    __table_args__ = (
        Index("ix_users_email_role", "email", "role"),
        Index("ix_users_status", "status"),
    )