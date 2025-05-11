from fastapi import Depends, File, HTTPException, UploadFile
from model.File import FileModel, FileResponseModel
from utils.db import get_db
from bson import ObjectId
import os
import shutil

# Configure file storage
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def upload_file(project_id: str, file: UploadFile, db=Depends(get_db)):
    """Upload a Python file to a project."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
        
    # Check if project exists
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Create project directory if it doesn't exist
    project_dir = os.path.join(UPLOAD_DIR, project_id)
    os.makedirs(project_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(project_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
    
    # Create file record
    file_model = FileModel(
        project_id=ObjectId(project_id),
        file_name=file.filename,
        file_path=file_path,
        content_type=file.content_type,
        size=os.path.getsize(file_path),
        relative_path=file.filename,
    )
    
    # Save to database
    result = await db.files.insert_one(file_model.model_dump(by_alias=True))
    
    # Return created file
    created_file = await db.files.find_one({"_id": result.inserted_id})
    return FileResponseModel(**created_file)