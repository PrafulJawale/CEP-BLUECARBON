from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CreditOwnership(Base):
    __tablename__ = "credit_ownership"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    credit_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("credits.id", ondelete="CASCADE"),
        nullable=False,
    )
    owner_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    acquired_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    transaction_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_current: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    credit: Mapped["Credit"] = relationship("Credit", back_populates="ownership_records")
    owner: Mapped["User"] = relationship("User", back_populates="credit_ownership")
    transaction: Mapped["Transaction | None"] = relationship("Transaction")

    __table_args__ = (
        Index("ix_ownership_credit_current", "credit_id", "is_current"),
        Index("ix_ownership_owner_current", "owner_id", "is_current"),
        Index("ix_ownership_transaction", "transaction_id"),
    )