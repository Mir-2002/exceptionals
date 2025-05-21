from fastapi import HTTPException, BackgroundTasks
from bson import ObjectId
import logging
from datetime import datetime, timezone
from utils.model_service import get_model_service
from controller.FileController import get_file_content
from utils.task_queue import get_task_queue, TaskStatus

# Set up logging
logger = logging.getLogger(__name__)

async def generate_ast_nlp_docstring(code, element_type=None, element_name=None):
    """
    Generate a docstring for code using combined AST and NLP techniques.
    
    Args:
        code: Python code to document
        element_type: Optional type of element (function/class)
        element_name: Optional name of specific element
        
    Returns:
        Generated docstring
    """
    try:
        # Get the unified model service
        model_service = get_model_service()
        
        # Generate docstring with AST-enhanced context
        docstring = await model_service.generate_docstring(code, element_type, element_name)
        
        return {"docstring": docstring}
    except Exception as e:
        logger.error(f"Error generating docstring: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate docstring: {str(e)}")

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
        
        # Generate documentation using the unified model service
        model_service = get_model_service()
        documented_content = await model_service.generate_file_docs(file_content)
        
        logger.info(f"Documentation generated, updating file {file_id} with {len(documented_content)} characters")
        
        # Update the file with the documentation
        try:
            file_update_result = await db.files.update_one(
                {"_id": ObjectId(file_id)},
                {"$set": {
                    "documented_content": documented_content,
                    "documented_at": datetime.now(timezone.utc)  # Force an update by always changing this field
                }}
            )
            logger.info(f"Update result: matched_count={file_update_result.matched_count}, modified_count={file_update_result.modified_count}")
        except Exception as e:
            logger.error(f"MongoDB update error: {str(e)}")
            task_queue.update_task(task_id, TaskStatus.FAILED, error=f"Database error: {str(e)}")
            return
        
        # Check if document was found (not if it was modified)
        if file_update_result.matched_count == 0:
            task_queue.update_task(task_id, TaskStatus.FAILED, error="File not found during documentation update")
            return
        
        # Mark task as completed even if content didn't change
        task_queue.update_task(task_id, TaskStatus.COMPLETED, result={
            "file_id": file_id,
            "success": True
        })
    
    except Exception as e:
        logger.error(f"Error in background documentation: {str(e)}")
        task_queue.update_task(task_id, TaskStatus.FAILED, error=str(e))

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
        file_content = file_content_response.content if file_content_response else ""  # Fixed to use attribute access
        
        if not file_content:
            raise HTTPException(status_code=404, detail="File content not found")
        
        # Use the model service to search the code
        model_service = get_model_service()
        search_results = await model_service.search_related_code(file_content, query)
        
        return search_results
    except Exception as e:
        logger.error(f"Error searching code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search code: {str(e)}")