from datetime import datetime, timezone
import asyncio
import logging
import os
import json
from fastapi import HTTPException, Depends
from model.Documentation import (
    DocstringRequest,
    DocstringResponse,
    FileDocumentationRequest,
    FileDocumentationResponse,
    ProjectDocumentationRequest,
    ProjectDocumentationResponse,
    DocumentedItem
)
from controller.ProjectController import (
    DEFAULT_EXCLUDED_FILES,
    DEFAULT_EXCLUDED_FOLDERS, 
    DEFAULT_EXCLUDED_FUNCTIONS,
    DEFAULT_EXCLUDED_CLASSES,
    matches_pattern,
    normalize_path
)
from utils.db import get_db, get_transaction_session
from utils.document_helper import prepare_document_for_response, create_document_model
from bson import ObjectId
import httpx
from typing import Optional, List
from dotenv import load_dotenv
from utils.parser import CodeParserService
import json


load_dotenv()

logger = logging.getLogger(__name__)

HUGGINGFACE_ENDPOINT = os.getenv('HUGGINGFACE_ENDPOINT')
HUGGINGFACE_TOKEN = os.getenv('HUGGINGFACE_TOKEN')

code_parser = CodeParserService()

# Retry configuration for cold start handling
MAX_RETRIES = 10  # Increased to 10 attempts
INITIAL_RETRY_DELAY = 10.0  # Constant 10 seconds
MAX_RETRY_DELAY = 10.0  # Keep it constant at 10 seconds
COLD_START_TIMEOUT = 180  # Increase total timeout to 3 minutes

def is_file_excluded(file_doc: dict, project_exclusions: dict, use_defaults: bool = True) -> bool:
    """Check if a file should be excluded from documentation."""
    file_name = file_doc.get("file_name", "")
    relative_path = file_doc.get("relative_path", file_name)
    
    # Debug logging
    logger.debug(f"Checking exclusion for file: {file_name}, relative_path: {relative_path}")
    logger.debug(f"Project exclusions: {project_exclusions}")
    
    # Normalize the path using existing function
    normalized_path = normalize_path(relative_path)
    normalized_file_name = normalize_path(file_name)
    
    # Check project-level file exclusions
    excluded_files = project_exclusions.get("excluded_files", [])
    normalized_excluded_files = [normalize_path(f) for f in excluded_files]
    
    logger.debug(f"Normalized excluded files: {normalized_excluded_files}")
    logger.debug(f"Checking against normalized_path: '{normalized_path}' and normalized_file_name: '{normalized_file_name}'")
    
    # Check both full path and just filename
    if normalized_path in normalized_excluded_files or normalized_file_name in normalized_excluded_files:
        logger.info(f"File {file_name} excluded by project file exclusions")
        return True
    
    # Also check the original filename without normalization (for exact matches)
    if file_name in excluded_files:
        logger.info(f"File {file_name} excluded by direct filename match")
        return True
    
    # Check if file is in an excluded directory
    excluded_dirs = project_exclusions.get("excluded_directories", [])
    normalized_excluded_dirs = [normalize_path(d) for d in excluded_dirs]
    
    for excluded_dir in normalized_excluded_dirs:
        if normalized_path.startswith(f"{excluded_dir}/") or normalized_path == excluded_dir:
            logger.info(f"File {file_name} excluded by directory exclusion: {excluded_dir}")
            return True
    
    # Check default exclusions if enabled (use existing defaults)
    if use_defaults:
        # Use existing DEFAULT_EXCLUDED_FILES from ProjectController
        if matches_pattern(file_name, DEFAULT_EXCLUDED_FILES):
            logger.info(f"File {file_name} excluded by default file patterns")
            return True
        
        # Check if file is in a default excluded directory
        path_parts = normalized_path.split("/")
        for part in path_parts[:-1]:  # Exclude the filename itself
            if matches_pattern(part, DEFAULT_EXCLUDED_FOLDERS):
                logger.info(f"File {file_name} excluded by default directory pattern: {part}")
                return True
    
    logger.debug(f"File {file_name} NOT excluded")
    return False

