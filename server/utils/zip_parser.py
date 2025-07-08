import os
import zipfile
import tempfile
import shutil
import uuid
import logging
from io import BytesIO
from fastapi import UploadFile, HTTPException
from pathlib import Path
from typing import List, Dict, Any, Tuple
from bson import ObjectId
from model.File import FileUploadInfo, FileModel
from utils.parser import CodeParserService

logger = logging.getLogger(__name__)

# Configuration
MAX_ZIP_SIZE = 100 * 1024 * 1024  # 100MB limit
ALLOWED_EXTENSIONS = {".py", ".txt", ".md", ".json", ".yaml", ".yml"}

# Default excluded folders
DEFAULT_EXCLUDED_FOLDERS = [
    "__pycache__",
    ".git",
    ".svn",
    ".hg",
    "node_modules",
    ".pytest_cache",
    ".tox",
    "venv",
    "env",
    ".venv",
    ".env",
    "build",
    "dist",
    "*.egg-info",
    ".idea",
    ".vscode",
    ".DS_Store",
    "Thumbs.db"
]

async def extract_and_process_zip(zip_file: UploadFile, project_id: str, db) -> List[FileUploadInfo]:
    """Extract and process ZIP file - database-only storage."""
    file_metadata_list = []
    temp_dir = None
    
    try:
        # Validate ZIP file size
        zip_content = await zip_file.read()
        if len(zip_content) > MAX_ZIP_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"ZIP file too large. Maximum size is {MAX_ZIP_SIZE/(1024*1024)}MB"
            )
        
        # Create temporary directory for extraction
        temp_dir = os.path.join(tempfile.gettempdir(), f"zip_extract_{uuid.uuid4()}")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Extract ZIP
        with zipfile.ZipFile(BytesIO(zip_content), 'r') as zip_ref:
            # Security check: prevent path traversal attacks
            for member in zip_ref.namelist():
                if os.path.isabs(member) or ".." in member:
                    raise HTTPException(
                        status_code=400, 
                        detail="ZIP file contains unsafe paths"
                    )
            zip_ref.extractall(temp_dir)
        
        # Find the actual project root
        root_dir = find_project_root(temp_dir)
        
        # Initialize parser
        code_parser = CodeParserService()
        
        # Process each Python file
        for root, dirs, files in os.walk(root_dir):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in DEFAULT_EXCLUDED_FOLDERS]
            
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, root_dir)
                    
                    # Skip if file already exists in project
                    existing_file = await db.files.find_one({
                        "project_id": ObjectId(project_id),
                        "file_name": file
                    })
                    
                    if existing_file:
                        logger.warning(f"File {file} already exists in project, skipping")
                        continue
                    
                    try:
                        # Read file content
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        # Validate content size
                        content_size = len(content.encode('utf-8'))
                        if content_size > FileModel.MAX_FILE_SIZE:
                            logger.warning(f"File {file} too large ({content_size} bytes), skipping")
                            continue
                        
                        # Parse structure
                        try:
                            structure = code_parser.parse_file(file_path)
                            processed = True
                        except Exception as parse_error:
                            logger.warning(f"Could not parse {file}: {str(parse_error)}")
                            structure = {
                                "file_name": file,
                                "error": f"Parse error: {str(parse_error)}",
                                "classes": [],
                                "functions": [],
                            }
                            processed = False
                        
                        # Create file document with content in database
                        file_doc = FileModel(
                            project_id=ObjectId(project_id),
                            file_name=file,
                            content=content,  # Store in database
                            content_type="text/x-python",
                            size=content_size,
                            relative_path=relative_path,
                            processed=processed,
                            structure=(
                                structure.model_dump() if hasattr(structure, 'model_dump') 
                                else structure if isinstance(structure, dict)
                                else structure.dict() if hasattr(structure, 'dict')
                                else {}
                            ),
                            # No file_path - database-only storage
                        )
                        
                        # Save to database
                        result = await db.files.insert_one(file_doc.model_dump(by_alias=True))
                        
                        file_metadata_list.append(FileUploadInfo(
                            file_name=file,
                            file_path=relative_path,  # Keep for response info
                            size=content_size,
                            processed=processed,
                        ))
                        
                        logger.info(f"Successfully processed file: {file}")
                        
                    except UnicodeDecodeError:
                        logger.warning(f"File {file} is not valid UTF-8, skipping")
                        continue
                    except Exception as e:
                        logger.error(f"Error processing file {file}: {str(e)}")
                        # Continue with other files
                        continue
        
        if not file_metadata_list:
            raise HTTPException(
                status_code=400,
                detail="No valid Python files found in ZIP archive"
            )
        
        logger.info(f"Successfully processed {len(file_metadata_list)} files from ZIP")
        return file_metadata_list
        
    except HTTPException:
        raise
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file")
    except Exception as e:
        logger.error(f"Error extracting ZIP: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing ZIP file: {str(e)}")
    finally:
        # Clean up temporary directory
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                logger.debug(f"Cleaned up temp directory: {temp_dir}")
            except Exception as cleanup_e:
                logger.warning(f"Could not clean up temp directory {temp_dir}: {str(cleanup_e)}")

def find_project_root(extract_dir: str) -> str:
    """
    Find the actual project root in the extracted directory.
    
    This handles cases where users zip a parent folder containing their project.
    We want to find the most appropriate root directory.
    
    Args:
        extract_dir: The directory where files were extracted
        
    Returns:
        The path to the identified project root
    """
    # Start with the extract directory as the default root
    root_dir = extract_dir
    
    # If there's only one subdirectory and no files at the root level, 
    # consider that subdirectory as the project root
    items = os.listdir(extract_dir)
    
    # Filter out hidden files and directories for evaluation
    visible_items = [item for item in items if not item.startswith('.')]
    
    if len(visible_items) == 1 and os.path.isdir(os.path.join(extract_dir, visible_items[0])):
        potential_root = os.path.join(extract_dir, visible_items[0])
        
        # Check if this directory has python files or subdirectories
        has_py_files = False
        has_subdirs = False
        
        for root, dirs, files in os.walk(potential_root):
            if any(file.endswith('.py') for file in files):
                has_py_files = True
                break
            if dirs:
                has_subdirs = True
                
        # If the subdirectory contains Python files or has a reasonable structure,
        # use it as the root
        if has_py_files or has_subdirs:
            root_dir = potential_root
            logger.info(f"Using subdirectory as project root: {os.path.basename(potential_root)}")
    
    return root_dir

# Remove the old process_extracted_files function since we're using database-only storage