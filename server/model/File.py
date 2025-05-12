from ast import List
from datetime import datetime, timezone
import os
import re
from typing import Any, ClassVar, Dict, Optional, List
from pydantic import BaseModel, Field, field_validator
from utils.custom_types import PyObjectId

class FunctionInfo(BaseModel):
    name: str
    line: int
    end_line: int
    args: List[str]
    docstring: str
    decorators: List[str]

class ClassInfo(BaseModel):
    name: str
    line: int
    end_line: int
    methods: List[FunctionInfo]
    docstring: str
    bases: List[str]

class FileStructure(BaseModel):
    file_name: str
    classes: List[ClassInfo] = []
    functions: List[FunctionInfo] = []
    error: Optional[str] = None

class FileModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    project_id: PyObjectId
    file_name: str
    file_path: str # Path on server
    content_type: str
    size: int
    relative_path: Optional[str] = None # Path in project
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processed: bool = False
    structure: Optional[Dict[str, Any]] = None

    MAX_FILE_SIZE : ClassVar[int] = 100 * 1024 * 1024  # 100 MB

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
    
    @field_validator("file_name", mode="after")
    @classmethod
    def validate_file_type(cls, value: str) -> str:
        if not value.endswith('.py'):
            raise ValueError("Only Python files are allowed")
        return value
    
    @field_validator("size")
    @classmethod
    def validate_file_size(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("File size must be greater than 0.")
        if value > cls.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds maximum allowed size of {cls.MAX_FILE_SIZE/(1024*1024)}MB.")
        return value
    
    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, value: str) -> str:
        valid_types = ["text/x-python", "text/plain", "application/x-python-code"]
        if value not in valid_types and not value.startswith("text/"):
            raise ValueError(f"Unsupported content type: {value}. Expected a Python file.")
        return value
    
class FileResponseModel(BaseModel):
    id: str = Field(..., alias="_id")
    project_id: str
    file_name: str
    size: int
    relative_path: Optional[str] = None
    created_at: datetime
    processed: bool = False
    structure: Optional[Dict[str, Any]] = None

    @property
    def readable_size(self) -> str:
        """Convert size in bytes to human-readable format."""
        size = self.size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024 or unit == 'GB':
                return f"{size:.2f} {unit}"
            size /= 1024


