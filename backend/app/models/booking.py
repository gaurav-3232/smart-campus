from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Enum as SAEnum, CheckConstraint, Index, text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.schema import DDL
import enum

from app.db.session import Base


class BookingStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(SAEnum("confirmed", "cancelled", "completed", name="bookingstatus"), default="confirmed", nullable=False)
    recurring_group_id = Column(String(36), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    resource = relationship("Resource", back_populates="bookings")
    user = relationship("User", back_populates="bookings")

    __table_args__ = (
        CheckConstraint("end_time > start_time", name="ck_booking_time_order"),
        Index("ix_bookings_resource_time", "resource_id", "start_time", "end_time"),
        # The exclusion constraint is created via Alembic migration raw SQL
        # to prevent overlapping bookings for the same resource
    )
