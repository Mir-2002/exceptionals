import os
import zipfile
import tempfile
import shutil
from fastapi import UploadFile, HTTPException
from pathlib import Path
from typing import List, Dict, Any, Tuple
from utils.parser import CodeParserService

# Configuration
MAX_ZIP_SIZE = 100 * 1024 * 1024  # 100MB limit
ALLOWED_EXTENSIONS = {".py", ".txt", ".md", ".json", ".yaml", ".yml"}  # Add more as needed

async def extract_and_process_zip(
    zip_file: UploadFile, 
    project_id: str,
    project_dir: str
) -> List[Dict[str, Any]]:
    """
    Extract a ZIP file and process its contents.
    
    Args:
        zip_file: The uploaded ZIP file
        project_id: The ID of the project the files belong to
        project_dir: The directory where project files should be stored
    
    Returns:
        List of file metadata dictionaries for database insertion
    """
    # Validate zip file
    if not zip_file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only ZIP files are accepted")
    
    # Create project directory if it doesn't exist
    os.makedirs(project_dir, exist_ok=True)
    
    # Process the zip file
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Read the content and save to temp file
            content = await zip_file.read()
            
            # Check size
            if len(content) > MAX_ZIP_SIZE:
                raise HTTPException(
                    status_code=400, 
                    detail=f"ZIP file too large. Maximum size is {MAX_ZIP_SIZE/1024/1024}MB"
                )
            
            # Save to temp file
            temp_zip_path = os.path.join(temp_dir, "upload.zip")
            with open(temp_zip_path, "wb") as f:
                f.write(content)
            
            # Check if file is a valid zip
            if not is_valid_zip(temp_zip_path):
                raise HTTPException(status_code=400, detail="Invalid or corrupted ZIP file")
                
            # Extract with directory structure preserved
            extract_dir = os.path.join(temp_dir, "extracted")
            os.makedirs(extract_dir, exist_ok=True)
            
            with zipfile.ZipFile(temp_zip_path, 'r') as zip_ref:
                # Check for malicious paths (path traversal protection)
                for zip_info in zip_ref.infolist():
                    if zip_info.filename.startswith('/') or '..' in zip_info.filename:
                        raise HTTPException(
                            status_code=400, 
                            detail="ZIP contains invalid paths. Security violation detected."
                        )
                
                # Extract the zip
                zip_ref.extractall(extract_dir)
            
            # Process extracted files and build metadata
            file_metadata_list = process_extracted_files(extract_dir, project_dir, project_id)
            
            return file_metadata_list
            
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="Invalid ZIP file format")
        except Exception as e:
            # Log the exception
            print(f"Error processing ZIP file: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to process ZIP file: {str(e)}")

def is_valid_zip(file_path: str) -> bool:
    """Check if a file is a valid ZIP file."""
    try:
        with zipfile.ZipFile(file_path, 'r') as zf:
            return True
    except zipfile.BadZipFile:
        return False

def process_extracted_files(
    extract_dir: str, 
    project_dir: str, 
    project_id: str
) -> List[Dict[str, Any]]:
    """
    Process extracted files, copy to project directory, and generate metadata.
    
    Args:
        extract_dir: The directory where files were extracted
        project_dir: The destination project directory 
        project_id: The ID of the project
    
    Returns:
        List of file metadata dictionaries for database insertion
    """
    file_metadata_list = []
    root_dir = find_project_root(extract_dir)
    
    # Initialize the parser service
    parser_service = CodeParserService()
    
    # Walk through the extracted directory structure
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            file_path = os.path.join(root, file)
            
            # Skip files we don't want to process
            file_ext = os.path.splitext(file)[1].lower()
            if file_ext not in ALLOWED_EXTENSIONS:
                continue
                
            # Get the relative path from extraction root
            rel_path = os.path.relpath(file_path, root_dir)
            
            # Create destination path
            dest_path = os.path.join(project_dir, rel_path)
            dest_dir = os.path.dirname(dest_path)
            
            # Create necessary directories
            os.makedirs(dest_dir, exist_ok=True)
            
            # Copy file to project directory
            shutil.copy2(file_path, dest_path)
            
            # Process file content and structure if it's a Python file
            with open(file_path, 'rb') as f:
                content = f.read()
                
            is_python = file.endswith('.py')
            structure = None
            processed = False
            
            if is_python:
                try:
                    # Use the proper parser service instead of the non-existent parse_python_file function
                    structure = parser_service.parse_file(dest_path)
                    processed = True if structure and not structure.get("error") else False
                except UnicodeDecodeError:
                    # Not a text file or not UTF-8 encoded
                    processed = False
                except Exception as e:
                    print(f"Error parsing file {dest_path}: {str(e)}")
                    processed = False
            
            # Create metadata
            metadata = {
                "project_id": project_id,
                "file_name": file,
                "file_path": dest_path,
                "relative_path": rel_path,
                "content_type": "text/x-python" if is_python else "application/octet-stream",
                "size": len(content),
                "processed": processed,
                "structure": structure
            }
            
            file_metadata_list.append(metadata)
            
    return file_metadata_list

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
    if len(items) == 1 and os.path.isdir(os.path.join(extract_dir, items[0])):
        potential_root = os.path.join(extract_dir, items[0])
        
        # Check if this directory has python files or subdirectories
        has_py_files = False
        for root, _, files in os.walk(potential_root):
            if any(file.endswith('.py') for file in files):
                has_py_files = True
                break
                
        if has_py_files:
            root_dir = potential_root
    
    return root_dir