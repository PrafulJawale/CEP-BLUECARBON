import asyncio
from collections.abc import AsyncGenerator
from typing import Generator
from uuid import uuid4

import pytest
from faker import Faker
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

# Import all models FIRST to register them with Base.metadata
from app.models import *  # noqa: F401,F403
from app.db.session import Base
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.db.session import get_db
from app.main import app

# Test database URL (use file-based SQLite for tests to share across connections)
import tempfile
import os

TEST_DB_FILE = tempfile.NamedTemporaryFile(suffix='.db', delete=False).name
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=NullPool,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    # Clean up temp database file
    if os.path.exists(TEST_DB_FILE):
        os.unlink(TEST_DB_FILE)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession):
    from app.models.user import User, UserRole, UserStatus
    import uuid
    user = User(
        id=uuid.uuid4(),
        email=f"test_{uuid.uuid4().hex[:8]}@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("testpassword123"),
        role=UserRole.PROJECT_DEVELOPER,
        status=UserStatus.ACTIVE,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def admin_user(db_session: AsyncSession):
    from app.models.user import User, UserRole, UserStatus
    import uuid
    user = User(
        id=uuid.uuid4(),
        email=f"admin_{uuid.uuid4().hex[:8]}@example.com",
        full_name="Admin User",
        hashed_password=get_password_hash("adminpassword123"),
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def gov_user(db_session: AsyncSession):
    from app.models.user import User, UserRole, UserStatus
    import uuid
    user = User(
        id=uuid.uuid4(),
        email=f"gov_{uuid.uuid4().hex[:8]}@example.com",
        full_name="Government Officer",
        hashed_password=get_password_hash("govpassword123"),
        role=UserRole.GOVERNMENT_OFFICER,
        status=UserStatus.ACTIVE,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def buyer_user(db_session: AsyncSession):
    from app.models.user import User, UserRole, UserStatus
    import uuid
    user = User(
        id=uuid.uuid4(),
        email=f"buyer_{uuid.uuid4().hex[:8]}@example.com",
        full_name="Buyer User",
        hashed_password=get_password_hash("buyerpassword123"),
        role=UserRole.BUYER,
        status=UserStatus.ACTIVE,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user) -> dict:
    token = create_access_token(subject=str(test_user.id), extra_claims={"role": test_user.role.value})
    return {"Cookie": f"access_token={token}"}


@pytest.fixture
def admin_auth_headers(admin_user) -> dict:
    token = create_access_token(subject=str(admin_user.id), extra_claims={"role": admin_user.role.value})
    return {"Cookie": f"access_token={token}"}


@pytest.fixture
def gov_auth_headers(gov_user) -> dict:
    token = create_access_token(subject=str(gov_user.id), extra_claims={"role": gov_user.role.value})
    return {"Cookie": f"access_token={token}"}


@pytest.fixture
def buyer_auth_headers(buyer_user) -> dict:
    token = create_access_token(subject=str(buyer_user.id), extra_claims={"role": buyer_user.role.value})
    return {"Cookie": f"access_token={token}"}


@pytest.fixture
def faker() -> Faker:
    return Faker()