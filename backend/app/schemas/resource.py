from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.resource import ResourceType


class ResourceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    resource_type: ResourceType
    description: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=1)
    amenities: List[str] = []


class ResourceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=1)
    amenities: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ResourceResponse(BaseModel):
    id: int
    name: str
    resource_type: ResourceType
    description: Optional[str]
    location: Optional[str]
    capacity: Optional[int]
    amenities: List[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AvailabilitySlot(BaseModel):
    start_time: datetime
    end_time: datetime
    is_available: bool
