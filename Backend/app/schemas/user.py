from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserResponse(UserBase):
    id: UUID
    role: str
    employee_id: Optional[str]
    phone_number: Optional[str]
    google_id: str
    profile_picture: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class GoogleAuthURL(BaseModel):
    authorization_url: str