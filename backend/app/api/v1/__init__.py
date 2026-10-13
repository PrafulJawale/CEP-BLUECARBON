from fastapi import APIRouter

from app.api.v1 import auth, projects, evidence, monitoring, verification, calculation, credit, marketplace, notifications, audit, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(evidence.router, prefix="/evidence", tags=["Evidence"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["Monitoring"])
api_router.include_router(verification.router, prefix="/verification", tags=["Verification"])
api_router.include_router(calculation.router, prefix="/calculations", tags=["Carbon Calculations"])
api_router.include_router(credit.router, prefix="/credits", tags=["Credits"])
api_router.include_router(marketplace.router, prefix="/marketplace", tags=["Marketplace"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Logs"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])