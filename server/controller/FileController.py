"""
TO DO: Further Testing of Project Exclusions
"""


import os
from pathlib import Path
from platform import node
from fastapi import Depends, File, HTTPException, UploadFile
from model.File import (
    FileExclusions,
    FileModel,
    FileNode,
    FileResponseModel,
    FileStructure,
    FileUploadInfo,
    FolderNode,
    ProjectExclusions,
    ProjectStructureResponseModel,
    ZipUploadResponseModel,
)
from utils.db import get_db
from bson import ObjectId
from datetime import datetime, timezone
from utils.parser import CodeParserService
from utils.zip_parser import extract_and_process_zip
from typing import List
import fnmatch

# Configure file storage
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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


def matches_pattern(name: str, patterns: List[str]) -> bool:
    """Check if a name matches any of the given patterns."""
    return any(fnmatch.fnmatch(name, pattern) for pattern in patterns)


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
    if not file.filename or not file.filename.lower().endswith(".py"):
        raise HTTPException(
            status_code=400, detail="Only Python (.py) files are supported"
        )

    # Sanitize filename
    safe_filename = os.path.basename(file.filename)
    if safe_filename != file.filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    # Create project directory if it doesn't exist
    project_dir = os.path.join(UPLOAD_DIR, project_id)
    os.makedirs(project_dir, exist_ok=True)

    # Check for duplicate files
    existing_file = await db.files.find_one(
        {"project_id": project_id, "file_name": safe_filename}
    )

    if existing_file:
        raise HTTPException(
            status_code=409, detail=f"File {safe_filename} already exists"
        )

    # Save file with temporary name first
    temp_file_path = os.path.join(project_dir, f"temp_{datetime.now().timestamp()}.py")
    file_path = os.path.join(project_dir, safe_filename)

    try:
        # Read and save file content
        content = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(content)

        try:
            # Analyze file structure using the parser
            structure = code_parser.parse_file(temp_file_path)
            processed = True
        except Exception as e:
            print(f"Error parsing file: {str(e)}")
            # Create minimal structure on parsing failure
            structure = {
                "file_name": safe_filename,
                "error": f"Error parsing file: {str(e)}",
                "classes": [],
                "functions": [],
            }
            processed = False

        # Rename to final filename
        os.rename(temp_file_path, file_path)

        # Create file document
        file_doc = FileModel(
            project_id=project_id,
            file_name=safe_filename,
            file_path=file_path,
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
                # Convert ObjectId fields to strings
                created_file["_id"] = str(created_file["_id"])
                created_file["project_id"] = str(created_file["project_id"])

                inserted_files.append(FileResponseModel(**created_file))

        # Update project stats
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {
                "$set": {
                    "file_count": len(inserted_files),
                    "processed_files": processed_count,
                    "updated_at": datetime.now(),
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


async def get_project_files(
    project_id: str, skip: int = 0, limit: int = 100, db=Depends(get_db)
):
    """Get all files in a project."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    try:

        # Check if project exists
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Query files
        files = (
            await db.files.find({"project_id": project_id})
            .skip(skip)
            .limit(limit)
            .to_list(length=limit)
        )

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


async def get_file_structure(
    file_id: str,
    include_code: bool = False,
    use_default_exclusions: bool = True,
    db=Depends(get_db),
):
    """Get the structure of a file."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")

    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Get exclusions - moved outside both branches to avoid duplication
    file_exclusions = file.get("excluded_classes", [])
    function_exclusions = file.get("excluded_functions", [])

    # Return structure if available, or parse file if not processed yet
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

            # Apply exclusions to cached structure - THIS IS THE ADDED CODE
            # Mark excluded classes
            for cls in structure.classes:
                # Check direct exclusions
                direct_exclusion = cls.name in file_exclusions

                # Check default exclusions
                default_exclusion = False
                if use_default_exclusions:
                    default_exclusion = matches_pattern(
                        cls.name, DEFAULT_EXCLUDED_CLASSES
                    )

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
                        direct_method_exclusion
                        or default_method_exclusion
                        or cls.excluded
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
                    default_exclusion = matches_pattern(
                        func.name, DEFAULT_EXCLUDED_FUNCTIONS
                    )

                func.excluded = direct_exclusion or default_exclusion
                func.default_exclusion = default_exclusion

            return structure
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
            {"$set": {"structure": structure_data, "processed": True}},
        )

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
                default_exclusion = matches_pattern(
                    func.name, DEFAULT_EXCLUDED_FUNCTIONS
                )

            func.excluded = direct_exclusion or default_exclusion
            func.default_exclusion = default_exclusion

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
            try:
                # Try UTF-8 first
                with open(file["file_path"], "r", encoding="utf-8") as f:
                    content = f.read()
            except UnicodeDecodeError:
                # Fall back to latin-1 if UTF-8 fails
                with open(file["file_path"], "r", encoding="latin-1") as f:
                    content = f.read()

            return {
                "content": content,
                "file_name": file["file_name"],
                "size": file["size"],
                "created_at": file["created_at"],
            }
        else:
            raise HTTPException(status_code=404, detail="File content not found")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error reading file content: {str(e)}"
        )


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
            normalized_path = path_without_root.replace("\\", "/").rstrip("/")

        # Normalize all paths for comparison - always use forward slashes
        normalized_exclusion_dirs = [
            d.replace("\\", "/").rstrip("/") for d in excluded_dirs
        ]
        normalized_exclusion_files = [f.replace("\\", "/") for f in excluded_files]

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

    # Return response model
    return ProjectStructureResponseModel(
        project_id=project_id, project_name=project["name"], root=root_folder
    )


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
            raise HTTPException(
                status_code=500, detail=f"Error deleting file from disk: {str(e)}"
            )

    # Delete from database
    result = await db.files.delete_one({"_id": ObjectId(file_id)})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=500, detail="Failed to delete file from database"
        )

    return {"message": "File deleted successfully", "file_id": file_id}


async def set_file_exclusions(
    file_id: str, exclusions: FileExclusions, db=Depends(get_db)
):
    """
    Set classes and functions to exclude from documentation for a specific file.

    Args:
        file_id: The ID of the file
        exclusions: Exclusion settings
        db: Database connection
    """
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")

    # Check if file exists
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Update exclusions
    await db.files.update_one(
        {"_id": ObjectId(file_id)},
        {
            "$set": {
                "excluded_classes": exclusions.excluded_classes,
                "excluded_functions": exclusions.excluded_functions,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return {"success": True, "message": "Exclusions updated successfully"}


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

    # Update exclusions
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {
            "$set": {
                "excluded_directories": exclusions.excluded_directories,
                "excluded_files": exclusions.excluded_files,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return {"success": True, "message": "Project exclusions updated successfully"}


async def get_file_exclusions(file_id: str, db=Depends(get_db)):
    """
    Get current exclusions for a file.

    Args:
        file_id: The ID of the file
        db: Database connection
    """
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")

    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    return FileExclusions(
        file_id=str(file["_id"]),
        excluded_classes=file.get("excluded_classes", []),
        excluded_functions=file.get("excluded_functions", []),
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

    return ProjectExclusions(
        project_id=str(project["_id"]),
        excluded_directories=project.get("excluded_directories", []),
        excluded_files=project.get("excluded_files", []),
    )
