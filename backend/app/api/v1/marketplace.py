from datetime import datetime, timezone
from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps.auth import (
    get_current_active_user,
    require_buyer,
    require_project_developer,
)
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.credit import Credit, CreditStatus
from app.models.marketplace import MarketplaceListing, ListingStatus, Transaction, TransactionStatus
from app.models.ownership import CreditOwnership
from app.models.user import User, UserRole
from app.schemas.marketplace import (
    MarketplaceListingCreate,
    MarketplaceListingUpdate,
    MarketplaceListingResponse,
    MarketplaceListingListResponse,
    TransactionCreate,
    TransactionResponse,
    TransactionListResponse,
    TransactionUpdate,
)

router = APIRouter()


import json

def create_audit_log(
    db: AsyncSession,
    user_id: UUID | None,
    project_id: UUID | None,
    action: str,
    entity_type: str,
    entity_id: UUID | None,
    old_values: dict | None = None,
    new_values: dict | None = None,
):
    audit = AuditLog(
        user_id=user_id,
        project_id=project_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=json.dumps(old_values) if old_values else None,
        new_values=json.dumps(new_values) if new_values else None,
    )
    db.add(audit)


@router.post("/listings", response_model=MarketplaceListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    listing_data: MarketplaceListingCreate,
    current_user: User = Depends(require_project_developer),
    db: AsyncSession = Depends(get_db),
):
    # Verify credit exists and is issued
    credit_query = select(Credit).where(Credit.id == listing_data.credit_id)
    credit_result = await db.execute(credit_query)
    credit = credit_result.scalar_one_or_none()

    if not credit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credit not found",
        )

    if credit.status != CreditStatus.ISSUED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only issued credits can be listed",
        )

    # Verify ownership and sufficient quantity
    ownership_query = select(CreditOwnership).where(
        CreditOwnership.credit_id == credit.id,
        CreditOwnership.owner_id == current_user.id,
        CreditOwnership.is_current == True,
    )
    ownership_result = await db.execute(ownership_query)
    ownership = ownership_result.scalar_one_or_none()

    if not ownership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this credit",
        )

    if ownership.quantity < listing_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient credit quantity to list",
        )

    # Check for existing active listing for same credit by same seller
    existing_query = select(MarketplaceListing).where(
        MarketplaceListing.credit_id == credit.id,
        MarketplaceListing.seller_id == current_user.id,
        MarketplaceListing.status == ListingStatus.ACTIVE,
    )
    existing_result = await db.execute(existing_query)
    existing = existing_result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active listing already exists for this credit",
        )

    listing = MarketplaceListing(
        credit_id=listing_data.credit_id,
        seller_id=current_user.id,
        quantity=listing_data.quantity,
        price_per_unit=listing_data.price_per_unit,
        currency=listing_data.currency,
        description=listing_data.description,
        expires_at=listing_data.expires_at,
        status=ListingStatus.ACTIVE,
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)

    create_audit_log(
        db, current_user.id, credit.project_id, "create_listing", "marketplace_listing", listing.id,
        new_values={
            "credit_id": str(credit.id),
            "quantity": listing.quantity,
            "price_per_unit": listing.price_per_unit,
        }
    )
    await db.commit()

    return listing


