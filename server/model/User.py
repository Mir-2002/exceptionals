from datetime import datetime, timezone
from typing import Any, Optional, Self
from bson import ObjectId
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from utils.custom_types import PyObjectId


class UserModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    username: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @field_validator('username', mode='before')
    @classmethod
    def validate_username(cls, username: str) -> str:
        if len(username) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if not username.isalnum():
            raise ValueError('Username must be alphanumeric')
        return username
    
class UserCreateModel(UserModel):
    password: str
    password_repeat: str

    @field_validator('password', mode='after')
    @classmethod
    def validate_password(cls, password: str) -> str:
        if len(password) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in password):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isalpha() for char in password):
            raise ValueError('Password must contain at least one letter')
        return password
    
    @model_validator(mode='after')
    def check_passwords_match(self) -> Self:
        if self.password != self.password_repeat:
            raise ValueError('Passwords do not match')
        return self
    
class UserUpdateModel(UserModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    
class UserInDBModel(UserModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str

class BaseResponseModel(BaseModel):
    id: str = Field(alias="_id")
    username: str
    message: str = "Operation successful"

    @field_validator('id', mode='before')
    @classmethod
    def convert_pyobjectid_to_str(cls, value: Any) -> str:
        if isinstance(value, PyObjectId):
            return str(value)
        if isinstance(value, ObjectId):
            return str(value)
        return value

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )

class DeleteUserResponseModel(BaseResponseModel):
    message: str = "User deleted successfully"

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )

class UpdateUserResponseModel(BaseResponseModel):
    updated_fields: dict[str, Any] = Field(default_factory=dict)
    message: str = "User updated successfully"

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )
