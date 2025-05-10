# Custom Pydantic Type for MongoDB ObjectId
from bson import ObjectId
from pydantic import GetJsonSchemaHandler
from pydantic_core import core_schema


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler):
        if isinstance(v, ObjectId):
            return str(v)
        if not ObjectId.is_valid(v):
            raise ValueError('Invalid ObjectId')
        return str(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, handler: GetJsonSchemaHandler):
        # Customize the JSON schema for PyObjectId
        json_schema = handler(core_schema.str_schema())
        json_schema.update(type="string")
        return json_schema
    
    def __str__(self):
        return str(self.validate(self))
    
    def __repr__(self):
        return f"PyObjectId({super().__repr__()})"