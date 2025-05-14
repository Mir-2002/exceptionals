from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query
from controller.FileController import (
    upload_file,
    upload_project_zip,
    get_file_structure, 
    get_file_content, 
    get_project_files as get_files_controller,
    get_file as get_file_controller,
    delete_file as delete_file_controller,
    get_project_structure,
    set_file_exclusions,
    set_project_exclusions,
    get_file_exclusions,
    get_project_exclusions
)
from model.File import FileResponseModel, FileStructure, ZipUploadResponseModel, ProjectStructureResponseModel, FileExclusions, ProjectExclusions, ExclusionResponse
from utils.db import get_db
from typing import List

router = APIRouter()

@router.post("/projects/{project_id}/files", response_model=FileResponseModel)
async def upload_project_file(
    project_id: str,
    file: UploadFile = File(...),
    db=Depends(get_db)
):
    """Upload a Python file to a project and extract its structure."""
    return await upload_file(project_id, file, db)

@router.get("/projects/{project_id}/files", response_model=List[FileResponseModel])
async def get_project_files(
    project_id: str, 
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db=Depends(get_db)
):
    """Get all files in a project."""
    return await get_files_controller(project_id, skip, limit, db)

@router.get("/files/{file_id}", response_model=FileResponseModel)
async def get_file(file_id: str, db=Depends(get_db)):
    """Get a file by ID."""
    return await get_file_controller(file_id, db)

@router.get("/files/{file_id}/structure", response_model=FileStructure)
async def get_structure(
    file_id: str,
    include_code : bool = Query(False, description="Include code in the structure"),
    use_default_exclusions: bool = Query(True, description="Apply default exclusions to common elements"),
    db=Depends(get_db)):
    """Get the structure of a file."""
    return await get_file_structure(file_id, include_code, use_default_exclusions, db)

@router.get("/files/{file_id}/content")
async def get_content(file_id: str, db=Depends(get_db)):
    """Get the content of a file."""
    return await get_file_content(file_id, db)

@router.delete("/files/{file_id}")
async def delete_file(file_id: str, db=Depends(get_db)):
    """Delete a file."""
    return await delete_file_controller(file_id, db)

@router.get("/projects/{project_id}/structure", response_model=ProjectStructureResponseModel)
async def get_structure_for_project(project_id: str, use_default_exclusions: bool = Query(True, description="Apply default exclusions to common files/folders") ,db=Depends(get_db)):
    """
    Get the folder structure of a project.
    
    Returns a tree representing the directory structure of the project.
    This is useful for displaying folder organization in a file explorer UI.
    """
    return await get_project_structure(project_id, use_default_exclusions,db)

@router.post("/projects/{project_id}/upload-zip", response_model=ZipUploadResponseModel)
async def upload_project_zip_file(
    project_id: str,
    zip_file: UploadFile = File(...),
    db=Depends(get_db)
):
    """
    Upload a ZIP file containing a project structure.
    
    This allows users to upload entire projects with their directory structure intact.
    """
    return await upload_project_zip(project_id, zip_file, db)

# Add these routes
@router.post("/files/{file_id}/exclusions", response_model=ExclusionResponse)
async def update_file_exclusions(
    file_id: str,
    exclusions: FileExclusions,
    db=Depends(get_db)
):
    """
    Set which classes and functions to exclude from documentation.
    """
    return await set_file_exclusions(file_id, exclusions, db)

@router.get("/files/{file_id}/exclusions", response_model=FileExclusions)
async def retrieve_file_exclusions(file_id: str, db=Depends(get_db)):
    """
    Get the current exclusions for a file.
    """
    return await get_file_exclusions(file_id, db)

@router.post("/projects/{project_id}/exclusions", response_model=ExclusionResponse)
async def update_project_exclusions(
    project_id: str,
    exclusions: ProjectExclusions,
    db=Depends(get_db)
):
    """
    Set which directories and files to exclude from project documentation.
    """
    return await set_project_exclusions(project_id, exclusions, db)

@router.get("/projects/{project_id}/exclusions", response_model=ProjectExclusions)
async def retrieve_project_exclusions(project_id: str, db=Depends(get_db)):
    """
    Get the current exclusions for a project.
    """
    return await get_project_exclusions(project_id, db)



