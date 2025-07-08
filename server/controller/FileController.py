import logging
import os
from fastapi import Depends, HTTPException, UploadFile
from model.File import (
    ExclusionResponse,
    FileBasicResponse,
    FileContentResponse,
    FileExclusions,
    FileModel,
    FileResponseModel,
    FileStructure,
)
from utils.document_helper import prepare_document_for_response, create_document_model
from utils.custom_types import PyObjectId
from utils.db import get_db, get_transaction_session
from bson import ObjectId
from datetime import datetime, timezone
from utils.parser import CodeParserService
from typing import List
import fnmatch

# Set up logging
logger = logging.getLogger(__name__)
# Configure file storage
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Default directory exclusions
DEFAULT_EXCLUDED_FOLDERS = [
    "__pycache__",
    ".git",
    ".github",
    "tests",
    "test",
    "docs",
    "venv",
    ".venv",
    "env",
    "node_modules",
]

# Default patterns for functions to exclude
DEFAULT_EXCLUDED_FUNCTIONS = [
    "test_*",  # Test functions
    "_*",  # Private methods
    "setup",  # Setup functions
    "teardown",  # Teardown functions
]

# Default patterns for classes to exclude
DEFAULT_EXCLUDED_CLASSES = [
    "Test*",  # Test classes
    "*TestCase",  # Test case classes
    "_*",  # Private classes
]

# Initialize the code parser service
code_parser = CodeParserService()

def matches_pattern(name: str, patterns: List[str]) -> bool:
    """Check if a name matches any of the given patterns."""
    return any(fnmatch.fnmatch(name, pattern) for pattern in patterns)

def apply_exclusions_to_structure(
    structure, 
    file_exclusions, 
    function_exclusions, 
    use_default_exclusions
):
    """Apply exclusion rules to a file structure.
    
    Args:
        structure: The file structure to apply exclusions to
        file_exclusions: List of class names to exclude
        function_exclusions: List of function names to exclude
        use_default_exclusions: Whether to apply default exclusion patterns
    
    Returns:
        The structure with exclusions applied
    """
    # Mark excluded classes
    for cls in structure.classes:
        # Check direct exclusions
        direct_exclusion = cls.name in file_exclusions

        # Check default exclusions
        default_exclusion = False
        if use_default_exclusions:
            default_exclusion = matches_pattern(cls.name, DEFAULT_EXCLUDED_CLASSES)

        cls.excluded = direct_exclusion or default_exclusion
        cls.default_exclusion = default_exclusion

        # Mark excluded methods
        for method in cls.methods:
            method_full_name = f"{cls.name}.{method.name}"
            direct_method_exclusion = method_full_name in function_exclusions

            # Check default exclusions for methods
            default_method_exclusion = False
            if use_default_exclusions:
                default_method_exclusion = matches_pattern(
                    method.name, DEFAULT_EXCLUDED_FUNCTIONS
                )

            # Method is excluded if directly excluded, by default pattern, or class is excluded
            method.excluded = (
                direct_method_exclusion or default_method_exclusion or cls.excluded
            )
            method.default_exclusion = default_method_exclusion
            method.inherited_exclusion = cls.excluded and not (
                direct_method_exclusion or default_method_exclusion
            )

    # Mark excluded functions
    for func in structure.functions:
        direct_exclusion = func.name in function_exclusions

        # Check default exclusions
        default_exclusion = False
        if use_default_exclusions:
            default_exclusion = matches_pattern(func.name, DEFAULT_EXCLUDED_FUNCTIONS)

        func.excluded = direct_exclusion or default_exclusion
        func.default_exclusion = default_exclusion
        
    return structure

