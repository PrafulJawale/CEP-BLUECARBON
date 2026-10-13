from datetime import datetime, timezone
from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps.auth import (
    get_current_active_user,
    require_admin,
    require_gov_officer,
)
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.credit import Credit, CreditStatus
from app.models.calculation import CarbonCalculation, CalculationStatus
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole
from app.schemas.credit import (
    CreditCreate,
    CreditIssuance,
    CreditRetirement,
    CreditResponse,
    CreditListResponse,
    CreditUpdate,
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


@router.post("/issue", response_model=CreditResponse, status_code=status.HTTP_201_CREATED)
async def issue_credits(
    issuance: CreditIssuance,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    # Verify calculation exists and is approved
    calc_query = select(CarbonCalculation).where(CarbonCalculation.id == issuance.calculation_id)
    calc_result = await db.execute(calc_query)
    calc = calc_result.scalar_one_or_none()

    if not calc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found",
        )

    if calc.status != CalculationStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Calculation must be approved before issuing credits",
        )

    # Verify project is approved
    project_query = select(Project).where(Project.id == calc.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if not project or project.status != ProjectStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project must be approved before issuing credits",
        )

    # Check for duplicate batch_id
    existing_query = select(Credit).where(Credit.batch_id == issuance.batch_id)
    existing_result = await db.execute(existing_query)
    existing = existing_result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credit batch with this ID already exists",
        )

    # Create credit
    credit = Credit(
        project_id=calc.project_id,
        calculation_id=calc.id,
        batch_id=issuance.batch_id,
        quantity=issuance.quantity,
        vintage_year=issuance.vintage_year,
        methodology_name=calc.methodology_name,
        methodology_version=calc.methodology_version,
        status=CreditStatus.ISSUED,
        issued_by=current_user.id,
        issued_at=datetime.now(timezone.utc),
        issuance_tx_hash=issuance.issuance_tx_hash,
        serial_number_start=issuance.serial_number_start,
        serial_number_end=issuance.serial_number_end,
    )
    db.add(credit)
    await db.commit()
    await db.refresh(credit)

    # Create initial ownership record for the project owner
    from app.models.ownership import CreditOwnership
    ownership = CreditOwnership(
        credit_id=credit.id,
        owner_id=project.owner_id,
        quantity=credit.quantity,
        is_current=True,
    )
    db.add(ownership)
    await db.commit()

    create_audit_log(
        db, current_user.id, credit.project_id, "issue", "credit", credit.id,
        new_values={
            "batch_id": credit.batch_id,
            "quantity": credit.quantity,
            "vintage_year": credit.vintage_year,
            "calculation_id": str(calc.id),
        }
    )
    await db.commit()

    return credit


@router.get("/project/{project_id}", response_model=List[CreditListResponse])
async def list_project_credits(
    project_id: UUID,
    status: Optional[CreditStatus] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify project access
    project_query = select(Project).where(Project.id == project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view credits for this project",
            )

    query = select(Credit).where(Credit.project_id == project_id)

    if status:
        query = query.where(Credit.status == status)

    query = query.order_by(Credit.created_at.desc())
    result = await db.execute(query)
    credits = result.scalars().all()

    return [CreditListResponse.model_validate(c) for c in credits]


@router.get("/{credit_id}", response_model=CreditResponse)
async def get_credit(
    credit_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Credit).where(Credit.id == credit_id)
    result = await db.execute(query)
    credit = result.scalar_one_or_none()

    if not credit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credit not found",
        )

    # Verify project access
    project_query = select(Project).where(Project.id == credit.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this credit",
            )

    return credit


@router.post("/{credit_id}/retire", response_model=CreditResponse)
async def retire_credits(
    credit_id: UUID,
    retirement: CreditRetirement,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Credit).where(Credit.id == credit_id)
    result = await db.execute(query)
    credit = result.scalar_one_or_none()

    if not credit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credit not found",
        )

    # Verify ownership
    from app.models.ownership import CreditOwnership
    ownership_query = select(CreditOwnership).where(
        CreditOwnership.credit_id == credit_id,
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

    if ownership.quantity < retirement.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient credit quantity to retire",
        )

    if credit.status == CreditStatus.RETIRED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credit already retired",
        )

    old_quantity = ownership.quantity
    ownership.quantity -= retirement.quantity

    if ownership.quantity == 0:
        ownership.is_current = False

    if retirement.quantity == credit.quantity:
        credit.status = CreditStatus.RETIRED
        credit.retired_at = datetime.now(timezone.utc)
        credit.retirement_reason = retirement.retirement_reason
    else:
        # Partial retirement - create new credit for retired portion
        retired_credit = Credit(
            project_id=credit.project_id,
            calculation_id=credit.calculation_id,
            batch_id=f"{credit.batch_id}-RET-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            quantity=retirement.quantity,
            vintage_year=credit.vintage_year,
            methodology_name=credit.methodology_name,
            methodology_version=credit.methodology_version,
            status=CreditStatus.RETIRED,
            retired_at=datetime.now(timezone.utc),
            retirement_reason=retirement.retirement_reason,
        )
        db.add(retired_credit)
        await db.flush()

        # Create ownership for retired credit
        retired_ownership = CreditOwnership(
            credit_id=retired_credit.id,
            owner_id=current_user.id,
            quantity=retirement.quantity,
            is_current=False,  # Retired credits are not "currently owned"
        )
        db.add(retired_ownership)

    credit.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(credit)

    create_audit_log(
        db, current_user.id, credit.project_id, "retire", "credit", credit_id,
        old_values={"quantity": float(old_quantity), "status": credit.status.value},
        new_values={"retired_quantity": retirement.quantity, "status": credit.status.value}
    )
    await db.commit()

    return credit