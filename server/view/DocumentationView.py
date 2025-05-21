from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from typing import Optional, Dict, Any, List
from utils.model_service import MODEL_DIR, MODEL_NAME, get_model_service
from utils.db import get_db
from utils.auth import get_current_user, verify_file_owner
from model.Documentation import (
    CodeSnippetModel, 
    DocstringResponseModel,
    TaskStatusResponseModel,
    DocumentedContentResponseModel,
    SearchQueryModel,
    SearchResultsResponseModel,
    DocumentationOptionsModel
)
from controller.DocumentationController import (
    generate_ast_nlp_docstring,
    document_file,
    get_task_status,
    get_documented_content,
    search_code_context,
    list_tasks
)

router = APIRouter()

@router.post("/docs/generate", response_model=DocstringResponseModel)
async def create_docstring(
    snippet: CodeSnippetModel,
    element_type: Optional[str] = Query(None, description="Type of element (function, class)"),
    element_name: Optional[str] = Query(None, description="Name of the element to document"),
    current_user = Depends(get_current_user)
):
    """
    Generate a docstring for a code snippet using AST-enhanced NLP.
    
    This endpoint combines AST analysis with CodeT5 to create more accurate
    and contextually-aware documentation.
    """
    return await generate_ast_nlp_docstring(snippet.code, element_type, element_name)

@router.post("/files/{file_id}/document", response_model=Dict[str, Any])
async def document_file_endpoint(
    file_id: str,
    background_tasks: BackgroundTasks,
    options: Optional[DocumentationOptionsModel] = None,
    file_data = Depends(verify_file_owner),
    db = Depends(get_db)
):
    """
    Generate documentation for an entire file using AST-enhanced NLP.
    
    This endpoint processes a Python file and adds documentation to all functions and classes
    using a combination of Abstract Syntax Tree analysis and advanced language models.
    Requires authentication and file ownership.
    
    Returns a task ID that can be used to check the documentation status.
    """
    options_dict = options.dict() if options else {}
    return await document_file(file_id, background_tasks, db, options_dict)

@router.get("/docs/tasks/{task_id}", response_model=Dict[str, Any])
async def check_task_status_endpoint(
    task_id: str,
    current_user = Depends(get_current_user)
):
    """
    Check the status of a documentation task.
    
    Use this to monitor the progress of a long-running documentation job.
    """
    return await get_task_status(task_id)

@router.get("/docs/tasks", response_model=List[Dict[str, Any]])
async def list_tasks_endpoint(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user = Depends(get_current_user)
):
    """
    List all documentation tasks.
    
    Returns a list of tasks with their current status.
    """
    return await list_tasks(limit, skip)

@router.get("/files/{file_id}/documented-content", response_model=DocumentedContentResponseModel)
async def get_file_documented_content(
    file_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get the documented content of a file.
    
    Returns the file content with generated documentation if it exists.
    Otherwise returns the original content.
    """
    return await get_documented_content(file_id, db)

@router.post("/files/{file_id}/search", response_model=SearchResultsResponseModel)
async def search_code(
    file_id: str,
    query: SearchQueryModel,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Search for code elements in a file using AST-based context.
    
    This endpoint allows searching for functions, classes, and variables
    and returns contextual information about matches.
    """
    return await search_code_context(file_id, query.query, db)

# Add this endpoint to your existing DocumentationView.py

@router.get("/docs/model-status", response_model=Dict[str, Any])
async def check_model_status(current_user = Depends(get_current_user)):
    """
    Check if the model is loaded and working.
    This endpoint forces model loading if not already loaded.
    """
    model_service = get_model_service()
    
    # Get model status
    is_loaded = await model_service.is_model_loaded()
    
    # Try to load if not already
    if not is_loaded:
        await model_service.ensure_model_loaded()
        is_loaded = await model_service.is_model_loaded()
    
    # Test with simple function
    sample_code = "def add(a, b):\n    return a + b"
    
    result = {
        "model_loaded": is_loaded,
        "model_name": MODEL_NAME,
        "model_dir": MODEL_DIR,
        "transformers_available": model_service.transformers_available,
        "device": model_service.device,
        "test_result": None
    }
    
    if is_loaded:
        try:
            docstring = await model_service.generate_docstring(sample_code)
            result["test_result"] = docstring
        except Exception as e:
            result["test_error"] = str(e)
    
    return result