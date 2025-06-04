from fastapi import HTTPException, BackgroundTasks
from bson import ObjectId
import logging
from datetime import datetime, timezone
import requests
import os
from controller.FileController import get_file_content
from utils.task_queue import get_task_queue, TaskStatus
from utils.ast_enhancer import get_ast_enhancer

# Set up logging
logger = logging.getLogger(__name__)

# Hugging Face API configuration
HF_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")  # Set this in your environment
HF_MODEL_URL = "https://api-inference.huggingface.co/models/Salesforce/codet5p-770m"

async def generate_ast_nlp_docstring(code, element_type=None, element_name=None):
    """
    Generate a docstring for code using Hugging Face CodeT5+ API with AST enhancement.
    
    Args:
        code: Python code to document
        element_type: Optional type of element (function/class)
        element_name: Optional name of specific element
        
    Returns:
        Generated docstring
    """
    try:
        # Get AST enhancer for better context
        ast_enhancer = get_ast_enhancer()
        
        # Prepare code with AST context
        enhanced_data = ast_enhancer.prepare_for_docgen(code, element_type, element_name)
        
        # Generate prompt with AST context
        prompt = ast_enhancer.generate_prompt_with_ast_context(enhanced_data)
        
        # Call Hugging Face API
        docstring = await _call_huggingface_api(prompt)
        
        return {"docstring": docstring}
    except Exception as e:
        logger.error(f"Error generating docstring: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate docstring: {str(e)}")

