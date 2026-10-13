from datetime import datetime, timezone
from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps.auth import (
    get_current_active_user,
    require_gov_officer,
    require_project_developer,
)
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.calculation import CarbonCalculation, CalculationStatus
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole
from app.schemas.calculation import (
    CarbonCalculationCreate,
    CarbonCalculationUpdate,
    CarbonCalculationReview,
    CarbonCalculationResponse,
)

router = APIRouter()


import json
from uuid import UUID
from datetime import datetime

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
    def serialize_value(obj):
        if isinstance(obj, UUID):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, dict):
            return {k: serialize_value(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [serialize_value(v) for v in obj]
        return obj
    
    audit = AuditLog(
        user_id=user_id,
        project_id=project_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=json.dumps(serialize_value(old_values)) if old_values else None,
        new_values=json.dumps(serialize_value(new_values)) if new_values else None,
    )
    db.add(audit)


@router.post("", response_model=CarbonCalculationResponse, status_code=status.HTTP_201_CREATED)
async def create_calculation(
    calc_data: CarbonCalculationCreate,
    current_user: User = Depends(require_project_developer),
    db: AsyncSession = Depends(get_db),
):
    # Verify project access
    project_query = select(Project).where(Project.id == calc_data.project_id)
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
                detail="Not authorized to create calculations for this project",
            )

    calc = CarbonCalculation(
        project_id=calc_data.project_id,
        calculator_id=current_user.id,
        **calc_data.model_dump(exclude={"project_id"}),
        status=CalculationStatus.DRAFT,
    )
    db.add(calc)
    await db.commit()
    await db.refresh(calc)

    create_audit_log(
        db, current_user.id, calc.project_id, "create", "carbon_calculation", calc.id,
        new_values=calc_data.model_dump()
    )
    await db.commit()

    return calc


@router.get("/project/{project_id}", response_model=List[CarbonCalculationResponse])
async def list_project_calculations(
    project_id: UUID,
    status: Optional[CalculationStatus] = None,
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
                detail="Not authorized to view calculations for this project",
            )

    query = select(CarbonCalculation).where(CarbonCalculation.project_id == project_id)

    if status:
        query = query.where(CarbonCalculation.status == status)

    query = query.order_by(CarbonCalculation.calculated_at.desc())
    result = await db.execute(query)
    calculations = result.scalars().all()

    return [CarbonCalculationResponse.model_validate(c) for c in calculations]


@router.get("/{calc_id}", response_model=CarbonCalculationResponse)
async def get_calculation(
    calc_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(CarbonCalculation).where(CarbonCalculation.id == calc_id)
    result = await db.execute(query)
    calc = result.scalar_one_or_none()

    if not calc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found",
        )

    # Verify project access
    project_query = select(Project).where(Project.id == calc.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this calculation",
            )

    return calc


@router.patch("/{calc_id}", response_model=CarbonCalculationResponse)
async def update_calculation(
    calc_id: UUID,
    calc_data: CarbonCalculationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(CarbonCalculation).where(CarbonCalculation.id == calc_id)
    result = await db.execute(query)
    calc = result.scalar_one_or_none()

    if not calc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found",
        )

    # Verify project access
    project_query = select(Project).where(Project.id == calc.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this calculation",
            )

    if calc.status not in [CalculationStatus.DRAFT, CalculationStatus.REJECTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update calculation in current status",
        )

    old_values = {
        "methodology_name": calc.methodology_name,
        "methodology_version": calc.methodology_version,
        "biomass_tons": float(calc.biomass_tons) if calc.biomass_tons else None,
        "carbon_stock_tons": float(calc.carbon_stock_tons) if calc.carbon_stock_tons else None,
        "co2_equivalent_tons": float(calc.co2_equivalent_tons) if calc.co2_equivalent_tons else None,
        "annual_sequestration_tons": float(calc.annual_sequestration_tons) if calc.annual_sequestration_tons else None,
        "potential_credits": float(calc.potential_credits) if calc.potential_credits else None,
    }

    update_data = calc_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(calc, field, value)

    calc.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(calc)

    new_values = {
        "methodology_name": calc.methodology_name,
        "methodology_version": calc.methodology_version,
        "biomass_tons": float(calc.biomass_tons) if calc.biomass_tons else None,
        "carbon_stock_tons": float(calc.carbon_stock_tons) if calc.carbon_stock_tons else None,
        "co2_equivalent_tons": float(calc.co2_equivalent_tons) if calc.co2_equivalent_tons else None,
        "annual_sequestration_tons": float(calc.annual_sequestration_tons) if calc.annual_sequestration_tons else None,
        "potential_credits": float(calc.potential_credits) if calc.potential_credits else None,
    }

    create_audit_log(
        db, current_user.id, calc.project_id, "update", "carbon_calculation", calc.id,
        old_values=old_values, new_values=new_values
    )
    await db.commit()

    return calc


@router.post("/{calc_id}/submit", response_model=CarbonCalculationResponse)
async def submit_calculation(
    calc_id: UUID,
    current_user: User = Depends(require_project_developer),
    db: AsyncSession = Depends(get_db),
):
    query = select(CarbonCalculation).where(CarbonCalculation.id == calc_id)
    result = await db.execute(query)
    calc = result.scalar_one_or_none()

    if not calc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found",
        )

    # Verify project access
    project_query = select(Project).where(Project.id == calc.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to submit this calculation",
            )

    if calc.status != CalculationStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft calculations can be submitted",
        )

    calc.status = CalculationStatus.SUBMITTED
    calc.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(calc)

    create_audit_log(
        db, current_user.id, calc.project_id, "submit", "carbon_calculation", calc.id,
        old_values={"status": CalculationStatus.DRAFT.value},
        new_values={"status": CalculationStatus.SUBMITTED.value}
    )
    await db.commit()

    return calc


@router.post("/{calc_id}/review", response_model=CarbonCalculationResponse)
async def review_calculation(
    calc_id: UUID,
    review_data: CarbonCalculationReview,
    current_user: User = Depends(require_gov_officer),
    db: AsyncSession = Depends(get_db),
):
    query = select(CarbonCalculation).where(CarbonCalculation.id == calc_id)
    result = await db.execute(query)
    calc = result.scalar_one_or_none()

    if not calc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found",
        )

    if calc.status not in [CalculationStatus.SUBMITTED, CalculationStatus.UNDER_REVIEW]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Calculation is not in a reviewable state",
        )

    old_status = calc.status
    calc.status = CalculationStatus(review_data.status)
    calc.reviewer_id = current_user.id
    calc.reviewer_comments = review_data.reviewer_comments
    calc.reviewed_at = datetime.now(timezone.utc)
    calc.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(calc)

    create_audit_log(
        db, current_user.id, calc.project_id, "review", "carbon_calculation", calc.id,
        old_values={"status": old_status.value},
        new_values={"status": calc.status.value, "comments": review_data.reviewer_comments}
    )
    await db.commit()

    return calc