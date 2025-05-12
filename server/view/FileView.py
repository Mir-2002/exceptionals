import os
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query
from controller.FileController import upload_file, get_file_structure, get_file_content
from model.File import FileResponseModel, FileStructure
from utils.db import get_db
from bson import ObjectId
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
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
        
    # Check if project exists
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get files for this project
    cursor = db.files.find({"project_id": ObjectId(project_id)}).skip(skip).limit(limit)
    files = await cursor.to_list(length=limit)
    
    return files

@router.get("/files/{file_id}", response_model=FileResponseModel)
async def get_file(file_id: str, db=Depends(get_db)):
    """Get a file by ID."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")
    
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return file

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
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")
    
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete the file from disk
    if os.path.exists(file["file_path"]):
        try:
            os.remove(file["file_path"])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting file from disk: {str(e)}")
    
    # Delete from database
    result = await db.files.delete_one({"_id": ObjectId(file_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete file from database")
        
    return {"message": "File deleted successfully", "file_id": file_id}