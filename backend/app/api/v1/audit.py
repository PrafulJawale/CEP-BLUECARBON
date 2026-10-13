from datetime import datetime
from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import require_admin
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogFilter, AuditLogResponse

router = APIRouter()


@router.get("", response_model=List[AuditLogResponse])
async def list_audit_logs(
    filters: AuditLogFilter = Depends(),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(AuditLog)

    if filters.user_id:
        query = query.where(AuditLog.user_id == filters.user_id)
    if filters.project_id:
        query = query.where(AuditLog.project_id == filters.project_id)
    if filters.action:
        query = query.where(AuditLog.action.ilike(f"%{filters.action}%"))
    if filters.entity_type:
        query = query.where(AuditLog.entity_type == filters.entity_type)
    if filters.entity_id:
        query = query.where(AuditLog.entity_id == filters.entity_id)
    if filters.start_date:
        query = query.where(AuditLog.created_at >= filters.start_date)
    if filters.end_date:
        query = query.where(AuditLog.created_at <= filters.end_date)

    query = query.order_by(AuditLog.created_at.desc())
    query = query.offset((filters.page - 1) * filters.page_size).limit(filters.page_size)

    result = await db.execute(query)
    logs = result.scalars().all()

    return [AuditLogResponse.model_validate(log) for log in logs]


@router.get("/stats")
async def get_audit_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    # Total logs
    total_query = select(func.count(AuditLog.id))
    total_result = await db.execute(total_query)
    total = total_result.scalar_one()

    # By action
    action_query = select(AuditLog.action, func.count(AuditLog.id)).group_by(AuditLog.action)
    action_result = await db.execute(action_query)
    by_action = {row[0]: row[1] for row in action_result.all()}

    # By entity type
    entity_query = select(AuditLog.entity_type, func.count(AuditLog.id)).group_by(AuditLog.entity_type)
    entity_result = await db.execute(entity_query)
    by_entity = {row[0]: row[1] for row in entity_result.all()}

    # Recent activity (last 24 hours)
    from datetime import timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=1)
    recent_query = select(func.count(AuditLog.id)).where(AuditLog.created_at >= cutoff)
    recent_result = await db.execute(recent_query)
    recent = recent_result.scalar_one()

    return {
        "total_logs": total,
        "by_action": by_action,
        "by_entity_type": by_entity,
        "last_24_hours": recent,
    }