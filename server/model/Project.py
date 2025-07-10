"""

TO DO:
- Add User ID

"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field, field_validator
from model.File import FolderNode
from model.Documentation import FileDocumentationResponse
from utils.custom_types import PyObjectId


class ProjectModel(BaseModel):
    name: str
    excluded_directories: List[str] = []
    excluded_files: List[str] = []
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id : Optional[PyObjectId] = None
    has_project_documentation: bool = False
    project_documentation_summary: Optional[Dict[str, Any]] = None
    total_documented_items: int = 0
    documentation_completeness: float = 0.0  # Percentage of files documented

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

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {
            ObjectId: str,
            PyObjectId: str
        }
    }

class ProjectResponseModel(ProjectModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    message: str = "Operation successful"
    file_count: Optional[int] = 0
    processed_files: Optional[int] = 0
    processing_status: Optional[str] = "Not Started"  # "Not Started", "In Progress", "Completed", "Failed"
    project_documented: Optional[bool] = False
    project_documentation_generated_at: Optional[datetime] = None
    documented_files_count: Optional[int] = 0
    total_documented_items: Optional[int] = 0

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

class ProjectStructureResponseModel(BaseModel):
    project_id: str
    project_name: str
    root: FolderNode

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )

class ProjectBasicResponse(BaseModel):
    project_id: str
    success: bool
    message: str
    name: str

class ProjectExclusionResponse(BaseModel):
    success: bool
    message: str
    project_id: str

class UserProjectsResponse(BaseModel):
    projects: List[dict]
    total: int
    skip: int
    limit: int