def is_code_item_excluded(item_name: str, item_type: str, file_exclusions: dict, use_defaults: bool = True) -> bool:
    """Check if a function/class should be excluded from documentation."""
    
    # Check file-level exclusions
    if item_type == "function" or item_type == "method":
        excluded_functions = file_exclusions.get("excluded_functions", [])
        if item_name in excluded_functions:
            logger.debug(f"{item_type.title()} {item_name} excluded by file exclusions")
            return True
    
    if item_type == "class":
        excluded_classes = file_exclusions.get("excluded_classes", [])
        if item_name in excluded_classes:
            logger.debug(f"Class {item_name} excluded by file exclusions")
            return True
    
    # Check default exclusions if enabled (use existing defaults)
    if use_defaults:
        if item_type in ["function", "method"]:
            if matches_pattern(item_name, DEFAULT_EXCLUDED_FUNCTIONS):
                logger.debug(f"{item_type.title()} {item_name} excluded by default patterns")
                return True
        
        if item_type == "class":
            if matches_pattern(item_name, DEFAULT_EXCLUDED_CLASSES):
                logger.debug(f"Class {item_name} excluded by default patterns")
                return True
    
    return False


async def generate_docstring_for_code(request: DocstringRequest) -> DocstringResponse:
    """Generate a docstring for a code snippet using HF model with cold start handling."""
    
    if not HUGGINGFACE_ENDPOINT or not HUGGINGFACE_TOKEN:
        raise HTTPException(
            status_code=500, 
            detail="HuggingFace configuration not found"
        )
    
    if not request.code or not request.code.strip():
        raise HTTPException(
            status_code=400, 
            detail="Code cannot be empty"
        )
    
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Simplified payload - let handler.py handle hyperparameters
    payload = {
        "inputs": request.code
    }
    
    # Implement retry logic with constant delay
    retry_delay = INITIAL_RETRY_DELAY  # Constant 10 seconds
    last_error = None
    
    async with httpx.AsyncClient(timeout=COLD_START_TIMEOUT) as client:
        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"HuggingFace request attempt {attempt + 1}/{MAX_RETRIES}")
                
                response = await client.post(
                    HUGGINGFACE_ENDPOINT,
                    headers=headers,
                    json=payload
                )
                
                # Handle different response scenarios
                if response.status_code == 200:
                    try:
                        result = response.json()
                        
                        # Check if model is still loading (empty response or loading message)
                        if not result or (isinstance(result, list) and len(result) == 0):
                            logger.warning(f"Empty response from HuggingFace (attempt {attempt + 1}), model may be loading")
                            if attempt < MAX_RETRIES - 1:
                                logger.info(f"Waiting {retry_delay} seconds before next attempt...")
                                await asyncio.sleep(retry_delay)
                                continue
                            else:
                                raise HTTPException(
                                    status_code=503,
                                    detail="Model is loading. Please try again in a few moments."
                                )
                        
                        # Check for loading status in response
                        if isinstance(result, dict) and result.get("error") and "loading" in str(result.get("error")).lower():
                            logger.warning(f"Model loading detected (attempt {attempt + 1}): {result.get('error')}")
                            if attempt < MAX_RETRIES - 1:
                                logger.info(f"Waiting {retry_delay} seconds before next attempt...")
                                await asyncio.sleep(retry_delay)
                                continue
                            else:
                                raise HTTPException(
                                    status_code=503,
                                    detail="Model is loading. Please try again in a few moments."
                                )
                        
                        # Extract generated text - simplified since handler.py processes the response
                        generated_text = ""
                        if isinstance(result, list) and len(result) > 0:
                            generated_text = result[0].get("generated_text", str(result[0])).strip()
                        elif isinstance(result, dict):
                            generated_text = result.get("generated_text", str(result)).strip()
                        else:
                            generated_text = str(result).strip()
                        
                        if not generated_text:
                            logger.warning(f"No generated text in response (attempt {attempt + 1})")
                            if attempt < MAX_RETRIES - 1:
                                logger.info(f"Waiting {retry_delay} seconds before next attempt...")
                                await asyncio.sleep(retry_delay)
                                continue
                            else:
                                generated_text = generate_fallback_docstring(request.code)
                        
                        # Clean up the generated docstring
                        generated_docstring = clean_generated_docstring(generated_text, request.code)
                        
                        logger.info(f"✅ Successfully generated docstring after {attempt + 1} attempts")
                        return DocstringResponse(
                            original_code=request.code,
                            generated_docstring=generated_docstring,
                            success=True
                        )
                        
                    except Exception as e:
                        logger.error(f"Error parsing HuggingFace response (attempt {attempt + 1}): {str(e)}")
                        last_error = e
                        
                elif response.status_code == 503:
                    # Service unavailable - model is loading
                    error_text = response.text
                    logger.warning(f"HuggingFace service unavailable (attempt {attempt + 1}): {error_text}")
                    
                    if "loading" in error_text.lower() or "model" in error_text.lower():
                        if attempt < MAX_RETRIES - 1:
                            logger.info(f"Model is loading, waiting {retry_delay} seconds before retry")
                            await asyncio.sleep(retry_delay)
                            continue
                        else:
                            raise HTTPException(
                                status_code=503,
                                detail="Model is still loading after multiple attempts. Please try again later."
                            )
                    else:
                        raise HTTPException(
                            status_code=503,
                            detail=f"HuggingFace service unavailable: {error_text}"
                        )
                        
                else:
                    # Other HTTP errors
                    error_text = response.text
                    logger.error(f"HuggingFace API error (attempt {attempt + 1}): {response.status_code} - {error_text}")
                    
                    if attempt < MAX_RETRIES - 1 and response.status_code in [429, 502, 503, 504]:
                        # Retry for rate limits and server errors
                        logger.info(f"Retrying in {retry_delay} seconds...")
                        await asyncio.sleep(retry_delay)
                        continue
                    else:
                        raise HTTPException(
                            status_code=response.status_code,
                            detail=f"HuggingFace API error: {error_text}"
                        )
                        
            except httpx.TimeoutException:
                logger.warning(f"Request timeout (attempt {attempt + 1})")
                last_error = "Request timeout"
                if attempt < MAX_RETRIES - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    await asyncio.sleep(retry_delay)
                    continue
                    
            except httpx.RequestError as e:
                logger.error(f"Request error (attempt {attempt + 1}): {str(e)}")
                last_error = str(e)
                if attempt < MAX_RETRIES - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    await asyncio.sleep(retry_delay)
                    continue
                    
            except Exception as e:
                logger.error(f"Unexpected error (attempt {attempt + 1}): {str(e)}")
                last_error = str(e)
                if attempt < MAX_RETRIES - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    await asyncio.sleep(retry_delay)
                    continue
                else:
                    break
    
    # If we get here, all retries failed
    logger.error(f"❌ All {MAX_RETRIES} attempts failed. Last error: {last_error}")
    
    # Return a fallback response instead of failing completely
    fallback_docstring = generate_fallback_docstring(request.code)
    
    return DocstringResponse(
        original_code=request.code,
        generated_docstring=fallback_docstring,
        success=False,
        message=f"HuggingFace model unavailable after {MAX_RETRIES} attempts. Generated fallback docstring."
    )

