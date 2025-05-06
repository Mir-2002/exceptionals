from bson import ObjectId
from pydantic import BaseModel, ConfigDict, EmailStr, Field ,field_validator, model_validator
from datetime import datetime, timezone
from typing import Optional
from typing_extensions import Self
from utils.custom_types import PyObjectId

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
    
    # Updated Config for Pydantic v2
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )

# User Inheritance for Create
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
    
# User Inheritance for Update
class UserUpdate(UserBase):
    full_name: Optional[str] = None

# Class for User Model in Database
class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str

    # Updated Config for Pydantic v2
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str},
        arbitrary_types_allowed=True
    )

# Class for Returning User Response
class UserResponse(UserBase):
    id: str = Field(alias="_id")

    # Updated Config for Pydantic v2
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )

# Class for Deleting User Response
class DeleteUserResponse(BaseModel):
    message: str

# Class for User Update Response
class UserUpdateResponse(BaseModel):
    message: str
    user: UserResponse

    # Updated Config for Pydantic v2
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )

# Class for User Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

    # Updated Config for Pydantic v2
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )

# Class for User Login Response
class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

    # Updated Config for Pydantic v2
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )
