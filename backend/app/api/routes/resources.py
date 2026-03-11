from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.resource import Resource, ResourceType
from app.models.booking import Booking, BookingStatus
from app.models.user import User
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse, AvailabilitySlot
from app.core.security import get_current_user, require_role

router = APIRouter(prefix="/api/resources", tags=["Resources"])


@router.get("", response_model=List[ResourceResponse])
async def list_resources(
    resource_type: Optional[ResourceType] = None,
    min_capacity: Optional[int] = None,
    amenity: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = select(Resource).where(Resource.is_active == True)

    if resource_type:
        query = query.where(Resource.resource_type == resource_type)
    if min_capacity:
        query = query.where(Resource.capacity >= min_capacity)
    if search:
        query = query.where(Resource.name.ilike(f"%{search}%"))

    query = query.order_by(Resource.name)
    result = await db.execute(query)
    resources = list(result.scalars().all())

    # Filter by amenity in Python (JSON column)
    if amenity:
        resources = [r for r in resources if amenity.lower() in [a.lower() for a in (r.amenities or [])]]

    return resources


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource


@router.post("", response_model=ResourceResponse, status_code=201)
async def create_resource(
    resource_in: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    resource = Resource(**resource_in.model_dump())
    db.add(resource)
    await db.flush()
    await db.refresh(resource)
    return resource


@router.patch("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: int,
    resource_in: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    update_data = resource_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resource, field, value)

    await db.flush()
    await db.refresh(resource)
    return resource


@router.delete("/{resource_id}", status_code=204)
async def delete_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    await db.delete(resource)
    await db.flush()


@router.get("/{resource_id}/availability", response_model=List[AvailabilitySlot])
async def check_availability(
    resource_id: int,
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Check hourly availability for a resource on a given date."""
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Resource not found")

    if date:
        target = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    else:
        target = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    # Operating hours: 7 AM to 10 PM
    day_start = target.replace(hour=7)
    day_end = target.replace(hour=22)

    # Get bookings for that day
    bookings_result = await db.execute(
        select(Booking).where(
            and_(
                Booking.resource_id == resource_id,
                Booking.status == BookingStatus.CONFIRMED,
                Booking.start_time < day_end,
                Booking.end_time > day_start,
            )
        )
    )
    bookings = list(bookings_result.scalars().all())

    # Generate hourly slots
    slots = []
    current = day_start
    while current < day_end:
        slot_end = current + timedelta(hours=1)
        is_available = not any(
            b.start_time < slot_end and b.end_time > current for b in bookings
        )
        slots.append(AvailabilitySlot(
            start_time=current,
            end_time=slot_end,
            is_available=is_available,
        ))
        current = slot_end

    return slots
