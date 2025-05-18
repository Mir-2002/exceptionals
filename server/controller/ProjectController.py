from datetime import datetime, timezone
import fnmatch
import os
from pathlib import Path
from typing import List
from fastapi import Depends, HTTPException, UploadFile
from model.Project import ProjectDeleteResponseModel, ProjectExclusionResponse, ProjectModel, ProjectResponseModel, ProjectUpdateModel, ProjectUpdateResponseModel, ProjectStructureResponseModel
from model.File import FileModel, FileNode, FileResponseModel, FileUploadInfo, FolderNode, ProjectExclusions, ZipUploadResponseModel
from utils.zip_parser import extract_and_process_zip
from utils.db import get_db
from bson import ObjectId



# Default file exclusions
DEFAULT_EXCLUDED_FILES = [
    "setup.py",
    "conftest.py",
    "__init__.py",
    "__main__.py",
    "test_*.py",
    "*_test.py",
]

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

# Configure file storage
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def matches_pattern(name: str, patterns: List[str]) -> bool:
    """Check if a name matches any of the given patterns."""
    return any(fnmatch.fnmatch(name, pattern) for pattern in patterns)

def normalize_path(path: str) -> str:
    """
    Normalize path for consistent storage and comparison.
    
    - Converts backslashes to forward slashes
    - Removes trailing slashes from directories
    """
    return path.replace("\\", "/").rstrip("/")

def prepare_document_for_response(document):
    """
    Convert MongoDB document ObjectIds to strings for API responses.
    
    Args:
        document: MongoDB document or dictionary containing potential ObjectId fields
        
    Returns:
        A copy of the document with ObjectId values converted to strings
    """
    if document is None:
        return None
        
    if isinstance(document, list):
        return [prepare_document_for_response(item) for item in document]
        
    document_copy = document.copy()
    
    # Convert common ObjectId fields
    for field in ["_id", "project_id", "user_id", "file_id"]:
        if field in document_copy and isinstance(document_copy[field], ObjectId):
            document_copy[field] = str(document_copy[field])
    
    # Handle nested dictionaries
    for key, value in document_copy.items():
        if isinstance(value, dict):
            document_copy[key] = prepare_document_for_response(value)
        elif isinstance(value, list) and value and isinstance(value[0], dict):
            document_copy[key] = [prepare_document_for_response(item) for item in value]
            
    return document_copy

async def create(project: ProjectModel, db=Depends(get_db)):
    """
    Create a new project.
    
    Args:
        project (ProjectModel): The project data to create.
        db: The database instance.

    Returns:
        ProjectResponseModel: The created project data with additional information.
    """
    # Check for existing project
    existing_project = await db.projects.find_one({"name": project.name})
    if existing_project:
        raise HTTPException(
            status_code=400,
            detail="Project with this name already exists"
        )
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    try:
        # Insert the project into the database
        project_data = project.model_dump(by_alias=True)
        result = await db.projects.insert_one(project_data)
        
        # Fetch the complete document to ensure consistency
        created_project = await db.projects.find_one({"_id": result.inserted_id})
        if not created_project:
            raise HTTPException(
                status_code=500,
                detail="Project created but could not be retrieved"
            )
        
        prepared_project = prepare_document_for_response(created_project)

        return ProjectResponseModel(
            **prepared_project,
            message="Project created successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {e}")
    
async def get(project_id: str, db=Depends(get_db)):
    """Get a project by ID."""
    # Validate MongoDB ObjectId format
    if not ObjectId.is_valid(project_id):
            raise HTTPException(status_code=404, detail="Invalid project ID format")
        
        # Handle database connection issues
    if db is None:
            raise HTTPException(status_code=500, detail="Database connection error")
    try:
        # Find the project
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        
        # Return 404 if project not found
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        prepared_project = prepare_document_for_response(project)

        return ProjectResponseModel(**prepared_project)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Project not found") 
    