def clean_generated_docstring(generated_text: str, original_code: str) -> str:
    """Clean up the generated docstring."""
    if not generated_text:
        return generate_fallback_docstring(original_code)
    
    # Remove input code if it's repeated in the response
    if original_code in generated_text:
        generated_text = generated_text.replace(original_code, '').strip()
    
    # Remove any prefix text before the actual docstring
    lines = generated_text.split('\n')
    docstring_start = -1
    
    for i, line in enumerate(lines):
        if '"""' in line or "'''" in line:
            docstring_start = i
            break
    
    if docstring_start >= 0:
        docstring_lines = lines[docstring_start:]
        cleaned = '\n'.join(docstring_lines).strip()
    else:
        # If no triple quotes found, wrap the content
        cleaned = f'"""{generated_text.strip()}"""'
    
    # Ensure proper docstring format
    if not cleaned.startswith('"""') and not cleaned.startswith("'''"):
        cleaned = f'"""{cleaned}"""'
    
    return cleaned

def generate_fallback_docstring(code: str) -> str:
    """Generate a basic fallback docstring when AI generation fails."""
    try:
        lines = code.strip().split('\n')
        first_line = lines[0].strip()
        
        if first_line.startswith('def '):
            # Function
            func_name = first_line.split('(')[0].replace('def ', '').strip()
            return f'"""{func_name.replace("_", " ").title()} function."""'
        elif first_line.startswith('class '):
            # Class
            class_name = first_line.split('(')[0].replace('class ', '').replace(':', '').strip()
            return f'"""{class_name} class."""'
        else:
            return '"""Code documentation."""'
    except:
        return '"""Generated documentation."""'

