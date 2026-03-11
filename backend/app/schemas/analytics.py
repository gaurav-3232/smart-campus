from pydantic import BaseModel
from typing import List, Optional


class UtilizationStat(BaseModel):
    resource_id: int
    resource_name: str
    total_bookings: int
    total_hours: float
    utilization_pct: float


class PeakHourStat(BaseModel):
    hour: int
    booking_count: int


class AnalyticsResponse(BaseModel):
    utilization: List[UtilizationStat]
    total_resources: int
    total_bookings: int
    avg_utilization: float


class PeakHoursResponse(BaseModel):
    peak_hours: List[PeakHourStat]
    busiest_hour: int
    busiest_count: int