async def upload_file(project_id: str, file: UploadFile, db=Depends(get_db)):
    """Upload a Python file to a project and extract its structure - database-only storage."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    project_id_obj = ObjectId(project_id)

    # Check if project exists (outside transaction for efficiency)
    project = await db.projects.find_one({"_id": project_id_obj})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate file name
    if not file.filename or not file.filename.lower().endswith(".py"):
        raise HTTPException(
            status_code=400, detail="Only Python (.py) files are supported"
        )

    # Sanitize filename
    safe_filename = os.path.basename(file.filename)
    if safe_filename != file.filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    # Check for duplicate files (outside transaction for efficiency)
    existing_file = await db.files.find_one(
        {"project_id": project_id_obj, "file_name": safe_filename}
    )

    if existing_file:
        raise HTTPException(
            status_code=409, detail=f"File {safe_filename} already exists"
        )

    temp_file_path = None
    try:
        # Read file content
        content = await file.read()
        content_str = content.decode('utf-8')
        
        # Create temporary file for parsing (will be deleted after processing)
        import tempfile
        import uuid
        temp_file_path = os.path.join(tempfile.gettempdir(), f"temp_{uuid.uuid4()}.py")
        
        # Write to temporary file for parsing
        with open(temp_file_path, "w", encoding="utf-8") as f:
            f.write(content_str)

        try:
            # Analyze file structure using the parser
            structure = code_parser.parse_file(temp_file_path)
            processed = True
        except Exception as e:
            logger.error(f"Error parsing file: {str(e)}")
            # Create minimal structure on parsing failure
            structure = {
                "file_name": safe_filename,
                "error": f"Error parsing file: {str(e)}",
                "classes": [],
                "functions": [],
            }
            processed = False

        # Create file document - store content in database, no file_path
        file_doc = FileModel(
            project_id=project_id_obj,
            file_name=safe_filename,
            content=content_str,  # Store content in database
            content_type=file.content_type,
            size=len(content),
            processed=processed,
            structure=(
                structure
                if isinstance(structure, dict)
                else (
                    structure.model_dump()
                    if hasattr(structure, "model_dump")
                    else structure.dict() if hasattr(structure, "dict") else None
                )
            ),
            # Remove file_path - not storing on disk
        )

        # Database operations with transaction fallback
        created_file = None
        async with get_transaction_session(f"Upload file {safe_filename} to project {project_id}") as session:
            # Save to database with or without transaction
            if session:
                # With transaction
                result = await db.files.insert_one(
                    file_doc.model_dump(by_alias=True), 
                    session=session
                )

                # Get the created file within the transaction
                created_file = await db.files.find_one(
                    {"_id": result.inserted_id},
                    session=session
                )
                
                # Update project stats in the same transaction
                await db.projects.update_one(
                    {"_id": project_id_obj},
                    {
                        "$inc": {"file_count": 1},
                        "$set": {"updated_at": datetime.now(timezone.utc)},
                    },
                    session=session
                )
            else:
                # Without transaction - operations are not atomic
                result = await db.files.insert_one(
                    file_doc.model_dump(by_alias=True)
                )
                
                # Get the created file outside transaction
                created_file = await db.files.find_one(
                    {"_id": result.inserted_id}
                )
                
                # Update project stats as a separate operation
                await db.projects.update_one(
                    {"_id": project_id_obj},
                    {
                        "$inc": {"file_count": 1},
                        "$set": {"updated_at": datetime.now(timezone.utc)},
                    }
                )
            
            if not created_file:
                raise HTTPException(status_code=500, detail="Failed to create file record")

        # Prepare response outside transaction
        logger.info(f"Successfully uploaded file {safe_filename} to project {project_id} (database-only)")
        
        return create_document_model(FileResponseModel, created_file)

    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
    finally:
        # Always clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as cleanup_e:
                logger.warning(f"Could not clean up temp file {temp_file_path}: {str(cleanup_e)}")

async def get_project_files(
    project_id: str, skip: int = 0, limit: int = 100, db=Depends(get_db)
):
    """Get all files in a project."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    project_id_obj = ObjectId(project_id)

    try:

        # Check if project exists
        project = await db.projects.find_one({"_id": project_id_obj})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Query files
        files = (
            await db.files.find({"project_id": project_id_obj})
            .skip(skip)
            .limit(limit)
            .to_list(length=limit)
        )

        # Convert to response models
        response_files = []
        for file in files:
            try:
                file = prepare_document_for_response(file)

                # Create response model
                response_files.append(FileResponseModel(**file))
            except Exception as e:
                logger.warning(f"Skipping malformed file document {file.get('_id')}: {str(e)}")
                continue

        return response_files
    except HTTPException as http_ex:
        # Re-raise HTTP exceptions directly
        raise http_ex
    except Exception as e:
        logger.error(f"Error in get_project_files: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


async def get_file(file_id: str, db=Depends(get_db)):
    """Get a file by ID."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")
    
    try:
        file = await db.files.find_one({"_id": ObjectId(file_id)})
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
            
        return create_document_model(FileResponseModel, file)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error retrieving file: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving file")

async def get_file_structure(
    file_id: str,
    include_code: bool = False,
    use_default_exclusions: bool = True,
    db=Depends(get_db),
):
    """Get the structure of a file from database content."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")

    try:
        file = await db.files.find_one({"_id": ObjectId(file_id)})
        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        # Get exclusions 
        file_exclusions = file.get("excluded_classes", [])
        function_exclusions = file.get("excluded_functions", [])

        # Return structure if available, or parse from content if not processed yet
        if file.get("processed") and file.get("structure"):
            try:
                structure = FileStructure.model_validate(file["structure"])

                # Remove code fields if not requested
                if not include_code:
                    for cls in getattr(structure, "classes", []):
                        if hasattr(cls, "code"):
                            cls.code = None
                        for method in getattr(cls, "methods", []):
                            if hasattr(method, "code"):
                                method.code = None
                    for func in getattr(structure, "functions", []):
                        if hasattr(func, "code"):
                            func.code = None

                # Apply exclusions to cached structure
                structure = apply_exclusions_to_structure(
                    structure, file_exclusions, function_exclusions, use_default_exclusions
                )

                return structure
            except Exception as e:
                logger.error(f"Error validating file structure: {str(e)}")
                raise HTTPException(status_code=500, detail="Invalid file structure format")

        # If file exists but structure not processed, parse from content
        content = file.get("content")
        if content:
            # Create temporary file for parsing
            import tempfile
            import uuid
            temp_file_path = os.path.join(tempfile.gettempdir(), f"temp_{uuid.uuid4()}.py")
            
            try:
                # Write content to temporary file
                with open(temp_file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                
                # Parse structure
                structure = code_parser.parse_file(temp_file_path)

                # Prepare structure for database
                structure_data = structure
                if not isinstance(structure, dict):
                    if hasattr(structure, "model_dump"):
                        structure_data = structure.model_dump()
                    elif hasattr(structure, "dict"):
                        structure_data = structure.dict()

                # Update the file with structure
                async with get_transaction_session(f"Update file structure for {file_id}") as session:
                    if session:
                        await db.files.update_one(
                            {"_id": ObjectId(file_id)},
                            {"$set": {"structure": structure_data, "processed": True}},
                            session=session
                        )
                    else:
                        await db.files.update_one(
                            {"_id": ObjectId(file_id)},
                            {"$set": {"structure": structure_data, "processed": True}}
                        )

                # Apply exclusions
                structure = apply_exclusions_to_structure(
                    structure, file_exclusions, function_exclusions, use_default_exclusions
                )

                return structure
            finally:
                # Clean up temporary file
                if os.path.exists(temp_file_path):
                    try:
                        os.remove(temp_file_path)
                    except:
                        pass
        else:
            raise HTTPException(status_code=404, detail="File content not found")
            
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error getting file structure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving file structure: {str(e)}")

async def get_file_content(file_id: str, db=Depends(get_db)):
    """Get the content of a file from database."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")

    try:
        file = await db.files.find_one({"_id": ObjectId(file_id)})
        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        # Get content from database instead of file system
        content = file.get("content")
        if content is None:
            raise HTTPException(status_code=404, detail="File content not available")

        return create_document_model(FileContentResponse, {
            "file_id": file_id,
            "file_name": file["file_name"],
            "content": content,
            "size": file["size"],
            "content_type": file["content_type"],
        })
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error reading file content: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error reading file content: {str(e)}"
        )

async def delete_file(file_id: str, db=Depends(get_db)):
    """Delete a file - database-only storage version."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")

    # Get file details before deletion (outside transaction)
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Remember file data for response
    file_name = file.get("file_name")
    project_id = file.get("project_id")
    
    try:
        # Use transaction for database operations with fallback
        async with get_transaction_session(f"Delete file {file_id}") as session:
            if session:
                # With transaction
                # Delete the file document from database
                result = await db.files.delete_one(
                    {"_id": ObjectId(file_id)},
                    session=session
                )
                
                if result.deleted_count == 0:
                    raise HTTPException(
                        status_code=500, detail="Failed to delete file from database"
                    )
                    
                # Update project stats in the same transaction
                if project_id:
                    await db.projects.update_one(
                        {"_id": project_id},
                        {
                            "$inc": {"file_count": -1},
                            "$set": {"updated_at": datetime.now(timezone.utc)}
                        },
                        session=session
                    )
            else:
                # Without transaction - operations are not atomic
                # Delete the file document from database
                result = await db.files.delete_one(
                    {"_id": ObjectId(file_id)}
                )
                
                if result.deleted_count == 0:
                    raise HTTPException(
                        status_code=500, detail="Failed to delete file from database"
                    )
                    
                # Update project stats as a separate operation
                if project_id:
                    await db.projects.update_one(
                        {"_id": project_id},
                        {
                            "$inc": {"file_count": -1},
                            "$set": {"updated_at": datetime.now(timezone.utc)}
                        }
                    )
        
        # No file system cleanup needed for database-only storage
        
        logger.info(f"Successfully deleted file {file_name} (ID: {file_id})")
        return FileBasicResponse(
            success=True,
            message=f"File {file_name} deleted successfully",
            file_id=file_id
        )
            
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")


