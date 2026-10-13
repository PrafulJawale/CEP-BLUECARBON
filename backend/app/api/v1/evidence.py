import os
import uuid
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps.auth import (
    get_current_active_user,
    require_gov_officer,
    require_project_developer,
)
from app.core.config import settings
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.evidence import Evidence, EvidenceStatus, EvidenceType
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.evidence import (
    EvidenceCreate,
    EvidenceReview,
    EvidenceResponse,
    EvidenceUploadResponse,
)

router = APIRouter()

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = set(settings.ALLOWED_EXTENSIONS)
ALLOWED_MIME_TYPES = set(settings.ALLOWED_MIME_TYPES)
MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE


def validate_file(file: UploadFile) -> None:
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"MIME type not allowed. Allowed: {', '.join(ALLOWED_MIME_TYPES)}",
        )


import json

def create_audit_log(
    db: AsyncSession,
    user_id: uuid.UUID | None,
    project_id: uuid.UUID | None,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID | None,
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


@router.post("/upload", response_model=EvidenceUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    project_id: uuid.UUID,
    evidence_type: EvidenceType,
    description: str | None = None,
    file: UploadFile = File(...),
    current_user: User = Depends(require_project_developer),
    db: AsyncSession = Depends(get_db),
):
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
                detail="Not authorized to upload evidence for this project",
            )

    validate_file(file)

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE} bytes",
        )

    file_ext = Path(file.filename).suffix.lower()
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / safe_filename

    with open(file_path, "wb") as f:
        f.write(content)

    checksum = hashlib.sha256(content).hexdigest()

    evidence = Evidence(
        project_id=project_id,
        uploader_id=current_user.id,
        filename=safe_filename,
        original_filename=file.filename,
        file_path=str(file_path),
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        checksum=checksum,
        evidence_type=evidence_type,
        description=description,
        status=EvidenceStatus.PENDING,
    )
    db.add(evidence)
    await db.commit()
    await db.refresh(evidence)

    create_audit_log(
        db, current_user.id, project_id, "upload", "evidence", evidence.id,
        new_values={"filename": safe_filename, "evidence_type": evidence_type.value}
    )
    await db.commit()

    return EvidenceUploadResponse(
        id=evidence.id,
        filename=evidence.filename,
        status=evidence.status.value,
        message="File uploaded successfully",
    )


@router.get("/project/{project_id}", response_model=List[EvidenceResponse])
async def list_project_evidence(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
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
                detail="Not authorized to view evidence for this project",
            )

    query = select(Evidence).where(Evidence.project_id == project_id).order_by(Evidence.uploaded_at.desc())
    result = await db.execute(query)
    evidence_list = result.scalars().all()

    return [EvidenceResponse.model_validate(e) for e in evidence_list]


@router.get("/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence(
    evidence_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Evidence).where(Evidence.id == evidence_id)
    result = await db.execute(query)
    evidence = result.scalar_one_or_none()

    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found",
        )

    project_query = select(Project).where(Project.id == evidence.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this evidence",
            )

    return evidence


@router.patch("/{evidence_id}", response_model=EvidenceResponse)
async def update_evidence(
    evidence_id: uuid.UUID,
    evidence_data: EvidenceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Evidence).where(Evidence.id == evidence_id)
    result = await db.execute(query)
    evidence = result.scalar_one_or_none()

    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found",
        )

    project_query = select(Project).where(Project.id == evidence.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this evidence",
            )

    if evidence.status != EvidenceStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update evidence that has been reviewed",
        )

    old_values = {
        "description": evidence.description,
        "evidence_type": evidence.evidence_type.value,
    }

    update_data = evidence_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(evidence, field, value)

    evidence.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(evidence)

    new_values = {
        "description": evidence.description,
        "evidence_type": evidence.evidence_type.value,
    }

    create_audit_log(
        db, current_user.id, evidence.project_id, "update", "evidence", evidence.id,
        old_values=old_values, new_values=new_values
    )
    await db.commit()

    return evidence


@router.post("/{evidence_id}/review", response_model=EvidenceResponse)
async def review_evidence(
    evidence_id: uuid.UUID,
    review_data: EvidenceReview,
    current_user: User = Depends(require_gov_officer),
    db: AsyncSession = Depends(get_db),
):
    query = select(Evidence).where(Evidence.id == evidence_id)
    result = await db.execute(query)
    evidence = result.scalar_one_or_none()

    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found",
        )

    if evidence.status not in [EvidenceStatus.PENDING, EvidenceStatus.UNDER_REVIEW]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Evidence is not in a reviewable state",
        )

    old_status = evidence.status
    evidence.status = EvidenceStatus(review_data.status)
    evidence.reviewer_id = current_user.id
    evidence.reviewer_comments = review_data.comments
    evidence.reviewed_at = datetime.now(timezone.utc)
    evidence.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(evidence)

    create_audit_log(
        db, current_user.id, evidence.project_id, "review", "evidence", evidence.id,
        old_values={"status": old_status.value},
        new_values={"status": evidence.status.value, "comments": review_data.comments}
    )
    await db.commit()

    return evidence


@router.get("/{evidence_id}/download")
async def download_evidence(
    evidence_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Evidence).where(Evidence.id == evidence_id)
    result = await db.execute(query)
    evidence = result.scalar_one_or_none()

    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found",
        )

    project_query = select(Project).where(Project.id == evidence.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to download this evidence",
            )

    file_path = Path(evidence.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk",
        )

    return FileResponse(
        path=file_path,
        filename=evidence.original_filename,
        media_type=evidence.mime_type,
    )