from typing import Any, Dict, List, TypeVar, Type
from bson import ObjectId
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

def prepare_document_for_response(document: Dict[str, Any]) -> Dict[str, Any]:
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

def create_document_model(model_class: Type[T], data: Dict[str, Any]) -> T:
    """
    Create a model instance from a MongoDB document, converting ObjectIds to strings.
    
    Args:
        model_class: The Pydantic model class to create
        data: MongoDB document data
        
    Returns:
        An instance of the model_class with proper type conversions
    """
    # First prepare the document (convert ObjectIds to strings)
    prepared_data = prepare_document_for_response(data)
    
    # Create and return the model instance
    return model_class(**prepared_data)