async def document_file_functions(
    file_id: str, 
    options: Optional[FileDocumentationRequest] = None,
    db = Depends(get_db)
) -> FileDocumentationResponse:
    """Generate documentation for all functions/classes in a file, respecting exclusions."""
    
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")
    
    if options is None:
        options = FileDocumentationRequest()
    
    try:
        # Get file info from database
        file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
        if not file_doc:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check if documentation already exists
        existing_docs = await db.file_documentation.find_one({
            "file_id": ObjectId(file_id)
        })
        
        if existing_docs and not getattr(options, 'regenerate', False):
            # Return existing documentation
            logger.info(f"Returning existing documentation for file {file_id}")
            documented_items = []
            for item in existing_docs.get("documentation_items", []):
                documented_items.append(DocumentedItem(
                    type=item.get("item_type", "unknown"),
                    name=item.get("item_name", ""),
                    original_code=item.get("original_code", ""),
                    generated_docstring=item.get("generated_docstring", "")
                ))
            
            return FileDocumentationResponse(
                file_name=file_doc["file_name"],
                documented_items=documented_items,
                total_items=existing_docs.get("total_items", len(documented_items)),
                success=True,
                message="Retrieved existing documentation"
            )
        
        # Check if file is processed
        if not file_doc.get("processed", False):
            raise HTTPException(
                status_code=400, 
                detail="File must be processed before documentation can be generated"
            )
        
        # Get file structure and exclusions from database
        structure = file_doc.get("structure", {})
        file_exclusions = {
            "excluded_classes": file_doc.get("excluded_classes", []),
            "excluded_functions": file_doc.get("excluded_functions", [])
        }
        
        if not structure:
            raise HTTPException(
                status_code=400, 
                detail="File structure not available. Please reprocess the file."
            )
        
        documented_items = []
        documentation_items = []  # For database storage
        success_count = 0
        total_count = 0
        excluded_count = 0
        
        # Process functions with exclusion checks
        for func in structure.get("functions", []):
            # Check if function should be excluded using existing defaults
            if is_code_item_excluded(func["name"], "function", file_exclusions, use_defaults=True):
                logger.debug(f"Skipping excluded function: {func['name']}")
                excluded_count += 1
                continue
            
            # Check include_private option
            if not getattr(options, 'include_private', False) and func["name"].startswith("_"):
                logger.debug(f"Skipping private function: {func['name']}")
                excluded_count += 1
                continue
            
            total_count += 1
            try:
                # Generate docstring for this function
                func_code = func.get("code", "")
                if not func_code:
                    content = file_doc.get("content", "")
                    lines = content.split('\n')
                    start_line = func.get("line", 1) - 1
                    end_line = func.get("end_line", start_line + 1)
                    func_code = '\n'.join(lines[start_line:end_line])
                
                docstring_req = DocstringRequest(code=func_code)
                docstring_resp = await generate_docstring_for_code(docstring_req)
                
                # Create documentation item for database
                doc_item = {
                    "item_id": str(ObjectId()),
                    "item_type": "function",
                    "item_name": func["name"],
                    "original_code": func_code,
                    "generated_docstring": docstring_resp.generated_docstring,
                    "documented_at": datetime.now(timezone.utc),
                    "generation_success": docstring_resp.success,
                    "ai_model_used": "huggingface",
                    "line_number": func.get("line"),
                    "end_line_number": func.get("end_line")
                }
                documentation_items.append(doc_item)
                
                # Create response item
                documented_items.append(DocumentedItem(
                    type="function",
                    name=func["name"],
                    original_code=func_code,
                    generated_docstring=docstring_resp.generated_docstring
                ))
                
                if docstring_resp.success:
                    success_count += 1
                    
            except Exception as e:
                logger.warning(f"Failed to document function {func['name']}: {str(e)}")
                continue
        
        # Process classes and their methods with exclusion checks
        for cls in structure.get("classes", []):
            # Check if class should be excluded using existing defaults
            if is_code_item_excluded(cls["name"], "class", file_exclusions, use_defaults=True):
                logger.debug(f"Skipping excluded class: {cls['name']}")
                excluded_count += 1
                continue
            
            # Check include_private option
            if not getattr(options, 'include_private', False) and cls["name"].startswith("_"):
                logger.debug(f"Skipping private class: {cls['name']}")
                excluded_count += 1
                continue
            
            total_count += 1
            try:
                # Document class
                cls_code = cls.get("code", "")
                if not cls_code:
                    content = file_doc.get("content", "")
                    lines = content.split('\n')
                    start_line = cls.get("line", 1) - 1
                    end_line = cls.get("end_line", start_line + 1)
                    cls_code = '\n'.join(lines[start_line:end_line])
                
                class_docstring_req = DocstringRequest(code=cls_code)
                class_docstring_resp = await generate_docstring_for_code(class_docstring_req)
                
                # Create documentation item for database
                cls_doc_item = {
                    "item_id": str(ObjectId()),
                    "item_type": "class",
                    "item_name": cls["name"],
                    "original_code": cls_code,
                    "generated_docstring": class_docstring_resp.generated_docstring,
                    "documented_at": datetime.now(timezone.utc),
                    "generation_success": class_docstring_resp.success,
                    "ai_model_used": "huggingface",
                    "line_number": cls.get("line"),
                    "end_line_number": cls.get("end_line")
                }
                documentation_items.append(cls_doc_item)
                
                documented_items.append(DocumentedItem(
                    type="class",
                    name=cls["name"],
                    original_code=cls_code,
                    generated_docstring=class_docstring_resp.generated_docstring
                ))
                
                if class_docstring_resp.success:
                    success_count += 1
                
                # Document methods with exclusion checks
                for method in cls.get("methods", []):
                    method_full_name = f"{cls['name']}.{method['name']}"
                    
                    # Check if method should be excluded using existing defaults
                    if is_code_item_excluded(method_full_name, "method", file_exclusions, use_defaults=True):
                        logger.debug(f"Skipping excluded method: {method_full_name}")
                        excluded_count += 1
                        continue
                    
                    # Check include_private option
                    if not getattr(options, 'include_private', False) and method["name"].startswith("_"):
                        logger.debug(f"Skipping private method: {method_full_name}")
                        excluded_count += 1
                        continue
                    
                    total_count += 1
                    try:
                        method_code = method.get("code", "")
                        if not method_code:
                            content = file_doc.get("content", "")
                            lines = content.split('\n')
                            start_line = method.get("line", 1) - 1
                            end_line = method.get("end_line", start_line + 1)
                            method_code = '\n'.join(lines[start_line:end_line])
                        
                        method_docstring_req = DocstringRequest(code=method_code)
                        method_docstring_resp = await generate_docstring_for_code(method_docstring_req)
                        
                        # Create documentation item for database
                        method_doc_item = {
                            "item_id": str(ObjectId()),
                            "item_type": "method",
                            "item_name": method_full_name,
                            "original_code": method_code,
                            "generated_docstring": method_docstring_resp.generated_docstring,
                            "documented_at": datetime.now(timezone.utc),
                            "generation_success": method_docstring_resp.success,
                            "ai_model_used": "huggingface",
                            "line_number": method.get("line"),
                            "end_line_number": method.get("end_line")
                        }
                        documentation_items.append(method_doc_item)
                        
                        documented_items.append(DocumentedItem(
                            type="method",
                            name=method_full_name,
                            original_code=method_code,
                            generated_docstring=method_docstring_resp.generated_docstring
                        ))
                        
                        if method_docstring_resp.success:
                            success_count += 1
                    except Exception as e:
                        logger.warning(f"Failed to document method {method_full_name}: {str(e)}")
                        continue
                        
            except Exception as e:
                logger.warning(f"Failed to document class {cls['name']}: {str(e)}")
                continue
        
        # Calculate success rate
        success_rate = success_count / total_count if total_count > 0 else 1.0
        
        # Store documentation in database
        file_documentation = {
            "file_id": ObjectId(file_id),
            "project_id": ObjectId(file_doc["project_id"]),
            "file_name": file_doc["file_name"],
            "documentation_items": documentation_items,
            "total_items": len(documentation_items),
            "documented_at": datetime.now(timezone.utc),
            "documentation_complete": True,
            "total_functions": len([item for item in documentation_items if item["item_type"] == "function"]),
            "total_classes": len([item for item in documentation_items if item["item_type"] == "class"]),
            "total_methods": len([item for item in documentation_items if item["item_type"] == "method"]),
            "success_rate": success_rate
        }
        
        # Store in database (replace if exists)
        try:
            await db.file_documentation.replace_one(
                {"file_id": ObjectId(file_id)},
                file_documentation,
                upsert=True
            )
            logger.info(f"Stored detailed documentation in database for file {file_id}")
        except Exception as e:
            logger.warning(f"Failed to store detailed documentation: {str(e)}")
        
        # Update file record
        try:
            file_update = {
                "has_documentation": True,
                "last_documented_at": datetime.now(timezone.utc),
                "documented": True,
                "documented_at": datetime.now(timezone.utc),
                "documented_items_count": len(documentation_items)
            }
            
            await db.files.update_one(
                {"_id": ObjectId(file_id)},
                {"$set": file_update}
            )
        except Exception as e:
            logger.warning(f"Failed to update file documentation status: {str(e)}")
        
        logger.info(f"Generated documentation for {len(documented_items)} items in file {file_id} (excluded {excluded_count} items)")
        
        return FileDocumentationResponse(
            file_name=file_doc["file_name"],
            documented_items=documented_items,
            total_items=len(documented_items),
            success=True,
            message=f"Generated and stored documentation for {len(documented_items)} items (excluded {excluded_count} items)"
        )
        
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error documenting file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File documentation failed: {str(e)}")

