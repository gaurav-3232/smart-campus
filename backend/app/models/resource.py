from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, JSON, Boolean
from sqlalchemy.orm import relationship
import enum

from app.db.session import Base


class ResourceType(str, enum.Enum):
    ROOM = "room"
    LAB = "lab"
    EQUIPMENT = "equipment"


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    resource_type = Column(SAEnum("room", "lab", "equipment", name="resourcetype"), nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    location = Column(String(255), nullable=True)
    capacity = Column(Integer, nullable=True)
    amenities = Column(JSON, default=list)  # ["projector", "whiteboard", "wifi"]
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    bookings = relationship("Booking", back_populates="resource", cascade="all, delete-orphan")
