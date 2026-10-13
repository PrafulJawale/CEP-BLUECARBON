from datetime import datetime, timezone
from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps.auth import (
    get_current_active_user,
    require_gov_officer,
    require_project_developer,
)
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.monitoring import MonitoringObservation, ObservationType, ObservationSource, DataQuality
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.monitoring import (
    MonitoringObservationCreate,
    MonitoringObservationUpdate,
    MonitoringObservationResponse,
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


@router.post("", response_model=MonitoringObservationResponse, status_code=status.HTTP_201_CREATED)
async def create_observation(
    observation_data: MonitoringObservationCreate,
    current_user: User = Depends(require_project_developer),
    db: AsyncSession = Depends(get_db),
):
    # Verify project access
    project_query = select(Project).where(Project.id == observation_data.project_id)
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
                detail="Not authorized to add observations for this project",
            )

    observation = MonitoringObservation(
        project_id=observation_data.project_id,
        observer_id=current_user.id,
        **observation_data.model_dump(exclude={"project_id"}),
    )
    db.add(observation)
    await db.commit()
    await db.refresh(observation)

    create_audit_log(
        db, current_user.id, observation.project_id, "create", "monitoring_observation", observation.id,
        new_values=observation_data.model_dump()
    )
    await db.commit()

    return observation


@router.get("/project/{project_id}", response_model=List[MonitoringObservationResponse])
async def list_project_observations(
    project_id: UUID,
    observation_type: Optional[ObservationType] = None,
    source: Optional[ObservationSource] = None,
    quality: Optional[DataQuality] = None,
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
                detail="Not authorized to view observations for this project",
            )

    query = select(MonitoringObservation).where(MonitoringObservation.project_id == project_id)

    if observation_type:
        query = query.where(MonitoringObservation.observation_type == observation_type)
    if source:
        query = query.where(MonitoringObservation.source == source)
    if quality:
        query = query.where(MonitoringObservation.quality == quality)

    query = query.order_by(MonitoringObservation.observed_at.desc())
    result = await db.execute(query)
    observations = result.scalars().all()

    return [MonitoringObservationResponse.model_validate(o) for o in observations]


@router.get("/{observation_id}", response_model=MonitoringObservationResponse)
async def get_observation(
    observation_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(MonitoringObservation).where(MonitoringObservation.id == observation_id)
    result = await db.execute(query)
    observation = result.scalar_one_or_none()

    if not observation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Observation not found",
        )

    # Verify project access
    project_query = select(Project).where(Project.id == observation.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this observation",
            )

    return observation


@router.patch("/{observation_id}", response_model=MonitoringObservationResponse)
async def update_observation(
    observation_id: UUID,
    observation_data: MonitoringObservationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(MonitoringObservation).where(MonitoringObservation.id == observation_id)
    result = await db.execute(query)
    observation = result.scalar_one_or_none()

    if not observation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Observation not found",
        )

    # Verify project access
    project_query = select(Project).where(Project.id == observation.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this observation",
            )

    old_values = {
        "observation_type": observation.observation_type.value,
        "value": float(observation.value),
        "unit": observation.unit,
        "source": observation.source.value,
        "quality": observation.quality.value,
    }

    update_data = observation_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(observation, field, value)

    observation.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(observation)

    new_values = {
        "observation_type": observation.observation_type.value,
        "value": float(observation.value),
        "unit": observation.unit,
        "source": observation.source.value,
        "quality": observation.quality.value,
    }

    create_audit_log(
        db, current_user.id, observation.project_id, "update", "monitoring_observation", observation.id,
        old_values=old_values, new_values=new_values
    )
    await db.commit()

    return observation