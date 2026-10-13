from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import get_db, require_admin
from app.scripts.seed_demo import seed_demo_data

router = APIRouter(tags=["Admin"])


@router.post("/re-seed", status_code=status.HTTP_200_OK)
async def reseed_database(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Re-seed the database with demo data (idempotent). Admin only."""
    try:
        await seed_demo_data()
        return {"message": "Database re-seeded successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to re-seed database: {str(e)}"
        )


@router.post("/reset-db", status_code=status.HTTP_200_OK)
async def reset_database(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Reset the database by dropping and recreating all tables, then re-seeding. Admin only."""
    try:
        from app.db.session import Base
        from app.core.config import settings
        from sqlalchemy.ext.asyncio import create_async_engine
        
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()
        
        await seed_demo_data()
        return {"message": "Database reset and re-seeded successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset database: {str(e)}"
        )