import os
from fastapi import Depends, File, HTTPException, UploadFile
from model.File import FileModel, FileResponseModel, FileStructure
from utils.db import get_db
from bson import ObjectId
from datetime import datetime
from utils.parser import CodeParserService
from typing import List

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
        raise HTTPException(status_code=400, detail="Only Python (.py) files are supported")
    
    # Sanitize filename
    safe_filename = os.path.basename(file.filename)
    if safe_filename != file.filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    # Create project directory if it doesn't exist
    project_dir = os.path.join(UPLOAD_DIR, project_id)
    os.makedirs(project_dir, exist_ok=True)
    
    # Check for duplicate files
    existing_file = await db.files.find_one({
        "project_id": ObjectId(project_id),
        "file_name": safe_filename
    })
    
    if existing_file:
        raise HTTPException(status_code=409, detail=f"File {safe_filename} already exists")
    
    # Save file with temporary name first
    temp_file_path = os.path.join(project_dir, f"temp_{datetime.now().timestamp()}.py")
    file_path = os.path.join(project_dir, safe_filename)
    
    try:
        # Read and save file content
        content = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(content)
        
        # Analyze file structure using the parser
        structure = code_parser.parse_file(temp_file_path)
        
        # Rename to final filename
        os.rename(temp_file_path, file_path)
        
        # Create file document
        file_doc = FileModel(
        project_id=ObjectId(project_id),
        file_name=safe_filename,
        file_path=file_path,
        content_type=file.content_type,
        size=len(content),
        processed=True,
        structure=structure if isinstance(structure, dict) else 
                (structure.model_dump() if hasattr(structure, "model_dump") else 
                structure.dict() if hasattr(structure, "dict") else None)
)
        
        # Save to database
        result = await db.files.insert_one(file_doc.model_dump(by_alias=True))
        
        # Get the created file
        created_file = await db.files.find_one({"_id": result.inserted_id})
        if not created_file:
            raise HTTPException(status_code=500, detail="Failed to create file record")
        
        # Convert ObjectId fields to strings
        created_file["_id"] = str(created_file["_id"])
        created_file["project_id"] = str(created_file["project_id"])
        
        return FileResponseModel(**created_file)
        
    except Exception as e:
        # Clean up temp file if it exists
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

async def get_project_files(
    project_id: str, 
    skip: int = 0,
    limit: int = 100, 
    db=Depends(get_db)
):
    """Get all files in a project."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    try:
        # Convert to ObjectId once
        project_oid = ObjectId(project_id)
        
        # Check if project exists
        project = await db.projects.find_one({"_id": project_oid})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Query files
        files = await db.files.find({"project_id": project_oid}) \
                             .skip(skip) \
                             .limit(limit) \
                             .to_list(length=limit)
        
        # Convert to response models
        response_files = []
        for file in files:
            try:
                # Convert ObjectIds to strings
                file["_id"] = str(file["_id"])
                file["project_id"] = str(file["project_id"])
                
                # Create response model
                response_files.append(FileResponseModel(**file))
            except Exception as e:
                print(f"Skipping malformed file document {file.get('_id')}: {str(e)}")
                continue
        
        return response_files
        
    except Exception as e:
        print(f"Error in get_project_files: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_file(file_id: str, db=Depends(get_db)):
    """Get a file by ID."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")
    
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Convert ObjectId fields to strings
    file["_id"] = str(file["_id"])
    file["project_id"] = str(file["project_id"])
    
    return FileResponseModel(**file)

async def get_file_structure(file_id: str, db=Depends(get_db)):
    """Get the structure of a file."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")
    
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Return structure if available, or parse file if not processed yet
    if file.get("processed") and file.get("structure"):
        try:
            return FileStructure.model_validate(file["structure"])
        except Exception as e:
            print(f"Error validating file structure: {str(e)}")
            raise HTTPException(status_code=500, detail="Invalid file structure format")
    
    # If file exists but structure not processed, parse it now
    if os.path.exists(file["file_path"]):
        structure = code_parser.parse_file(file["file_path"])
        
        # Prepare structure for database
        structure_data = structure
        if not isinstance(structure, dict):
            if hasattr(structure, "model_dump"):
                structure_data = structure.model_dump()
            elif hasattr(structure, "dict"):
                structure_data = structure.dict()
        
        # Update the file with structure
        await db.files.update_one(
            {"_id": ObjectId(file_id)},
            {"$set": {"structure": structure_data, "processed": True}}
        )
        
        return structure
    else:
        raise HTTPException(status_code=404, detail="File content not found")

async def get_file_content(file_id: str, db=Depends(get_db)):
    """Get the content of a file."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")
    
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Read file content
    try:
        if os.path.exists(file["file_path"]):
            with open(file["file_path"], "r", encoding="utf-8") as f:
                content = f.read()
            return {"content": content, "file_name": file["file_name"]}
        else:
            raise HTTPException(status_code=404, detail="File content not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file content: {str(e)}")

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