async def update(project_id: str, project_update: ProjectUpdateModel, db=Depends(get_db)):
    """
    Update a project by its ID.
    
    Args:
        project_id (str): The ID of the project to update.
        project_update (ProjectUpdateModel): The updated project data.
        db: The database instance.

    Returns:
        ProjectResponseModel: The updated project data with additional information.
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    try:
        # Fetch the existing project
        existing_project = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not existing_project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Prepare the update data
        update_data = project_update.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No valid fields provided for update"
            )
        
        # Check for name uniqueness if name is being updated
        if "name" in update_data:
            existing_with_name = await db.projects.find_one({
                "name": update_data["name"],
                "_id": {"$ne": ObjectId(project_id)}
            })
            if existing_with_name:
                raise HTTPException(
                    status_code=400,
                    detail="Another project with this name already exists"
                )
        
        # Update the project in the database
        updated_project = await db.projects.find_one_and_update(
            {"_id": ObjectId(project_id)},
            {"$set": update_data},
            return_document=True  # Returns the updated document
        )
        
        if not updated_project:
            raise HTTPException(
                status_code=500,
                detail="Project update failed"
            )
        
        # Get file statistics
        file_count = await db.files.count_documents({"project_id": ObjectId(project_id)})
        processed_files = await db.files.count_documents({
        "project_id": ObjectId(project_id),
        "processed": True
        })

        prepared_project = prepare_document_for_response(updated_project)

        return ProjectUpdateResponseModel(
            **prepared_project,
            file_count=file_count,
            processed_files=processed_files,

            updated_fields=update_data,
            message="Project updated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating project: {e}")
    
async def remove(project_id: str, db=Depends(get_db)):
    """Delete a project by its ID."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    try:
        # Convert to ObjectId for database queries
        project_id_obj = ObjectId(project_id)
        
        # Fetch the existing project
        existing_project = await db.projects.find_one({"_id": project_id_obj})
        if not existing_project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Query files using string format to match how they're stored
        files = await db.files.find({"project_id": project_id}).to_list(length=None)
        
        # Delete the project
        project_result = await db.projects.delete_one({"_id": project_id_obj})
        if project_result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Project deletion failed")
        
        # Delete associated files
        deleted_file_count = 0
        for file in files:
            if "file_path" in file and os.path.exists(file["file_path"]):
                try:
                    os.remove(file["file_path"])
                except Exception as e:
                    print(f"Warning: Could not delete file {file['file_path']}: {e}")
            
            file_result = await db.files.delete_one({"_id": file["_id"]})
            if file_result.deleted_count > 0:
                deleted_file_count += 1
        
        prepared_project = prepare_document_for_response(existing_project)

        return ProjectDeleteResponseModel(
            **prepared_project,
            message=f"Project deleted successfully with {deleted_file_count} files removed"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting project: {e}")
    
async def get_project_structure(
    project_id: str,
    use_default_exclusions: bool = True,
    db=Depends(get_db),
) -> ProjectStructureResponseModel:
    """
    Get the folder structure of a project.

    This builds a tree structure representing folders and files in the project.

    Args:
        project_id: The ID of the project
        db: Database connection

    Returns:
        Tree structure of the project's folders and files
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    # Get project info
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get all files for this project
    files = await db.files.find({"project_id": project_id}).to_list(length=None)

    # Create structure
    root_folder = FolderNode(name="root")

    for file in files:
        # Get relative path or use filename
        path = file.get("relative_path", file["file_name"])
        if not path:
            path = file["file_name"]

        # Split path into parts
        parts = Path(path).parts

        # Navigate/build folder structure
        current_folder = root_folder

        # Handle all directories in the path
        for i, part in enumerate(parts):
            if i == len(parts) - 1:
                # This is the file name
                file_node = FileNode(
                    name=part,
                    size=file["size"],
                    processed=file.get("processed", False),
                    id=str(file["_id"]),
                )
                current_folder.children.append(file_node)
            else:
                # This is a directory
                # Check if it already exists
                found = False
                for child in current_folder.children:
                    if child.name == part and child.type == "folder":
                        current_folder = child
                        found = True
                        break

                if not found:
                    # Create new folder
                    new_folder = FolderNode(name=part)
                    current_folder.children.append(new_folder)
                    current_folder = new_folder

        # Sort folders and files alphabetically

    def sort_nodes(node: FolderNode):
        # Sort children recursively
        for child in node.children:
            if child.type == "folder":
                sort_nodes(child)

        # Sort current level - folders first, then files
        node.children.sort(key=lambda x: (x.type != "folder", x.name.lower()))

    sort_nodes(root_folder)

    # Get exclusions
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    excluded_dirs = project.get("excluded_directories", [])
    excluded_files = project.get("excluded_files", [])

    # Mark excluded folders and files with inheritance and default exclusions

    def mark_exclusions(node, path="", parent_excluded=False):
        # Build path consistently
        if path:
            # Always use forward slashes for consistency
            current_path = f"{path}/{node.name}".replace("\\", "/")
        else:
            current_path = node.name

        # Debug info
        print(f"Checking node: {node.name}, path: {current_path}")

        # INSERT YOUR CODE HERE ↓
        if node.name == "root":
            # Don't check exclusions for the root node
            normalized_path = ""
        else:
            # Remove 'root/' from the path for comparison
            path_without_root = current_path
            if path_without_root.startswith("root/"):
                path_without_root = path_without_root[5:]  # Remove 'root/'
            normalized_path = normalize_path(path_without_root)

        normalized_exclusion_dirs = [normalize_path(d) for d in excluded_dirs]
        normalized_exclusion_files = [normalize_path(f) for f in excluded_files]

        if node.type == "folder":
            # Check for direct exclusion
            direct_exclusion = normalized_path in normalized_exclusion_dirs

            print(f"Comparing: normalized_path='{normalized_path}' with exclusions={normalized_exclusion_dirs}")
            print(f"Direct exclusion result: {direct_exclusion}")

            # Apply default exclusions if enabled
            default_exclusion = False
            if use_default_exclusions:
                default_exclusion = matches_pattern(node.name, DEFAULT_EXCLUDED_FOLDERS)

            node.default_exclusion = default_exclusion
            node.excluded = direct_exclusion or default_exclusion or parent_excluded
            node.inherited_exclusion = parent_excluded and not (
                direct_exclusion or default_exclusion
            )

            # Process children
            for child in node.children:
                mark_exclusions(child, current_path, node.excluded)
        else:
            # This is a file
            direct_exclusion = normalized_path in normalized_exclusion_files

            print(f"Comparing: normalized_path='{normalized_path}' with exclusions={normalized_exclusion_files}")
            print(f"Direct exclusion result: {direct_exclusion}")

            # Apply default exclusions if enabled
            default_exclusion = False
            if use_default_exclusions:
                default_exclusion = matches_pattern(node.name, DEFAULT_EXCLUDED_FILES)

            node.default_exclusion = default_exclusion
            node.excluded = direct_exclusion or default_exclusion or parent_excluded
            node.inherited_exclusion = parent_excluded and not (
                direct_exclusion or default_exclusion
            )

    # Apply exclusions to the tree
    mark_exclusions(root_folder)

    prepared_project = prepare_document_for_response(project)

    # Return the correct structure response
    return ProjectStructureResponseModel(
        project_id=prepared_project["_id"], 
        project_name=prepared_project["name"], 
        root=root_folder
    )

async def set_project_exclusions(
    project_id: str, exclusions: ProjectExclusions, db=Depends(get_db)
):
    """
    Set directories and files to exclude from documentation for a project.

    Args:
        project_id: The ID of the project
        exclusions: Exclusion settings
        db: Database connection
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    
    # Check if project exists
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    normalized_directories = [normalize_path(d) for d in exclusions.excluded_directories]
    normalized_files = [normalize_path(f) for f in exclusions.excluded_files]

    # Update exclusions
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {
            "$set": {
                "excluded_directories": normalized_directories,
                "excluded_files": normalized_files,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return ProjectExclusionResponse(
        success=True,
        message="Exclusions updated successfully",
        project_id=project_id,
    )

async def get_project_exclusions(project_id: str, db=Depends(get_db)):
    """
    Get current exclusions for a project.

    Args:
        project_id: The ID of the project
        db: Database connection
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    prepared_project = prepare_document_for_response(project)

    return ProjectExclusions(
        project_id=prepared_project["_id"],
        excluded_directories=prepared_project.get("excluded_directories", []),
        excluded_files=prepared_project.get("excluded_files", []),
    )

async def upload_project_zip(project_id: str, zip_file: UploadFile, db=Depends(get_db)):
    """
    Upload and extract a ZIP file containing a project structure.

    Args:
        project_id: The project to add files to
        zip_file: The uploaded ZIP file
        db: Database connection

    Returns:
        Dictionary containing upload results
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    # Check if project exists
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate file
    if not zip_file.filename or not zip_file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files are supported")

    # Set up project directory
    project_dir = os.path.join(UPLOAD_DIR, project_id)

    try:
        # Process the ZIP file
        file_metadata_list = await extract_and_process_zip(
            zip_file, project_id, project_dir
        )

        # Insert files into database
        inserted_files = []
        processed_count = 0

        for metadata in file_metadata_list:
            # Create file document
            file_doc = FileModel(**metadata)

            # Save to database
            result = await db.files.insert_one(file_doc.model_dump(by_alias=True))

            # Track processed files
            if metadata["processed"]:
                processed_count += 1

            # Get the created file
            created_file = await db.files.find_one({"_id": result.inserted_id})
            if created_file:
                # Use the helper function instead of manual conversion
                prepared_file = prepare_document_for_response(created_file)
                inserted_files.append(FileResponseModel(**prepared_file))

        # Update project stats
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {
                "$set": {
                    "file_count": len(inserted_files),
                    "processed_files": processed_count,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        return ZipUploadResponseModel(
            message=f"Successfully uploaded and processed {len(inserted_files)} files ({processed_count} Python files processed)",
            processed_count=processed_count,
            total_files=len(inserted_files),
            files=[
                FileUploadInfo(
                    id=str(file.id),
                    file_name=file.file_name,
                    relative_path=getattr(file, "relative_path", file.file_name),
                    size=file.size,
                    processed=file.processed,
                )
                for file in inserted_files
            ],
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing ZIP file: {str(e)}"
        )