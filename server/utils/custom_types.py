from typing import Any
from bson import ObjectId

class PyObjectId(ObjectId):
    """Custom type for handling MongoDB ObjectId fields with Pydantic."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_core_schema__(
        cls, 
        _source_type: Any, 
        _handler: Any
    ) -> Any:
        """Define how to generate the schema for this type."""
        from pydantic_core import core_schema
        # Use only the pattern parameter
        return core_schema.str_schema(
            pattern="^[a-f0-9]{24}$"
        )
    
    # For JSON serialization
    def __str__(self):
        return str(super())
    
    def __repr__(self):
        return f"PyObjectId({super().__repr__()})"