from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from controller.DocumentationController import (
    generate_docstring_for_code,
    document_file_functions,
    document_project_functions,
    get_file_documentation_data,
    get_project_documentation_data,
    export_file_documentation_content
)
from model.Documentation import (
    DocstringRequest,
    DocstringResponse,
    FileDocumentationRequest,
    FileDocumentationResponse,
    ProjectDocumentationRequest,
    ProjectDocumentationResponse,
    DocumentedItem
)
from utils.auth import get_current_user
from utils.db import get_db
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


router = APIRouter()

@router.post("/docs/generate", response_model=DocstringResponse)
async def generate_docstring(
    request: DocstringRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Generate a docstring for a code snippet."""
    return await generate_docstring_for_code(request)

@router.post("/files/{file_id}/document", response_model=FileDocumentationResponse)
async def document_file(
    file_id: str,
    options: FileDocumentationRequest = None,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Generate documentation for all functions/classes in a file."""
    # TODO: Add file ownership verification
    # await verify_file_owner(file_id, current_user["_id"], db)
    return await document_file_functions(file_id, options, db)

@router.post("/projects/{project_id}/document", response_model=ProjectDocumentationResponse)
async def document_project(
    project_id: str,
    options: ProjectDocumentationRequest = None,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Generate documentation for all files in a project."""
    # TODO: Add project ownership verification
    # await verify_project_owner(project_id, current_user["_id"], db)
    return await document_project_functions(project_id, options, db)

@router.get("/files/{file_id}/documentation", response_model=FileDocumentationResponse)
async def get_file_documentation(
    file_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Retrieve stored documentation for a file."""
    data = await get_file_documentation_data(file_id, db)
    
    # Convert to proper response model
    documented_items = [DocumentedItem(**item) for item in data["documented_items"]]
    
    return FileDocumentationResponse(
        file_name=data["file_name"],
        documented_items=documented_items,
        total_items=data["total_items"],
        success=data["success"],
        message=data["message"]
    )

@router.get("/projects/{project_id}/documentation", response_model=ProjectDocumentationResponse)
async def get_project_documentation(
    project_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Retrieve stored documentation for all files in a project."""
    data = await get_project_documentation_data(project_id, db)
    
    # Convert to proper response model
    documented_files = []
    for file_data in data["documented_files"]:
        documented_items = [DocumentedItem(**item) for item in file_data["documented_items"]]
        file_response = FileDocumentationResponse(
            file_name=file_data["file_name"],
            documented_items=documented_items,
            total_items=file_data["total_items"],
            success=file_data["success"],
            message=file_data["message"]
        )
        documented_files.append(file_response)
    
    return ProjectDocumentationResponse(
        project_name=data["project_name"],
        documented_files=documented_files,
        total_files=data["total_files"],
        total_items=data["total_items"],
        success=data["success"],
        message=data["message"]
    )

@router.get("/files/{file_id}/documentation/export")
async def export_file_documentation(
    file_id: str,
    format: str = Query(default="markdown", regex="^(markdown|json|txt)$"),
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Export file documentation in various formats."""
    content, media_type, filename = await export_file_documentation_content(file_id, format, db)
    
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )