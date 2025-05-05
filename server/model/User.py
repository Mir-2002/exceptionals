from pydantic import BaseModel, EmailStr, Field ,field_validator, model_validator, GetJsonSchemaHandler
from pydantic_core import core_schema
from datetime import datetime, timezone
from typing import Optional
from typing_extensions import Self
from bson import ObjectId

# Custom Pydantic Type for MongoDB ObjectId
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError('Invalid ObjectId')
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, handler: GetJsonSchemaHandler):
        # Customize the JSON schema for PyObjectId
        json_schema = handler.resolve_ref_schema(handler(core_schema))
        json_schema.update(type="string")
        return json_schema

# User Base Model
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    disabled: bool = False
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

    # Email Validator
    @field_validator('email', mode='before')
    @classmethod
    def validate_email(cls, email: str) -> str:
        if '@' not in email or '.' not in email.split('@')[-1]:
            raise ValueError('Invalid email format')
        return email
    
    # Username Validator
    @field_validator('username', mode='before')
    @classmethod
    def validate_username(cls, username: str) -> str:
        if len(username) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if not username.isalnum():
            raise ValueError('Username must be alphanumeric')
        return username

# User Inheritance for Create and Update
class UserCreate(UserBase):
    password: str
    password_repeat: str

    # Password Validator
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
    
    # Check if passwords match
    @model_validator(mode='after')
    def check_passwords_match(self) -> Self:
        if self.password != self.password_repeat:
            raise ValueError('Passwords do not match')
        return self

# Class for User Model in Database
class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str

    class Config:
        from_attributes = True

# Class for Returning User Response
class UserResponse(UserBase):
    id: str

    class Config:
        from_attributes = True

# Class for Deleting User Response
class DeleteUserResponse(BaseModel):
    message: str
