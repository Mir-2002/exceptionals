"""

TO DO:
- Add User ID

"""

from datetime import datetime, timezone
from typing import Any, List, Optional
from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field, field_validator
from utils.custom_types import PyObjectId


class ProjectModel(BaseModel):
    name: str
    excluded_directories: List[str] = []
    excluded_files: List[str] = []

    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Validators
    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Project name cannot be empty or whitespace.")
        if len(value) > 100:
            raise ValueError("Project name cannot exceed 100 characters.")
        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Project description cannot be empty or whitespace.")
        if len(value) > 500:
            raise ValueError("Project description cannot exceed 500 characters.")
        return value

class ProjectInDBModel(ProjectModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )

class ProjectResponseModel(ProjectModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    message: str = "Operation successful"
    file_count: Optional[int] = 0
    processed_files: Optional[int] = 0
    processing_status: Optional[str] = "Not Started"  # "Not Started", "In Progress", "Completed", "Failed"


    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )

class ProjectUpdateModel(BaseModel):
    name : Optional[str] = None
    description : Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )

class ProjectUpdateResponseModel(ProjectResponseModel):
    updated_fields: dict[str, str] = Field(default_factory=dict)
    message: str = "Project updated successfully"

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )

class ProjectDeleteResponseModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    message: str = "Project deleted successfully"

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )
