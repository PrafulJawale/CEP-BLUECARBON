from datetime import datetime, timezone
from uuid import UUID
from typing import List

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
from app.models.verification import VerificationReview, VerificationDecision
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole
from app.schemas.verification import (
    VerificationReviewCreate,
    VerificationReviewDecision,
    VerificationReviewResponse,
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


@router.post("", response_model=VerificationReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_verification_review(
    review_data: VerificationReviewCreate,
    current_user: User = Depends(require_gov_officer),
    db: AsyncSession = Depends(get_db),
):
    # Verify project exists and is in reviewable state
    project_query = select(Project).where(Project.id == review_data.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

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

    # Check if review already exists for this reviewer
    existing_query = select(VerificationReview).where(
        VerificationReview.project_id == review_data.project_id,
        VerificationReview.reviewer_id == current_user.id,
    )
    existing_result = await db.execute(existing_query)
    existing = existing_result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already created a review for this project",
        )

    # Update project status to under_review if submitted
    if project.status == ProjectStatus.SUBMITTED:
        project.status = ProjectStatus.UNDER_REVIEW
        project.reviewed_at = datetime.now(timezone.utc)

    review = VerificationReview(
        project_id=review_data.project_id,
        reviewer_id=current_user.id,
        decision=VerificationDecision.PENDING,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    create_audit_log(
        db, current_user.id, review.project_id, "create", "verification_review", review.id,
        new_values={"project_id": str(review.project_id)}
    )
    await db.commit()

    return review


@router.get("/project/{project_id}", response_model=List[VerificationReviewResponse])
async def list_project_reviews(
    project_id: UUID,
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
                detail="Not authorized to view reviews for this project",
            )

    query = select(VerificationReview).where(VerificationReview.project_id == project_id).order_by(VerificationReview.created_at.desc())
    result = await db.execute(query)
    reviews = result.scalars().all()

    return [VerificationReviewResponse.model_validate(r) for r in reviews]


@router.get("/{review_id}", response_model=VerificationReviewResponse)
async def get_review(
    review_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(VerificationReview).where(VerificationReview.id == review_id)
    result = await db.execute(query)
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    # Verify project access
    project_query = select(Project).where(Project.id == review.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if current_user.role not in [UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this review",
            )

    return review


@router.post("/{review_id}/decision", response_model=VerificationReviewResponse)
async def submit_review_decision(
    review_id: UUID,
    decision_data: VerificationReviewDecision,
    current_user: User = Depends(require_gov_officer),
    db: AsyncSession = Depends(get_db),
):
    query = select(VerificationReview).where(VerificationReview.id == review_id)
    result = await db.execute(query)
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    # Verify reviewer
    if review.reviewer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned reviewer can submit a decision",
        )

    if review.decision != VerificationDecision.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision already submitted for this review",
        )

    old_decision = review.decision
    review.decision = VerificationDecision(decision_data.decision)
    review.comments = decision_data.comments
    review.evidence_reviewed = decision_data.evidence_reviewed
    review.calculation_reviewed = decision_data.calculation_reviewed
    review.methodology_compliant = decision_data.methodology_compliant
    review.reviewed_at = datetime.now(timezone.utc)
    review.updated_at = datetime.now(timezone.utc)

    # Update project status based on decision
    project_query = select(Project).where(Project.id == review.project_id)
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if project:
        if decision_data.decision == "approved":
            project.status = ProjectStatus.APPROVED
            project.approved_at = datetime.now(timezone.utc)
        elif decision_data.decision == "rejected":
            project.status = ProjectStatus.REJECTED
            project.rejected_at = datetime.now(timezone.utc)
        elif decision_data.decision == "changes_requested":
            project.status = ProjectStatus.CHANGES_REQUESTED
        project.reviewed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(review)

    create_audit_log(
        db, current_user.id, review.project_id, "decision", "verification_review", review.id,
        old_values={"decision": old_decision.value},
        new_values={
            "decision": review.decision.value,
            "comments": decision_data.comments,
            "evidence_reviewed": decision_data.evidence_reviewed,
            "calculation_reviewed": decision_data.calculation_reviewed,
            "methodology_compliant": decision_data.methodology_compliant,
        }
    )
    await db.commit()

    return review