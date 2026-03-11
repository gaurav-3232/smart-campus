from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.booking import BookingStatus
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse
from app.core.security import get_current_user
from app.services.booking_service import (
    create_booking, update_booking, cancel_booking, get_user_bookings,
)

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


@router.get("", response_model=List[BookingResponse])
async def list_bookings(
    status: Optional[BookingStatus] = None,
    upcoming: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_user_bookings(db, current_user, status, upcoming)


@router.post("", response_model=List[BookingResponse], status_code=201)
async def create_new_booking(
    booking_in: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_booking(db, booking_in, current_user)


@router.patch("/{booking_id}", response_model=BookingResponse)
async def update_existing_booking(
    booking_id: int,
    booking_in: BookingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await update_booking(db, booking_id, booking_in, current_user)


@router.delete("/{booking_id}", response_model=BookingResponse)
async def cancel_existing_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await cancel_booking(db, booking_id, current_user)
