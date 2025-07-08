from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class InferenceRequest(BaseModel):
    text: str

class InferenceResponse(BaseModel):
    result: str

class DocstringRequest(BaseModel):
    code: str

class DocstringResponse(BaseModel):
    original_code: str
    generated_docstring: str
    success: bool

class FileDocumentationRequest(BaseModel):
    include_private: Optional[bool] = False
    include_examples: Optional[bool] = True
    include_type_hints: Optional[bool] = True

class DocumentedItem(BaseModel):
    type: str  # "function", "class", "method"
    name: str
    original_code: str
    generated_docstring: str

class FileDocumentationResponse(BaseModel):
    file_name: str
    documented_items: List[DocumentedItem]
    total_items: int
    success: bool
    message: str

# Optional: For project-level documentation
class ProjectDocumentationRequest(BaseModel):
    include_private: Optional[bool] = False
    file_filters: Optional[List[str]] = None  # Only document specific files

class ProjectDocumentationResponse(BaseModel):
    project_name: str
    documented_files: List[FileDocumentationResponse]
    total_files: int
    total_items: int
    success: bool
    message: str