# Find this section in your document_project_functions method:

async def document_project_functions(
    project_id: str,
    options: Optional[ProjectDocumentationRequest] = None,
    db = Depends(get_db)
) -> ProjectDocumentationResponse:
    """Generate documentation for all files in a project, respecting exclusions."""
    
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    if options is None:
        options = ProjectDocumentationRequest()
    
    try:
        # Get project info and exclusions
        project_doc = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not project_doc:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get project exclusions using existing structure
        project_exclusions = {
            "excluded_directories": project_doc.get("excluded_directories", []),
            "excluded_files": project_doc.get("excluded_files", [])
        }
        
        logger.info(f"Project exclusions loaded: {project_exclusions}")
        
        # Get files to document
        file_query = {"project_id": ObjectId(project_id), "processed": True}
        
        # Apply file filters if provided
        if hasattr(options, 'file_filters') and options.file_filters:
            file_query["file_name"] = {"$in": options.file_filters}
        
        files = await db.files.find(file_query).to_list(length=None)
        logger.info(f"Found {len(files)} processed files in project")
        
        if not files:
            raise HTTPException(
                status_code=400,
                detail="No processed files found in project"
            )
        
        # Filter files based on exclusions using existing function
        files_to_document = []
        excluded_files_count = 0
        for file_doc in files:
            file_name = file_doc.get('file_name', 'unknown')
            logger.info(f"Checking file: {file_name}")
            
            if not is_file_excluded(file_doc, project_exclusions, use_defaults=True):
                files_to_document.append(file_doc)
                logger.info(f"✅ File {file_name} will be documented")
            else:
                logger.info(f"❌ File {file_name} excluded from documentation")
                excluded_files_count += 1
        
        logger.info(f"Files to document: {len(files_to_document)}, Excluded: {excluded_files_count}")
        
        if not files_to_document:
            raise HTTPException(
                status_code=400,
                detail="All files in project are excluded from documentation"
            )
        
        documented_files = []
        total_items = 0
        
        # Document each non-excluded file
        for file_doc in files_to_document:
            file_id = str(file_doc["_id"])
            
            try:
                # Create file documentation request
                file_options = FileDocumentationRequest(
                    include_private=getattr(options, 'include_private', False),
                    include_examples=True,
                    include_type_hints=True,
                    regenerate=False  # Don't regenerate existing docs in project documentation
                )
                
                # Document this file
                file_response = await document_file_functions(
                    file_id, file_options, db
                )
                
                documented_files.append(file_response)
                total_items += file_response.total_items
                
            except Exception as e:
                logger.warning(f"Failed to document file {file_doc['file_name']}: {str(e)}")
                continue
        
        if not documented_files:
            raise HTTPException(
                status_code=500,
                detail="Failed to document any files in the project"
            )
        
        # Update project documentation status
        try:
            update_data = {
                "project_documented": True,
                "project_documentation_generated_at": datetime.now(timezone.utc),
                "documented_files_count": len(documented_files),
                "total_documented_items": total_items
            }
            
            await db.projects.update_one(
                {"_id": ObjectId(project_id)},
                {"$set": update_data}
            )
        except Exception as e:
            logger.warning(f"Failed to update project documentation status: {str(e)}")
            # Continue anyway
        
        logger.info(f"Generated documentation for {len(documented_files)} files in project {project_id} (excluded {excluded_files_count} files)")
        
        return ProjectDocumentationResponse(
            project_name=project_doc["name"],
            documented_files=documented_files,
            total_files=len(documented_files),
            total_items=total_items,
            success=True,
            message=f"Generated documentation for {len(documented_files)} files with {total_items} total items (excluded {excluded_files_count} files)"
        )
        
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error documenting project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Project documentation failed: {str(e)}")

