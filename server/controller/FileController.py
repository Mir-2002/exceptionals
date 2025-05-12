from fastapi import Depends, File, HTTPException, UploadFile
from model.File import FileModel, FileResponseModel, FileStructure
from utils.db import get_db
from bson import ObjectId
import os
import shutil
import hashlib
from datetime import datetime
from utils.parser import CodeParserService

# Configure file storage
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize the code parser service
code_parser = CodeParserService()

async def upload_file(project_id: str, file: UploadFile, db=Depends(get_db)):
    """Upload a Python file to a project and extract its structure."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
        
    # Check if project exists
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Validate file name
    if not file.filename or not file.filename.lower().endswith('.py'):
        raise HTTPException(status_code=400, detail="Only Python files are allowed")
    
    # Sanitize filename
    safe_filename = os.path.basename(file.filename)
    if safe_filename != file.filename:
        raise HTTPException(status_code=400, detail="Invalid characters in filename")
    
    # Create project directory if it doesn't exist
    project_dir = os.path.join(UPLOAD_DIR, project_id)
    os.makedirs(project_dir, exist_ok=True)
    
    # Check for duplicate files
    existing_file = await db.files.find_one({
        "project_id": ObjectId(project_id),
        "file_name": safe_filename
    })
    
    if existing_file:
        raise HTTPException(status_code=409, detail=f"File '{safe_filename}' already exists in this project")
    
    # Save file with temporary name first
    temp_file_path = os.path.join(project_dir, f"temp_{datetime.now().timestamp()}.py")
    file_path = os.path.join(project_dir, safe_filename)
    
    try:
        # Read file content to calculate size
        file_content = await file.read()
        file_size = len(file_content)
        
        # Check file size before saving
        if file_size > FileModel.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum allowed size is {FileModel.MAX_FILE_SIZE/(1024*1024)}MB"
            )
        
        # Write to temporary file
        with open(temp_file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Calculate file hash for potential duplicate detection
        file_hash = hashlib.md5(file_content).hexdigest()
        
        # Attempt to parse the file before saving permanently
        try:
            structure = code_parser.parse_file(temp_file_path)
            if structure.get("error"):
                raise ValueError(structure["error"])
        except Exception as e:
            # Delete temporary file if parsing fails
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise HTTPException(status_code=400, detail=f"Invalid Python file: {str(e)}")
        
        # Rename to final filename
        os.rename(temp_file_path, file_path)
        
    except Exception as e:
        # Clean up temporary file if it exists
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
    
    # Create file record
    try:
        file_model = FileModel(
            project_id=ObjectId(project_id),
            file_name=safe_filename,
            file_path=file_path,
            content_type=file.content_type or "text/x-python",
            size=file_size,
            relative_path=safe_filename,
            structure=structure,
        )
        
        # Save to database
        result = await db.files.insert_one(file_model.model_dump(by_alias=True))
        
        # Return created file
        created_file = await db.files.find_one({"_id": result.inserted_id})
        if not created_file:
            raise HTTPException(status_code=500, detail="Failed to create file record")
            
        return FileResponseModel(**created_file)
    
    except Exception as e:
        # Clean up file if database operation fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to save file metadata: {str(e)}")

async def get_file_structure(file_id: str, db=Depends(get_db)):
    """Get the structure of a file."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")
    
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # If structure is not already in the database, parse it now
    if not file.get("structure"):
        if not os.path.exists(file["file_path"]):
            raise HTTPException(status_code=404, detail="File not found on disk")
            
        try:
            structure = code_parser.parse_file(file["file_path"])
            
            # Update the file record with the structure
            await db.files.update_one(
                {"_id": ObjectId(file_id)},
                {"$set": {"structure": structure}}
            )
            
            return FileStructure(**structure)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")
    
    return FileStructure(**file["structure"])

async def get_file_content(file_id: str, db=Depends(get_db)):
    """Get the content of a file."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")
    
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        with open(file["file_path"], "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")