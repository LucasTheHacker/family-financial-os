from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="The user's display name")
    email: EmailStr = Field(..., description="The user's unique email address")
    pix_key: Optional[str] = Field(None, max_length=255, description="The user's PIX key for payments")

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    pix_key: Optional[str] = Field(None, max_length=255)

class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
