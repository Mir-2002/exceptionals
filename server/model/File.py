from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, field_validator, validator
from server.utils.custom_types import PyObjectId


class FileModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    project_id: PyObjectId
    file_name: str
    file_path: str
    content_type: str
    size: int
    relative_path: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processed: bool = False

    @field_validator("file_name")
    @classmethod
    def validate_file_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("File name cannot be empty or whitespace.")
        return value
    
    @field_validator("file_name")
    @classmethod
    def validate_file_type(cls, value: str) -> str:
        if not value.endswith('.py'):
            raise ValueError("Only Python files are allowed")
        return value
    
class FileResponseModel(BaseModel):
    id: str = Field(..., alias="_id")
    project_id: str
    file_name: str
    size: int
    relative_path: Optional[str] = None
    created_at: datetime
    processed: bool = False


