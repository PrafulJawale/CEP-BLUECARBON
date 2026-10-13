from datetime import datetime, timezone
from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps.auth import (
    get_current_active_user,
    require_admin,
    require_gov_officer,
    require_project_developer,
)
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.project import Project, ProjectStatus, EcosystemType
from app.models.user import User, UserRole
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectStatusUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectFilterParams,
    ProjectPagination,
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


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(require_project_developer),
    db: AsyncSession = Depends(get_db),
):
    project = Project(
        owner_id=current_user.id,
        **project_data.model_dump(),
        status=ProjectStatus.DRAFT,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    # Load owner for response
    await db.refresh(project, ["owner"])
    create_audit_log(
        db, current_user.id, project.id, "create", "project", project.id,
        new_values=project_data.model_dump()
    )
    await db.commit()

    return project


@router.get("", response_model=ProjectPagination)
async def list_projects(
    params: ProjectFilterParams = Depends(),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Project).options(selectinload(Project.owner))
    count_query = select(func.count(Project.id))

    # Apply filters
    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        # Non-admin users only see their own projects
        query = query.where(Project.owner_id == current_user.id)
        count_query = count_query.where(Project.owner_id == current_user.id)

    if params.status:
        query = query.where(Project.status == params.status)
        count_query = count_query.where(Project.status == params.status)

    if params.ecosystem_type:
        query = query.where(Project.ecosystem_type == params.ecosystem_type)
        count_query = count_query.where(Project.ecosystem_type == params.ecosystem_type)

    if params.country:
        query = query.where(Project.country.ilike(f"%{params.country}%"))
        count_query = count_query.where(Project.country.ilike(f"%{params.country}%"))

    if params.state_province:
        query = query.where(Project.state_province.ilike(f"%{params.state_province}%"))
        count_query = count_query.where(Project.state_province.ilike(f"%{params.state_province}%"))

    if params.owner_id:
        if current_user.role in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
            query = query.where(Project.owner_id == params.owner_id)
            count_query = count_query.where(Project.owner_id == params.owner_id)

    if params.search:
        search_term = f"%{params.search}%"
        query = query.where(
            or_(
                Project.name.ilike(search_term),
                Project.description.ilike(search_term),
            )
        )
        count_query = count_query.where(
            or_(
                Project.name.ilike(search_term),
                Project.description.ilike(search_term),
            )
        )

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply pagination
    query = query.order_by(Project.created_at.desc())
    query = query.offset((params.page - 1) * params.page_size).limit(params.page_size)

    result = await db.execute(query)
    projects = result.scalars().all()

    return ProjectPagination(
        items=[ProjectListResponse.model_validate(p) for p in projects],
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=(total + params.page_size - 1) // params.page_size,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Project).options(selectinload(Project.owner)).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Check access
    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this project",
            )

    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    current_user: User = Depends(require_project_developer),
    db: AsyncSession = Depends(get_db),
):
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Check ownership
    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this project",
            )

    # Only allow updates if project is in draft or changes_requested status
    if project.status not in [ProjectStatus.DRAFT, ProjectStatus.CHANGES_REQUESTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update project in current status",
        )

    # Store old values for audit
    old_values = {
        "name": project.name,
        "description": project.description,
        "ecosystem_type": project.ecosystem_type.value,
        "country": project.country,
        "state_province": project.state_province,
        "district": project.district,
        "latitude": float(project.latitude),
        "longitude": float(project.longitude),
        "area_hectares": float(project.area_hectares),
    }

    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project, ["owner"])

    new_values = {
        "name": project.name,
        "description": project.description,
        "ecosystem_type": project.ecosystem_type.value,
        "country": project.country,
        "state_province": project.state_province,
        "district": project.district,
        "latitude": float(project.latitude),
        "longitude": float(project.longitude),
        "area_hectares": float(project.area_hectares),
    }

    create_audit_log(
        db, current_user.id, project.id, "update", "project", project.id,
        old_values=old_values, new_values=new_values
    )
    await db.commit()

    return project


@router.post("/{project_id}/submit", response_model=ProjectResponse)
async def submit_project(
    project_id: UUID,
    current_user: User = Depends(require_project_developer),
    db: AsyncSession = Depends(get_db),
):
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Check ownership
    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to submit this project",
            )

    if project.status not in [ProjectStatus.DRAFT, ProjectStatus.CHANGES_REQUESTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or changes_requested projects can be submitted",
        )

    project.status = ProjectStatus.SUBMITTED
    project.submitted_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project, ["owner"])

    create_audit_log(
        db, current_user.id, project.id, "submit", "project", project.id,
        old_values={"status": ProjectStatus.DRAFT.value},
        new_values={"status": ProjectStatus.SUBMITTED.value}
    )
    await db.commit()

    return project


@router.post("/{project_id}/review", response_model=ProjectResponse)
async def review_project(
    project_id: UUID,
    review_data: ProjectStatusUpdate,
    current_user: User = Depends(require_gov_officer),
    db: AsyncSession = Depends(get_db),
):
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.status not in [ProjectStatus.SUBMITTED, ProjectStatus.UNDER_REVIEW, ProjectStatus.CHANGES_REQUESTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project is not in a reviewable state",
        )

    old_status = project.status

    if review_data.status == "under_review":
        project.status = ProjectStatus.UNDER_REVIEW
    elif review_data.status == "approved":
        project.status = ProjectStatus.APPROVED
        project.approved_at = datetime.now(timezone.utc)
    elif review_data.status == "rejected":
        project.status = ProjectStatus.REJECTED
        project.rejected_at = datetime.now(timezone.utc)
    elif review_data.status == "changes_requested":
        project.status = ProjectStatus.CHANGES_REQUESTED
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status transition",
        )

    project.reviewed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project, ["owner"])

    create_audit_log(
        db, current_user.id, project.id, "review", "project", project.id,
        old_values={"status": old_status.value},
        new_values={"status": project.status.value, "comments": review_data.comments}
    )
    await db.commit()

    return project