async def get_file_documentation_data(file_id: str, db) -> dict:
    """Retrieve stored documentation data for a file."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")
    
    try:
        # Get file info
        file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
        if not file_doc:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check if file has documentation
        if not file_doc.get("documented", False):
            raise HTTPException(
                status_code=404, 
                detail="No documentation found for this file. Generate documentation first."
            )
        
        # Get stored documentation from file_documentation collection
        docs = await db.file_documentation.find_one({"file_id": ObjectId(file_id)})
        if not docs:
            # Fallback: return basic info if file is marked as documented but no detailed docs exist
            return {
                "file_name": file_doc["file_name"],
                "documented_items": [],
                "total_items": file_doc.get("documented_items_count", 0),
                "success": True,
                "message": "File is documented but detailed documentation not available"
            }
        
        # Convert stored documentation items to response format
        documented_items = []
        for item in docs.get("documentation_items", []):
            documented_items.append({
                "type": item.get("item_type", "unknown"),
                "name": item.get("item_name", ""),
                "original_code": item.get("original_code", ""),
                "generated_docstring": item.get("generated_docstring", "")
            })

        return {
            "file_name": docs["file_name"],
            "documented_items": documented_items,
            "total_items": docs.get("total_items", len(documented_items)),
            "success": True,
            "message": "Retrieved stored documentation"
        }
        
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error retrieving file documentation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve documentation: {str(e)}")


async def get_project_documentation_data(project_id: str, db) -> dict:
    """Retrieve stored documentation data for all files in a project."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    try:
        # Get project info
        project_doc = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not project_doc:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get all documented files in the project
        files = await db.files.find({
            "project_id": ObjectId(project_id),
            "documented": True
        }).to_list(length=None)
        
        if not files:
            raise HTTPException(
                status_code=404,
                detail="No documented files found in this project"
            )
        
        documented_files = []
        total_items = 0
        
        # Get documentation for each file
        for file_doc in files:
            file_id = file_doc["_id"]
            
            # Get stored documentation
            docs = await db.file_documentation.find_one({"file_id": file_id})
            
            if docs:
                # Convert stored documentation items to response format
                documented_items = []
                for item in docs.get("documentation_items", []):
                    documented_items.append({
                        "type": item.get("item_type", "unknown"),
                        "name": item.get("item_name", ""),
                        "original_code": item.get("original_code", ""),
                        "generated_docstring": item.get("generated_docstring", "")
                    })
                
                file_response = {
                    "file_name": file_doc["file_name"],
                    "documented_items": documented_items,
                    "total_items": len(documented_items),
                    "success": True,
                    "message": "Retrieved stored documentation"
                }
                
                documented_files.append(file_response)
                total_items += len(documented_items)
            else:
                # File is marked as documented but no detailed docs
                file_response = {
                    "file_name": file_doc["file_name"],
                    "documented_items": [],
                    "total_items": file_doc.get("documented_items_count", 0),
                    "success": True,
                    "message": "File documented but details not available"
                }
                documented_files.append(file_response)
        
        return {
            "project_name": project_doc["name"],
            "documented_files": documented_files,
            "total_files": len(documented_files),
            "total_items": total_items,
            "success": True,
            "message": f"Retrieved documentation for {len(documented_files)} files"
        }
        
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error retrieving project documentation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve project documentation: {str(e)}")


