from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime
from app.models.booking import BookingStatus
from app.schemas.resource import ResourceResponse
from app.schemas.user import UserResponse


class BookingCreate(BaseModel):
    resource_id: int
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_recurring: bool = False
    recurrence_weeks: int = Field(default=1, ge=1, le=12)

    @model_validator(mode="after")
    def validate_times(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        duration = (self.end_time - self.start_time).total_seconds()
        if duration > 8 * 3600:
            raise ValueError("Booking cannot exceed 8 hours")
        if duration < 15 * 60:
            raise ValueError("Booking must be at least 15 minutes")
        return self


class BookingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[BookingStatus] = None


class BookingResponse(BaseModel):
    id: int
    resource_id: int
    user_id: int
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    recurring_group_id: Optional[str]
    created_at: datetime
    resource: Optional[ResourceResponse] = None
    user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}
