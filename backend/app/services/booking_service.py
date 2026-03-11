import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import select, and_, or_, func, extract
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.booking import Booking, BookingStatus
from app.models.resource import Resource
from app.models.user import User, UserRole
from app.schemas.booking import BookingCreate, BookingUpdate


async def check_conflict(
    db: AsyncSession,
    resource_id: int,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: Optional[int] = None,
) -> bool:
    """Check if there's a scheduling conflict for the resource in the given time range."""
    query = select(Booking).where(
        and_(
            Booking.resource_id == resource_id,
            Booking.status == "confirmed",
            Booking.start_time < end_time,
            Booking.end_time > start_time,
        )
    )
    if exclude_booking_id:
        query = query.where(Booking.id != exclude_booking_id)

    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


async def create_booking(
    db: AsyncSession,
    booking_in: BookingCreate,
    user: User,
) -> List[Booking]:
    """Create a booking (or recurring bookings). Enforces business rules."""
    # Verify resource exists and is active
    result = await db.execute(select(Resource).where(Resource.id == booking_in.resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if not resource.is_active:
        raise HTTPException(status_code=400, detail="Resource is currently inactive")

    # Business rule: students can only book up to 2 weeks in advance
    if user.role == "student":
        max_advance = datetime.now(timezone.utc) + timedelta(weeks=2)
        if booking_in.start_time > max_advance:
            raise HTTPException(
                status_code=400,
                detail="Students can only book up to 2 weeks in advance",
            )

    # Business rule: no bookings in the past
    if booking_in.start_time < datetime.now(timezone.utc) - timedelta(minutes=5):
        raise HTTPException(status_code=400, detail="Cannot create bookings in the past")

    # Build list of booking instances (handle recurring)
    bookings_to_create = []
    recurring_group_id = str(uuid.uuid4()) if booking_in.is_recurring else None
    weeks = booking_in.recurrence_weeks if booking_in.is_recurring else 1

    for week_offset in range(weeks):
        start = booking_in.start_time + timedelta(weeks=week_offset)
        end = booking_in.end_time + timedelta(weeks=week_offset)

        # Check conflict for each instance
        has_conflict = await check_conflict(db, booking_in.resource_id, start, end)
        if has_conflict:
            if booking_in.is_recurring:
                raise HTTPException(
                    status_code=409,
                    detail=f"Scheduling conflict for week {week_offset + 1} ({start.isoformat()})",
                )
            else:
                raise HTTPException(
                    status_code=409,
                    detail="This time slot is already booked",
                )

        booking = Booking(
            resource_id=booking_in.resource_id,
            user_id=user.id,
            title=booking_in.title,
            description=booking_in.description,
            start_time=start,
            end_time=end,
            status="confirmed",
            recurring_group_id=recurring_group_id,
        )
        bookings_to_create.append(booking)

    db.add_all(bookings_to_create)
    await db.flush()

    # Re-fetch with relationships loaded
    ids = [b.id for b in bookings_to_create]
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.resource), selectinload(Booking.user))
        .where(Booking.id.in_(ids))
    )
    return list(result.scalars().all())


async def update_booking(
    db: AsyncSession,
    booking_id: int,
    booking_in: BookingUpdate,
    user: User,
) -> Booking:
    """Update a booking. Only the owner or admin can modify."""
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.resource), selectinload(Booking.user))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Authorization: owner or admin
    if booking.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to modify this booking")

    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot modify a cancelled booking")

    # If time is being changed, check for conflicts
    new_start = booking_in.start_time or booking.start_time
    new_end = booking_in.end_time or booking.end_time
    if booking_in.start_time or booking_in.end_time:
        if new_end <= new_start:
            raise HTTPException(status_code=400, detail="end_time must be after start_time")
        has_conflict = await check_conflict(db, booking.resource_id, new_start, new_end, booking.id)
        if has_conflict:
            raise HTTPException(status_code=409, detail="Schedule conflict with updated times")

    update_data = booking_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(booking, field, value)

    await db.flush()
    return booking


async def cancel_booking(db: AsyncSession, booking_id: int, user: User) -> Booking:
    """Cancel a booking."""
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.resource), selectinload(Booking.user))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    # Business rule: can't cancel less than 1 hour before start
    if booking.start_time - datetime.now(timezone.utc) < timedelta(hours=1):
        if user.role != "admin":
            raise HTTPException(
                status_code=400,
                detail="Cannot cancel less than 1 hour before start time",
            )

    booking.status = "cancelled"
    await db.flush()
    return booking


async def get_user_bookings(
    db: AsyncSession,
    user: User,
    status_filter: Optional[BookingStatus] = None,
    upcoming_only: bool = False,
) -> List[Booking]:
    """Get bookings for a user, or all bookings if admin."""
    query = (
        select(Booking)
        .options(selectinload(Booking.resource), selectinload(Booking.user))
    )

    if user.role != "admin":
        query = query.where(Booking.user_id == user.id)

    if status_filter:
        query = query.where(Booking.status == status_filter)

    if upcoming_only:
        query = query.where(Booking.start_time >= datetime.now(timezone.utc))

    query = query.order_by(Booking.start_time.asc())
    result = await db.execute(query)
    return list(result.scalars().all())