async def set_file_exclusions(
    file_id: str, exclusions: FileExclusions, db=Depends(get_db)
):
    """
    Set classes and functions to exclude from documentation for a specific file.
    Uses transactions for consistency.
    """
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")

    if exclusions is None:
        raise HTTPException(status_code=400, detail="Exclusions object cannot be null")
    
    try:
        # Use transaction for updating exclusions with fallback
        async with get_transaction_session(f"Update file exclusions for {file_id}") as session:
            if session:
                # With transaction
                # Check if file exists within transaction
                file = await db.files.find_one({"_id": ObjectId(file_id)}, session=session)
                if not file:
                    raise HTTPException(status_code=404, detail="File not found")

                # Update exclusions within transaction
                result = await db.files.update_one(
                    {"_id": ObjectId(file_id)},
                    {
                        "$set": {
                            "excluded_classes": exclusions.excluded_classes,
                            "excluded_functions": exclusions.excluded_functions,
                            "updated_at": datetime.now(timezone.utc),
                        }
                    },
                    session=session
                )
            else:
                # Without transaction
                # Check if file exists
                file = await db.files.find_one({"_id": ObjectId(file_id)})
                if not file:
                    raise HTTPException(status_code=404, detail="File not found")

                # Update exclusions as a separate operation
                result = await db.files.update_one(
                    {"_id": ObjectId(file_id)},
                    {
                        "$set": {
                            "excluded_classes": exclusions.excluded_classes,
                            "excluded_functions": exclusions.excluded_functions,
                            "updated_at": datetime.now(timezone.utc),
                        }
                    }
                )
            
            if result.modified_count == 0:
                logger.warning(f"No changes made to exclusions for file {file_id}")
                
        logger.info(f"Updated exclusions for file {file_id}")
        return ExclusionResponse(
            success=True,
            message="Exclusions updated successfully",
        )
    
    except HTTPException as http_ex:
        # Re-raise HTTP exceptions directly
        raise http_ex
    except Exception as e:
        logger.error(f"Error setting file exclusions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating exclusions: {str(e)}")

async def get_file_exclusions(file_id: str, db=Depends(get_db)):
    """
    Get current exclusions for a file.

    Args:
        file_id: The ID of the file
        db: Database connection
    """
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")

    try:
        file = await db.files.find_one({"_id": ObjectId(file_id)})
        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        return FileExclusions(
            file_id=str(file["_id"]),
            excluded_classes=file.get("excluded_classes", []),
            excluded_functions=file.get("excluded_functions", []),
        )
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error retrieving file exclusions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving file exclusions: {str(e)}")

