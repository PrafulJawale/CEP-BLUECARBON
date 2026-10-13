#!/usr/bin/env python3
"""
Idempotent demo data seeding script for Blue Carbon Registry & MRV System.

Creates fictional demo data for all 6 user roles, sample projects, evidence,
calculations, credits, and marketplace listings.

Usage:
    python -m app.scripts.seed_demo

Environment:
    Requires DATABASE_URL in .env or environment (PostgreSQL or SQLite).
    Never runs automatically in production - must be invoked explicitly.
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Ensure app modules can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import Base
from app.models import (
    AuditLog,
    CarbonCalculation,
    CalculationStatus,
    Credit,
    CreditOwnership,
    CreditStatus,
    EcosystemType,
    Evidence,
    EvidenceStatus,
    EvidenceType,
    ListingStatus,
    MarketplaceListing,
    MonitoringObservation,
    ObservationSource,
    ObservationType,
    Notification,
    Project,
    ProjectStatus,
    Transaction,
    TransactionStatus,
    User,
    UserRole,
    UserStatus,
    VerificationReview,
    VerificationDecision,
)


DEMO_USERS = [
    {
        "email": "admin@demo.bluecarbon.local",
        "full_name": "Demo Administrator",
        "role": UserRole.ADMIN,
        "organization": "Blue Carbon Registry",
        "password": "demo123",
    },
    {
        "email": "gov.officer@demo.bluecarbon.local",
        "full_name": "Demo Government Officer",
        "role": UserRole.GOVERNMENT_OFFICER,
        "organization": "Ministry of Environment",
        "password": "demo123",
    },
    {
        "email": "developer@demo.bluecarbon.local",
        "full_name": "Demo Project Developer",
        "role": UserRole.PROJECT_DEVELOPER,
        "organization": "Mangrove Restoration Co.",
        "password": "demo123",
    },
    {
        "email": "buyer@demo.bluecarbon.local",
        "full_name": "Demo Carbon Buyer",
        "role": UserRole.BUYER,
        "organization": "Carbon Offset Corp",
        "password": "demo123",
    },
    {
        "email": "researcher@demo.bluecarbon.local",
        "full_name": "Demo Researcher",
        "role": UserRole.RESEARCHER,
        "organization": "Ocean Science Institute",
        "password": "demo123",
    },
    {
        "email": "community@demo.bluecarbon.local",
        "full_name": "Demo Community Representative",
        "role": UserRole.COMMUNITY_REPRESENTATIVE,
        "organization": "Sundarbans Community Group",
        "password": "demo123",
    },
]

DEMO_PROJECTS = [
    {
        "name": "Sundarbans Mangrove Restoration Phase 1",
        "description": "Restoration of 500 hectares of degraded mangrove forest in the Sundarbans delta region. Community-led planting with native species.",
        "ecosystem_type": EcosystemType.MANGROVE,
        "country": "India",
        "state_province": "West Bengal",
        "district": "South 24 Parganas",
        "latitude": Decimal("21.9497"),
        "longitude": Decimal("88.9512"),
        "area_hectares": Decimal("500.0"),
        "status": ProjectStatus.APPROVED,
    },
    {
        "name": "Gulf of Kutch Seagrass Conservation",
        "description": "Protection and monitoring of seagrass meadows in the Gulf of Kutch Marine National Park. Includes community surveillance and scientific monitoring.",
        "ecosystem_type": EcosystemType.SEAGRASS,
        "country": "India",
        "state_province": "Gujarat",
        "district": "Devbhoomi Dwarka",
        "latitude": Decimal("22.4667"),
        "longitude": Decimal("69.0667"),
        "area_hectares": Decimal("1200.0"),
        "status": ProjectStatus.SUBMITTED,
    },
    {
        "name": "Chilika Lake Salt Marsh Revival",
        "description": "Revival of salt marsh habitats in Chilika Lake through hydrological restoration and invasive species removal.",
        "ecosystem_type": EcosystemType.SALT_MARSH,
        "country": "India",
        "state_province": "Odisha",
        "district": "Puri",
        "latitude": Decimal("19.7167"),
        "longitude": Decimal("85.3833"),
        "area_hectares": Decimal("350.0"),
        "status": ProjectStatus.DRAFT,
    },
    {
        "name": "Andaman Coastal Wetland Protection",
        "description": "Integrated coastal wetland protection across multiple islands in the Andaman archipelago. Focus on biodiversity corridors.",
        "ecosystem_type": EcosystemType.COASTAL_WETLAND,
        "country": "India",
        "state_province": "Andaman and Nicobar Islands",
        "district": "South Andaman",
        "latitude": Decimal("11.6667"),
        "longitude": Decimal("92.7500"),
        "area_hectares": Decimal("800.0"),
        "status": ProjectStatus.UNDER_REVIEW,
    },
]


async def get_or_create_user(db: AsyncSession, user_data: dict) -> User:
    """Get existing user by email or create new one."""
    result = await db.execute(select(User).where(User.email == user_data["email"]))
    user = result.scalar_one_or_none()

    if user:
        print(f"  User exists: {user.email} ({user.role.value})")
        return user

    user = User(
        id=uuid4(),
        email=user_data["email"],
        full_name=user_data["full_name"],
        hashed_password=get_password_hash(user_data["password"]),
        role=user_data["role"],
        status=UserStatus.ACTIVE,
        organization=user_data["organization"],
    )
    db.add(user)
    await db.flush()
    print(f"  Created user: {user.email} ({user.role.value})")
    return user


async def get_or_create_project(db: AsyncSession, project_data: dict, owner: User) -> Project:
    """Get existing project by name + owner or create new one."""
    result = await db.execute(
        select(Project).where(Project.name == project_data["name"], Project.owner_id == owner.id)
    )
    project = result.scalar_one_or_none()

    if project:
        print(f"  Project exists: {project.name}")
        return project

    project = Project(
        id=uuid4(),
        owner_id=owner.id,
        name=project_data["name"],
        description=project_data["description"],
        ecosystem_type=project_data["ecosystem_type"],
        country=project_data["country"],
        state_province=project_data.get("state_province"),
        district=project_data.get("district"),
        latitude=project_data["latitude"],
        longitude=project_data["longitude"],
        area_hectares=project_data["area_hectares"],
        status=project_data["status"],
        submitted_at=datetime.now(timezone.utc) if project_data["status"] != ProjectStatus.DRAFT else None,
        reviewed_at=datetime.now(timezone.utc) if project_data["status"] in [ProjectStatus.APPROVED, ProjectStatus.REJECTED] else None,
        approved_at=datetime.now(timezone.utc) if project_data["status"] == ProjectStatus.APPROVED else None,
    )
    db.add(project)
    await db.flush()
    print(f"  Created project: {project.name} ({project.status.value})")
    return project


async def get_or_create_evidence(db: AsyncSession, project: Project, uploader: User, evidence_type: EvidenceType) -> Evidence:
    """Create demo evidence if not exists."""
    result = await db.execute(
        select(Evidence).where(
            Evidence.project_id == project.id,
            Evidence.uploader_id == uploader.id,
            Evidence.evidence_type == evidence_type,
        )
    )
    evidence = result.scalar_one_or_none()

    if evidence:
        return evidence

    evidence = Evidence(
        id=uuid4(),
        project_id=project.id,
        uploader_id=uploader.id,
        filename=f"{uuid4()}.jpg",
        original_filename=f"demo_{evidence_type.value}.jpg",
        file_path=f"uploads/demo/{uuid4()}.jpg",
        file_size=102400,
        mime_type="image/jpeg",
        checksum="a" * 64,
        evidence_type=evidence_type,
        description=f"Demo {evidence_type.value} for {project.name}",
        status=EvidenceStatus.APPROVED if project.status == ProjectStatus.APPROVED else EvidenceStatus.PENDING,
        uploaded_at=datetime.now(timezone.utc),
    )
    db.add(evidence)
    await db.flush()
    return evidence


async def get_or_create_calculation(db: AsyncSession, project: Project, calculator: User) -> CarbonCalculation:
    """Create demo calculation if not exists."""
    result = await db.execute(
        select(CarbonCalculation).where(
            CarbonCalculation.project_id == project.id,
            CarbonCalculation.calculator_id == calculator.id,
        )
    )
    calculation = result.scalar_one_or_none()

    if calculation:
        return calculation

    calculation = CarbonCalculation(
        id=uuid4(),
        project_id=project.id,
        calculator_id=calculator.id,
        methodology_name="VM0033 - Tidal Wetland and Seagrass Restoration",
        methodology_version="1.0",
        methodology_reference="https://verra.org/methodology/vm0033/",
        input_parameters={
            "area_hectares": float(project.area_hectares),
            "ecosystem_type": project.ecosystem_type.value,
            "planting_density": 2500,
            "survival_rate": 0.85,
            "growth_model": "allometric",
        },
        biomass_tons=Decimal(str(float(project.area_hectares) * 150)),
        carbon_stock_tons=Decimal(str(float(project.area_hectares) * 75)),
        co2_equivalent_tons=Decimal(str(float(project.area_hectares) * 275)),
        annual_sequestration_tons=Decimal(str(float(project.area_hectares) * 8.5)),
        potential_credits=Decimal(str(float(project.area_hectares) * 8.5)),
        unit="tCO2e",
        assumptions="Standard allometric equations for mangrove/seagrass; 85% survival rate; 20-year crediting period",
        limitations="Does not account for methane emissions in freshwater-influenced areas",
        data_provenance={"source": "demo", "generated_at": datetime.now(timezone.utc).isoformat()},
        status=CalculationStatus.APPROVED if project.status == ProjectStatus.APPROVED else CalculationStatus.DRAFT,
        calculated_at=datetime.now(timezone.utc),
    )
    db.add(calculation)
    await db.flush()
    return calculation


async def get_or_create_credit(db: AsyncSession, project: Project, calculation: CarbonCalculation, issuer: User) -> Credit:
    """Create demo credit if not exists."""
    batch_id = f"BCR-{project.id.hex[:8].upper()}-2024"
    result = await db.execute(select(Credit).where(Credit.batch_id == batch_id))
    credit = result.scalar_one_or_none()

    if credit:
        return credit

    quantity = float(calculation.potential_credits or 0)
    credit = Credit(
        id=uuid4(),
        project_id=project.id,
        calculation_id=calculation.id,
        batch_id=batch_id,
        quantity=Decimal(str(quantity)),
        unit="tCO2e",
        vintage_year=2024,
        status=CreditStatus.ISSUED if project.status == ProjectStatus.APPROVED else CreditStatus.PROPOSED,
        issued_by=issuer.id if project.status == ProjectStatus.APPROVED else None,
        issued_at=datetime.now(timezone.utc) if project.status == ProjectStatus.APPROVED else None,
        methodology_name=calculation.methodology_name,
        methodology_version=calculation.methodology_version,
        serial_number_start=1,
        serial_number_end=int(quantity),
    )
    db.add(credit)
    await db.flush()

    # Create initial ownership for project owner
    if project.status == ProjectStatus.APPROVED:
        ownership = CreditOwnership(
            id=uuid4(),
            credit_id=credit.id,
            owner_id=project.owner_id,
            quantity=credit.quantity,
            is_current=True,
            transaction_id=None,
        )
        db.add(ownership)

    return credit


async def get_or_create_listing(db: AsyncSession, credit: Credit, seller: User) -> MarketplaceListing:
    """Create demo marketplace listing if not exists."""
    result = await db.execute(
        select(MarketplaceListing).where(
            MarketplaceListing.credit_id == credit.id,
            MarketplaceListing.seller_id == seller.id,
            MarketplaceListing.status == ListingStatus.ACTIVE,
        )
    )
    listing = result.scalar_one_or_none()

    if listing:
        return listing

    if credit.status != CreditStatus.ISSUED:
        return None

    listing = MarketplaceListing(
        id=uuid4(),
        credit_id=credit.id,
        seller_id=seller.id,
        quantity=credit.quantity,
        price_per_unit=Decimal("25.00"),
        currency="USD",
        status=ListingStatus.ACTIVE,
        description=f"Demo listing for {credit.batch_id} - high-quality blue carbon credits",
        expires_at=None,
    )
    db.add(listing)
    await db.flush()
    return listing


async def seed_demo_data():
    """Main seeding function - idempotent."""
    print("=" * 60)
    print("Blue Carbon Registry - Demo Data Seeding")
    print("=" * 60)
    print(f"Database: {settings.DATABASE_URL}")
    print(f"Environment: {settings.ENVIRONMENT}")
    print()

    if settings.ENVIRONMENT == "production":
        print("ERROR: Refusing to seed demo data in production environment!")
        print("Set ENVIRONMENT=development to run seeding.")
        sys.exit(1)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        try:
            print("Seeding demo users...")
            users = {}
            for user_data in DEMO_USERS:
                user = await get_or_create_user(db, user_data)
                users[user_data["role"]] = user

            print("\nSeeding demo projects...")
            projects = {}
            developer = users[UserRole.PROJECT_DEVELOPER]
            for i, project_data in enumerate(DEMO_PROJECTS):
                project = await get_or_create_project(db, project_data, developer)
                projects[project_data["name"]] = project

            print("\nSeeding demo evidence...")
            for project in projects.values():
                if project.status in [ProjectStatus.APPROVED, ProjectStatus.SUBMITTED, ProjectStatus.UNDER_REVIEW]:
                    for ev_type in [EvidenceType.DRONE_IMAGE, EvidenceType.SATELLITE_IMAGE, EvidenceType.FIELD_PHOTO]:
                        await get_or_create_evidence(db, project, developer, ev_type)

            print("\nSeeding demo calculations...")
            calculations = {}
            for project in projects.values():
                if project.status != ProjectStatus.DRAFT:
                    calc = await get_or_create_calculation(db, project, developer)
                    calculations[project.id] = calc

            print("\nSeeding demo credits...")
            credits = {}
            admin = users[UserRole.ADMIN]
            for project_id, calculation in calculations.items():
                project = projects.get(next(k for k, v in projects.items() if v.id == project_id))
                if project:
                    credit = await get_or_create_credit(db, project, calculation, admin)
                    credits[project_id] = credit

            print("\nSeeding demo marketplace listings...")
            for project_id, credit in credits.items():
                if credit.status == CreditStatus.ISSUED:
                    await get_or_create_listing(db, credit, developer)

            await db.commit()
            print("\n" + "=" * 60)
            print("Demo data seeding completed successfully!")
            print("=" * 60)
            print("\nDemo credentials (all password: demo123):")
            for u in DEMO_USERS:
                print(f"  {u['email']} ({u['role'].value})")

        except Exception as e:
            await db.rollback()
            print(f"\nERROR: {e}")
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_demo_data())