from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select, func, extract, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking, BookingStatus
from app.models.resource import Resource
from app.schemas.analytics import (
    AnalyticsResponse, UtilizationStat,
    PeakHoursResponse, PeakHourStat,
)


async def get_utilization(
    db: AsyncSession,
    days: int = 30,
    resource_id: Optional[int] = None,
) -> AnalyticsResponse:
    """Calculate resource utilization over the specified period."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    total_available_hours = days * 12  # assume 12 operating hours/day

    query = (
        select(
            Resource.id,
            Resource.name,
            func.count(Booking.id).label("total_bookings"),
            func.coalesce(
                func.sum(
                    extract("epoch", Booking.end_time - Booking.start_time) / 3600
                ),
                0,
            ).label("total_hours"),
        )
        .outerjoin(
            Booking,
            and_(
                Booking.resource_id == Resource.id,
                Booking.status == "confirmed",
                Booking.start_time >= cutoff,
            ),
        )
        .where(Resource.is_active == True)
        .group_by(Resource.id, Resource.name)
    )

    if resource_id:
        query = query.where(Resource.id == resource_id)

    result = await db.execute(query)
    rows = result.all()

    utilization_stats = []
    total_bookings = 0
    total_util = 0.0

    for row in rows:
        hours = float(row.total_hours)
        pct = min((hours / total_available_hours) * 100, 100.0) if total_available_hours > 0 else 0
        stat = UtilizationStat(
            resource_id=row.id,
            resource_name=row.name,
            total_bookings=row.total_bookings,
            total_hours=round(hours, 1),
            utilization_pct=round(pct, 1),
        )
        utilization_stats.append(stat)
        total_bookings += row.total_bookings
        total_util += pct

    avg_util = round(total_util / len(rows), 1) if rows else 0.0

    return AnalyticsResponse(
        utilization=utilization_stats,
        total_resources=len(rows),
        total_bookings=total_bookings,
        avg_utilization=avg_util,
    )


async def get_peak_hours(
    db: AsyncSession,
    days: int = 30,
) -> PeakHoursResponse:
    """Analyze peak booking hours over the specified period."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    query = (
        select(
            extract("hour", Booking.start_time).label("hour"),
            func.count(Booking.id).label("booking_count"),
        )
        .where(
            and_(
                Booking.status == "confirmed",
                Booking.start_time >= cutoff,
            )
        )
        .group_by(extract("hour", Booking.start_time))
        .order_by(extract("hour", Booking.start_time))
    )

    result = await db.execute(query)
    rows = result.all()

    # Fill in all 24 hours
    hour_map = {int(row.hour): row.booking_count for row in rows}
    peak_hours = [
        PeakHourStat(hour=h, booking_count=hour_map.get(h, 0))
        for h in range(24)
    ]

    busiest = max(peak_hours, key=lambda x: x.booking_count) if peak_hours else PeakHourStat(hour=0, booking_count=0)

    return PeakHoursResponse(
        peak_hours=peak_hours,
        busiest_hour=busiest.hour,
        busiest_count=busiest.booking_count,
    )
