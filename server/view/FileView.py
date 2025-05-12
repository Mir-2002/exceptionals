from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query
from controller.FileController import (
    upload_file, 
    get_file_structure, 
    get_file_content, 
    get_project_files as get_files_controller,
    get_file as get_file_controller,
    delete_file as delete_file_controller
)
from model.File import FileResponseModel, FileStructure
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
async def get_structure(file_id: str, db=Depends(get_db)):
    """Get the structure of a file."""
    return await get_file_structure(file_id, db)

@router.get("/files/{file_id}/content")
async def get_content(file_id: str, db=Depends(get_db)):
    """Get the content of a file."""
    return await get_file_content(file_id, db)

@router.delete("/files/{file_id}")
async def delete_file(file_id: str, db=Depends(get_db)):
    """Delete a file."""
    return await delete_file_controller(file_id, db)