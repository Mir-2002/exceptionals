from typing import Any, ClassVar
from bson import ObjectId
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema

class PyObjectId(ObjectId):
    """Custom type for handling MongoDB ObjectId fields with Pydantic."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str):
            if ObjectId.is_valid(v):
                return ObjectId(v)
        raise ValueError(f"Invalid ObjectId: {v}")
    
    @classmethod
    def __get_pydantic_core_schema__(
        cls, 
        _source_type: Any, 
        _handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        """Define how to generate the schema for this type."""
        # Simpler schema definition
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.str_schema()
        ])
    
    def __str__(self):
        return str(super())