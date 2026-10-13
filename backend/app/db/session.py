from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Use psycopg async driver (psycopg[binary,pool])
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql+asyncpg://"):
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg://")

engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,
    poolclass=NullPool if settings.ENVIRONMENT == "test" else None,
    pool_size=settings.DB_POOL_SIZE if settings.ENVIRONMENT != "test" else None,
    max_overflow=settings.DB_MAX_OVERFLOW if settings.ENVIRONMENT != "test" else None,
    pool_timeout=settings.DB_POOL_TIMEOUT if settings.ENVIRONMENT != "test" else None,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


class Base(DeclarativeBase):
    pass