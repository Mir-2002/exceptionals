from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional

class CodeSnippetModel(BaseModel):
    """Model for code snippet input"""
    code: str = Field(..., description="The Python code snippet to generate documentation for")

class DocstringResponseModel(BaseModel):
    """Model for docstring response"""
    docstring: str = Field(..., description="The generated docstring")

class TaskStatusResponseModel(BaseModel):
    """Model for task status response"""
    task_id: str = Field(..., description="The task ID")
    status: str = Field(..., description="The current status of the task")
    description: str = Field(..., description="Description of the task")
    created_at: float = Field(..., description="Timestamp when task was created")
    updated_at: float = Field(..., description="Timestamp when task was last updated")
    result: Optional[Dict[str, Any]] = Field(None, description="Task result when completed")
    error: Optional[str] = Field(None, description="Error message if task failed")

class DocumentedContentResponseModel(BaseModel):
    """Model for documented content response"""
    file_id: str = Field(..., description="The ID of the file")
    documented_content: str = Field(..., description="The content with documentation")
    is_documented: bool = Field(..., description="Whether the file has been documented")

class SearchQueryModel(BaseModel):
    """Model for code search query"""
    query: str = Field(..., description="The search query")

class SearchResultsResponseModel(BaseModel):
    """Model for search results"""
    query: str = Field(..., description="The search query")
    matches: Dict[str, List[Dict[str, Any]]] = Field(..., description="Matched code elements")
    total_matches: int = Field(..., description="Total number of matches")
    error: Optional[str] = Field(None, description="Error message if search failed")

class DocumentationOptionsModel(BaseModel):
    """Model for documentation generation options"""
    include_examples: bool = Field(True, description="Include examples in documentation")
    include_types: bool = Field(True, description="Include type hints in documentation")
    docstring_style: str = Field("google", description="Style of docstring (google, numpy, etc.)")