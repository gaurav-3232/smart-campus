from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsResponse, PeakHoursResponse
from app.core.security import require_role
from app.services.analytics_service import get_utilization, get_peak_hours

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/utilization", response_model=AnalyticsResponse)
async def utilization_stats(
    days: int = Query(30, ge=1, le=365),
    resource_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin", "staff")),
):
    return await get_utilization(db, days, resource_id)


@router.get("/peak-hours", response_model=PeakHoursResponse)
async def peak_hours_stats(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin", "staff")),
):
    return await get_peak_hours(db, days)
