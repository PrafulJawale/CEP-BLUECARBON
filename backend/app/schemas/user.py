from datetime import datetime
from uuid import UUID
from typing import Any, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from pydantic_core import core_schema
import re

# Custom EmailStr that allows .local domains for demo purposes
class EmailStr(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.with_info_plain_validator_function(
            cls._validate,
        )

    @classmethod
    def _validate(cls, value: str, info) -> str:
        if not isinstance(value, str):
            raise ValueError("Email must be a string")
        # Allow .local domains for demo purposes
        if not re.match(
            r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$",
            value,
        ):
            raise ValueError("Invalid email address")
        return value

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string", "format": "email"}


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    organization: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="project_developer")


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    organization: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    role: Optional[str] = None
    status: Optional[str] = None


class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: str
    status: str
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    sub: str
    exp: int
    type: str
    role: Optional[str] = None