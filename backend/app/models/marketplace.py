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


class ListingStatus(str, enum.Enum):
    ACTIVE = "active"
    SOLD = "sold"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    credit_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("credits.id", ondelete="CASCADE"),
        nullable=False,
    )
    seller_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    price_per_unit: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    status: Mapped[ListingStatus] = mapped_column(
        Enum(ListingStatus), default=ListingStatus.ACTIVE, nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    listed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    sold_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        
        nullable=False,
    )

    # Relationships
    credit: Mapped["Credit"] = relationship("Credit", back_populates="marketplace_listings")
    seller: Mapped["User"] = relationship("User", foreign_keys=[seller_id])
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="listing"
    )

    __table_args__ = (
        Index("ix_listing_seller_status", "seller_id", "status"),
        Index("ix_listing_credit_status", "credit_id", "status"),
        Index("ix_listing_status_active", "status"),
    )


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    listing_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("marketplace_listings.id", ondelete="RESTRICT"),
        nullable=False,
    )
    buyer_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    seller_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    credit_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("credits.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    price_per_unit: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    status: Mapped[TransactionStatus] = mapped_column(
        Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False
    )
    payment_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        
        nullable=False,
    )

    # Relationships
    listing: Mapped["MarketplaceListing"] = relationship(
        "MarketplaceListing", back_populates="transactions"
    )
    buyer: Mapped["User"] = relationship("User", back_populates="transactions_as_buyer", foreign_keys=[buyer_id])
    seller: Mapped["User"] = relationship("User", back_populates="transactions_as_seller", foreign_keys=[seller_id])
    credit: Mapped["Credit"] = relationship("Credit")
    ownership_records: Mapped[list["CreditOwnership"]] = relationship(
        "CreditOwnership", back_populates="transaction"
    )

    __table_args__ = (
        Index("ix_transaction_buyer", "buyer_id"),
        Index("ix_transaction_seller", "seller_id"),
        Index("ix_transaction_credit", "credit_id"),
        Index("ix_transaction_status", "status"),
        Index("ix_transaction_listing", "listing_id"),
    )