@router.get("/listings", response_model=List[MarketplaceListingListResponse])
async def list_marketplace_listings(
    status: Optional[ListingStatus] = Query(default=ListingStatus.ACTIVE),
    credit_id: Optional[UUID] = None,
    seller_id: Optional[UUID] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(MarketplaceListing).options(selectinload(MarketplaceListing.credit))

    if status:
        query = query.where(MarketplaceListing.status == status)
    if credit_id:
        query = query.where(MarketplaceListing.credit_id == credit_id)
    if seller_id:
        query = query.where(MarketplaceListing.seller_id == seller_id)
    if min_price is not None:
        query = query.where(MarketplaceListing.price_per_unit >= min_price)
    if max_price is not None:
        query = query.where(MarketplaceListing.price_per_unit <= max_price)

    query = query.order_by(MarketplaceListing.listed_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    listings = result.scalars().all()

    return [MarketplaceListingListResponse.model_validate(l) for l in listings]


@router.get("/listings/{listing_id}", response_model=MarketplaceListingResponse)
async def get_listing(
    listing_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(MarketplaceListing).options(selectinload(MarketplaceListing.credit)).where(MarketplaceListing.id == listing_id)
    result = await db.execute(query)
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    return listing


@router.patch("/listings/{listing_id}", response_model=MarketplaceListingResponse)
async def update_listing(
    listing_id: UUID,
    listing_data: MarketplaceListingUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(MarketplaceListing).where(MarketplaceListing.id == listing_id)
    result = await db.execute(query)
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    # Only seller or admin can update
    if current_user.role != UserRole.ADMIN and listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this listing",
        )

    if listing.status != ListingStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update active listings",
        )

    old_values = {
        "quantity": float(listing.quantity),
        "price_per_unit": float(listing.price_per_unit),
        "status": listing.status.value,
    }

    update_data = listing_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(listing, field, value)

    listing.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(listing)

    new_values = {
        "quantity": float(listing.quantity),
        "price_per_unit": float(listing.price_per_unit),
        "status": listing.status.value,
    }

    create_audit_log(
        db, current_user.id, listing.credit.project_id, "update_listing", "marketplace_listing", listing.id,
        old_values=old_values, new_values=new_values
    )
    await db.commit()

    return listing


@router.post("/listings/{listing_id}/cancel", response_model=MarketplaceListingResponse)
async def cancel_listing(
    listing_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(MarketplaceListing).where(MarketplaceListing.id == listing_id)
    result = await db.execute(query)
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    if current_user.role != UserRole.ADMIN and listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this listing",
        )

    if listing.status != ListingStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel active listings",
        )

    listing.status = ListingStatus.CANCELLED
    listing.cancelled_at = datetime.now(timezone.utc)
    listing.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(listing)

    create_audit_log(
        db, current_user.id, listing.credit.project_id, "cancel_listing", "marketplace_listing", listing.id,
        old_values={"status": ListingStatus.ACTIVE.value},
        new_values={"status": ListingStatus.CANCELLED.value}
    )
    await db.commit()

    return listing


@router.post("/purchase", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def purchase_credits(
    purchase_data: TransactionCreate,
    current_user: User = Depends(require_buyer),
    db: AsyncSession = Depends(get_db),
):
    # Get listing with credit
    listing_query = select(MarketplaceListing).options(selectinload(MarketplaceListing.credit)).where(
        MarketplaceListing.id == purchase_data.listing_id
    )
    listing_result = await db.execute(listing_query)
    listing = listing_result.scalar_one_or_none()

    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    if listing.status != ListingStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing is not active",
        )

    # Prevent self-purchase
    if listing.seller_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot purchase your own listing",
        )

    if purchase_data.quantity > listing.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase quantity exceeds available listing quantity",
        )

    expected_total = round(purchase_data.quantity * listing.price_per_unit, 4)
    if abs(purchase_data.total_amount - expected_total) > 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total amount does not match quantity * price",
        )

    if purchase_data.currency != listing.currency:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Currency mismatch",
        )

    # Create transaction (atomic operation)
    transaction = Transaction(
        listing_id=listing.id,
        buyer_id=current_user.id,
        seller_id=listing.seller_id,
        credit_id=listing.credit_id,
        quantity=purchase_data.quantity,
        price_per_unit=listing.price_per_unit,
        total_amount=purchase_data.total_amount,
        currency=listing.currency,
        status=TransactionStatus.COMPLETED,
        payment_reference=purchase_data.payment_reference,
        payment_method=purchase_data.payment_method,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(transaction)
    await db.flush()

    # Update listing
    listing.quantity -= purchase_data.quantity
    if listing.quantity == 0:
        listing.status = ListingStatus.SOLD
        listing.sold_at = datetime.now(timezone.utc)
    listing.updated_at = datetime.now(timezone.utc)

    # Update credit ownership
    # Decrease seller's ownership
    seller_ownership_query = select(CreditOwnership).where(
        CreditOwnership.credit_id == listing.credit_id,
        CreditOwnership.owner_id == listing.seller_id,
        CreditOwnership.is_current == True,
    )
    seller_ownership_result = await db.execute(seller_ownership_query)
    seller_ownership = seller_ownership_result.scalar_one_or_none()

    if seller_ownership:
        seller_ownership.quantity -= purchase_data.quantity
        if seller_ownership.quantity == 0:
            seller_ownership.is_current = False

    # Create buyer ownership
    buyer_ownership = CreditOwnership(
        credit_id=listing.credit_id,
        owner_id=current_user.id,
        quantity=purchase_data.quantity,
        transaction_id=transaction.id,
        is_current=True,
    )
    db.add(buyer_ownership)

    # Update credit status if fully sold
    credit_query = select(Credit).where(Credit.id == listing.credit_id)
    credit_result = await db.execute(credit_query)
    credit = credit_result.scalar_one_or_none()

    if credit and credit.status == CreditStatus.ISSUED:
        # Check if all credits from this batch are now owned by buyers (not the original project owner)
        total_ownership_query = select(func.sum(CreditOwnership.quantity)).where(
            CreditOwnership.credit_id == credit.id,
            CreditOwnership.is_current == True,
        )
        total_ownership_result = await db.execute(total_ownership_query)
        total_owned = total_ownership_result.scalar() or 0

        # If the project owner no longer owns any, mark as sold
        project_owner_ownership_query = select(CreditOwnership).where(
            CreditOwnership.credit_id == credit.id,
            CreditOwnership.owner_id == credit.project.owner_id,
            CreditOwnership.is_current == True,
        )
        project_owner_result = await db.execute(project_owner_ownership_query)
        project_owner_ownership = project_owner_result.scalar_one_or_none()

        if project_owner_ownership is None or project_owner_ownership.quantity == 0:
            credit.status = CreditStatus.SOLD

    await db.commit()
    await db.refresh(transaction)

    create_audit_log(
        db, current_user.id, listing.credit.project_id, "purchase", "transaction", transaction.id,
        new_values={
            "listing_id": str(listing.id),
            "quantity": purchase_data.quantity,
            "total_amount": purchase_data.total_amount,
            "seller_id": str(listing.seller_id),
        }
    )
    await db.commit()

    return transaction


@router.get("/transactions", response_model=List[TransactionListResponse])
async def list_transactions(
    status: Optional[TransactionStatus] = None,
    buyer_id: Optional[UUID] = None,
    seller_id: Optional[UUID] = None,
    credit_id: Optional[UUID] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    # Non-admin users can only see their own transactions
    query = select(Transaction)

    if current_user.role != UserRole.ADMIN:
        query = query.where(
            (Transaction.buyer_id == current_user.id) | (Transaction.seller_id == current_user.id)
        )

    if status:
        query = query.where(Transaction.status == status)
    if buyer_id and current_user.role == UserRole.ADMIN:
        query = query.where(Transaction.buyer_id == buyer_id)
    if seller_id and current_user.role == UserRole.ADMIN:
        query = query.where(Transaction.seller_id == seller_id)
    if credit_id:
        query = query.where(Transaction.credit_id == credit_id)

    query = query.order_by(Transaction.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    transactions = result.scalars().all()

    return [TransactionListResponse.model_validate(t) for t in transactions]


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Transaction).where(Transaction.id == transaction_id)
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    # Check access
    if current_user.role != UserRole.ADMIN:
        if transaction.buyer_id != current_user.id and transaction.seller_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this transaction",
            )

    return transaction