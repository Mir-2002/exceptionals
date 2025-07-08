from datetime import datetime, timezone
import os
import re
from typing import Any, ClassVar, Dict, Optional, List, Union
from bson import ObjectId
from pydantic import BaseModel, Field, field_validator
from utils.custom_types import PyObjectId

class FunctionInfo(BaseModel):
    name: str
    line: int
    end_line: int
    args: List[str]
    docstring: str
    decorators: List[str]
    code: Optional[str] = None
    excluded: bool = False
    default_exclusion: bool = False
    inherited_exclusion: bool = False

class ClassInfo(BaseModel):
    name: str
    line: int
    end_line: int
    methods: List[FunctionInfo]
    docstring: str
    bases: List[str]
    code : Optional[str] = None
    excluded: bool = False
    default_exclusion: bool = False
    inherited_exclusion: bool = False

class FileUploadInfo(BaseModel):
    file_name: str
    file_path: str  # This will be relative_path for response info
    size: int
    processed: bool

    model_config = {
        "json_encoders": {
            ObjectId: str,
            PyObjectId: str
        }
    }

class ZipUploadResponseModel(BaseModel):
    message: str
    processed_count: int
    total_files: int
    files: List[FileUploadInfo]  # Updated to match the corrected model
class FileStructure(BaseModel):
    file_name: str
    classes: List[ClassInfo] = []
    functions: List[FunctionInfo] = []
    error: Optional[str] = None

class FileModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    project_id: PyObjectId
    file_name: str
    content: str  # Add this field for database-only storage
    file_path: Optional[str] = None  # Keep optional for backward compatibility
    content_type: str
    size: int
    relative_path: Optional[str] = None  # Path in project
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Add this
    processed: bool = False
    structure: Optional[Dict[str, Any]] = None
    excluded_classes: List[str] = []
    excluded_functions: List[str] = []
    documented: bool = False  # Add this field
    documented_content: Optional[str] = None
    documented_at: Optional[datetime] = None
    documented_items_count: Optional[int] = 0  # Add this field

    MAX_FILE_SIZE: ClassVar[int] = 100 * 1024 * 1024  # 100 MB

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        """Validate file content."""
        if not value.strip():
            raise ValueError("File content cannot be empty or whitespace.")
        
        # Check if content size exceeds limit
        content_size = len(value.encode('utf-8'))
        if content_size > cls.MAX_FILE_SIZE:
            raise ValueError(f"File content exceeds maximum allowed size of {cls.MAX_FILE_SIZE/(1024*1024)}MB.")
        
        return value

    @field_validator("file_name")
    @classmethod
    def validate_file_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("File name cannot be empty or whitespace.")
        
        # Sanitize filename to prevent path traversal
        sanitized = os.path.basename(value)
        if sanitized != value:
            raise ValueError("Invalid characters in filename.")
        
        # Check for potentially unsafe characters
        if re.search(r'[<>:"|?*]', value):
            raise ValueError("Filename contains invalid characters.")
        
        return value
    
    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, value: str) -> str:
        valid_types = ["text/x-python", "text/plain", "application/x-python-code", "application/octet-stream"]
        if value not in valid_types and not value.startswith("text/"):
            raise ValueError(f"Unsupported content type: {value}. Expected a Python file.")
        return value
    
    @field_validator("size")
    @classmethod
    def validate_file_size(cls, value: int) -> int:
        if value < 0:
            raise ValueError("File size must be greater than or equal to 0.")
        if value > cls.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds maximum allowed size of {cls.MAX_FILE_SIZE/(1024*1024)}MB.")
        return value
    
    model_config = {
        "json_encoders": {
            ObjectId: str,
            PyObjectId: str
        },
        "arbitrary_types_allowed": True,
        "populate_by_name": True
    }
    
class FileResponseModel(BaseModel):
    id: str = Field(..., alias="_id")
    project_id: str = Field(..., alias="project_id")
    file_name: str
    size: int
    relative_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    documented: bool = False
    documented_at: Optional[datetime] = None  # Add this
    documented_items_count: Optional[int] = 0  # Add this
    processed: bool = False
    file_path: Optional[str] = None
    content_type: Optional[str] = None
    structure: Optional[Dict[str, Any]] = None

    @property
    def readable_size(self) -> str:
        """Convert size in bytes to human-readable format."""
        size = self.size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024 or unit == 'GB':
                return f"{size:.2f} {unit}"
            size /= 1024

    model_config = {
        "json_encoders": {
            ObjectId: str,
            PyObjectId: str
        }
    }

class FileNode(BaseModel):
    name: str
    type: str = "file"
    size: int
    processed: Optional[bool] = None
    id: Optional[str] = None
    excluded: bool = False
    inherited_exclusion: bool = False
    default_exclusion: bool = False

class FolderNode(BaseModel):
    name: str
    type: str = "folder"
    children: List[Union["FolderNode", FileNode]] = []
    excluded: bool = False
    inherited_exclusion: bool = False
    default_exclusion: bool = False

# This is needed for the recursive type definition
FolderNode.model_rebuild()

class ExclusionItem(BaseModel):
    """Model representing an item to be excluded from documentation."""
    type: str  # "function", "class", "directory"
    name: str
    path: Optional[str] = None  # For directories - relative path

class FileExclusions(BaseModel):
    """Model to track exclusions for a specific file."""
    file_id: str
    excluded_classes: List[str] = []
    excluded_functions: List[str] = []

class ProjectExclusions(BaseModel):
    """Model to track exclusions for a project."""
    project_id: str
    excluded_directories: List[str] = [] 
    excluded_files: List[str] = []

class ExclusionResponse(BaseModel):
    """Response model for exclusion operations."""
    success: bool
    message: str

class FileBasicResponse(BaseModel):
    success: bool
    message: str
    file_id: str

class FileContentResponse(BaseModel):
    """Response model for file content retrieval."""
    file_id: str
    file_name: str
    content: str
    size: int
    content_type: str

class FileStructureResponse(BaseModel):
    """Response model for file structure retrieval."""
    file_id: str
    file_name: str
    structure: Dict[str, Any]