async def _call_huggingface_api(prompt: str) -> str:
    """Call Hugging Face Inference API for text generation"""
    if not HF_API_TOKEN:
        raise HTTPException(status_code=500, detail="Hugging Face API token not configured")
    
    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 256,
            "temperature": 0.7,
            "do_sample": True,
            "top_p": 0.9
        }
    }
    
    try:
        response = requests.post(HF_MODEL_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        # Handle different response formats
        if isinstance(result, list) and len(result) > 0:
            generated_text = result[0].get("generated_text", "")
        elif isinstance(result, dict):
            generated_text = result.get("generated_text", "")
        else:
            generated_text = str(result)
        
        # Clean up the generated text to extract just the docstring
        return _extract_docstring_from_response(generated_text, prompt)
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Hugging Face API request failed: {str(e)}")
        raise HTTPException(status_code=500, detail="External API request failed")

def _extract_docstring_from_response(generated_text: str, original_prompt: str) -> str:
    """Extract clean docstring from API response"""
    # Remove the original prompt from the response
    if original_prompt in generated_text:
        docstring = generated_text.replace(original_prompt, "").strip()
    else:
        docstring = generated_text.strip()
    
    # Clean up common artifacts
    docstring = docstring.replace("```python", "").replace("```", "")
    
    # If it's too short or empty, provide a fallback
    if len(docstring.strip()) < 10:
        return '"""Auto-generated documentation."""'
    
    return docstring

async def _background_file_documentation(file_id, db, options=None):
    """Background task for generating file documentation"""
    task_queue = get_task_queue()
    task_id = f"doc_{file_id}"
    
    try:
        # Update task status to processing
        task_queue.update_task(task_id, TaskStatus.PROCESSING)
        
        # Check if file exists before attempting to get content
        file_check = await db.files.find_one({"_id": ObjectId(file_id)})
        if not file_check:
            logger.error(f"File {file_id} not found in database during documentation update")
            task_queue.update_task(task_id, TaskStatus.FAILED, error="File not found during documentation update")
            return
        
        # Get the file content
        file_content_response = await get_file_content(file_id, db)
        file_content = file_content_response.content if file_content_response else ""
        
        if not file_content:
            task_queue.update_task(task_id, TaskStatus.FAILED, error="File content not found")
            return
        
        logger.info(f"Generating documentation for file {file_id} with {len(file_content)} characters")
        
        # Generate documentation using Hugging Face API
        documented_content = await _generate_file_docs_with_hf(file_content)
        
        logger.info(f"Documentation generated, updating file {file_id} with {len(documented_content)} characters")
        
        # Update the file with the documentation
        try:
            file_update_result = await db.files.update_one(
                {"_id": ObjectId(file_id)},
                {"$set": {
                    "documented_content": documented_content,
                    "documented_at": datetime.now(timezone.utc)
                }}
            )
            logger.info(f"Update result: matched_count={file_update_result.matched_count}, modified_count={file_update_result.modified_count}")
        except Exception as e:
            logger.error(f"MongoDB update error: {str(e)}")
            task_queue.update_task(task_id, TaskStatus.FAILED, error=f"Database error: {str(e)}")
            return
        
        # Check if document was found
        if file_update_result.matched_count == 0:
            task_queue.update_task(task_id, TaskStatus.FAILED, error="File not found during documentation update")
            return
        
        # Mark task as completed
        task_queue.update_task(task_id, TaskStatus.COMPLETED, result={
            "file_id": file_id,
            "success": True
        })
    
    except Exception as e:
        logger.error(f"Error in background documentation: {str(e)}")
        task_queue.update_task(task_id, TaskStatus.FAILED, error=str(e))

async def _generate_file_docs_with_hf(file_content: str) -> str:
    """Generate documentation for entire file using Hugging Face API"""
    try:
        # Use AST enhancer to parse the file
        ast_enhancer = get_ast_enhancer()
        context = ast_enhancer.enhance_code_context(file_content)
        
        # Process functions and classes individually
        documented_parts = []
        
        # Process functions
        for func in context.get("function_signatures", []):
            func_name = func.get("name", "")
            if func_name:
                try:
                    enhanced_data = ast_enhancer.prepare_for_docgen(file_content, "function", func_name)
                    prompt = ast_enhancer.generate_prompt_with_ast_context(enhanced_data)
                    docstring = await _call_huggingface_api(prompt)
                    documented_parts.append(f"# Function: {func_name}\n{docstring}\n")
                except Exception as e:
                    logger.warning(f"Failed to document function {func_name}: {str(e)}")
        
        # For now, return the original content with a header indicating it's been processed
        # You can enhance this to actually insert the docstrings into the code
        header = "# This file has been processed for documentation\n\n"
        return header + file_content
        
    except Exception as e:
        logger.error(f"Error generating file documentation: {str(e)}")
        return file_content  # Return original if documentation fails

async def document_file(file_id, background_tasks: BackgroundTasks, db, options=None):
    """Start a background task to generate documentation for an entire file"""
    try:
        # Check if file exists
        file = await db.files.find_one({"_id": ObjectId(file_id)})
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Create a task for tracking
        task_queue = get_task_queue()
        task_id = f"doc_{file_id}"
        task = task_queue.add_task(task_id, f"Documenting file {file_id}")
        
        # Start background task
        background_tasks.add_task(_background_file_documentation, file_id, db, options)
        
        return {
            "task_id": task_id,
            "status": task.get("status"),
            "file_id": file_id,
            "message": "Documentation generation started"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scheduling file documentation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to schedule documentation: {str(e)}")

async def get_task_status(task_id):
    """Get the status of a documentation task"""
    task_queue = get_task_queue()
    task = task_queue.get_task(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task

async def list_tasks(limit=20, skip=0):
    """List all documentation tasks"""
    task_queue = get_task_queue()
    return task_queue.list_tasks(limit=limit, skip=skip)

async def get_documented_content(file_id, db):
    """Get the documented content of a file"""
    try:
        file = await db.files.find_one({"_id": ObjectId(file_id)})
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
            
        documented_content = file.get("documented_content")
        
        # If documentation doesn't exist yet, return the original content
        if not documented_content:
            file_content_response = await get_file_content(file_id, db)
            documented_content = file_content_response.content if file_content_response else ""
            
        return {
            "file_id": file_id,
            "documented_content": documented_content,
            "is_documented": "documented_content" in file and file["documented_content"] is not None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving documented content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve documented content: {str(e)}")

async def search_code_context(file_id, query, db):
    """Search for code elements in a file with AST context"""
    try:
        # Get the file content
        file_content_response = await get_file_content(file_id, db)
        file_content = file_content_response.content if file_content_response else ""
        
        if not file_content:
            raise HTTPException(status_code=404, detail="File content not found")
        
        # Use AST enhancer to search the code
        ast_enhancer = get_ast_enhancer()
        context = ast_enhancer.enhance_code_context(file_content)
        
        # Simple search implementation
        matches = {
            "functions": [],
            "classes": [],
            "variables": []
        }
        
        # Search in function signatures
        for func in context.get("function_signatures", []):
            if query.lower() in func.get("name", "").lower():
                matches["functions"].append(func)
        
        # Calculate total matches
        total_matches = sum(len(matches[key]) for key in matches)
        
        return {
            "query": query,
            "matches": matches,
            "total_matches": total_matches
        }
    except Exception as e:
        logger.error(f"Error searching code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search code: {str(e)}")