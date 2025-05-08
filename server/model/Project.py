from datetime import datetime, timezone
from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field

from utils.custom_types import PyObjectId


class ProjectModel(BaseModel):
    name: str
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectResponseModel(ProjectModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    message: str = "Operation successful"

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )
