from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum

from app.db.session import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STAFF = "staff"
    STUDENT = "student"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum("admin", "staff", "student", name="userrole"), default="student", nullable=False)
    department = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