async def export_file_documentation_content(file_id: str, format: str, db) -> tuple[str, str, str]:
    """Export file documentation in various formats. Returns (content, media_type, filename)."""
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")
    
    try:
        # Get documentation
        docs = await db.file_documentation.find_one({"file_id": ObjectId(file_id)})
        if not docs:
            raise HTTPException(status_code=404, detail="No documentation found for this file")
        
        if format == "markdown":
            content = generate_markdown_export(docs)
            media_type = "text/markdown"
            filename = f"{docs['file_name']}_documentation.md"
        elif format == "json":
            content = json.dumps(docs, indent=2, default=str)
            media_type = "application/json"
            filename = f"{docs['file_name']}_documentation.json"
        else:  # txt
            content = generate_text_export(docs)
            media_type = "text/plain"
            filename = f"{docs['file_name']}_documentation.txt"
        
        return content, media_type, filename
        
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error exporting documentation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


def generate_markdown_export(docs: dict) -> str:
    """Generate Markdown format export."""
    content = f"# Documentation for {docs['file_name']}\n\n"
    content += f"**Generated on:** {docs.get('documented_at', 'Unknown')}\n"
    content += f"**Total Items:** {docs.get('total_items', 0)}\n\n"
    
    for item in docs.get("documentation_items", []):
        content += f"## {item['item_type'].title()}: {item['item_name']}\n\n"
        content += f"### Original Code\n```python\n{item['original_code']}\n```\n\n"
        content += f"### Generated Documentation\n```python\n{item['generated_docstring']}\n```\n\n"
        content += "---\n\n"
    
    return content


def generate_text_export(docs: dict) -> str:
    """Generate plain text format export."""
    content = f"Documentation for {docs['file_name']}\n"
    content += "=" * 50 + "\n\n"
    content += f"Generated on: {docs.get('documented_at', 'Unknown')}\n"
    content += f"Total Items: {docs.get('total_items', 0)}\n\n"
    
    for item in docs.get("documentation_items", []):
        content += f"{item['item_type'].upper()}: {item['item_name']}\n"
        content += "-" * 30 + "\n"
        content += f"Original Code:\n{item['original_code']}\n\n"
        content += f"Generated Documentation:\n{item['generated_docstring']}\n\n"
        content += "=" * 50 + "\n\n"
    
    return content