from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

from server.utils.custom_types import PyObjectId


class FileModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    project_id: PyObjectId
    file_name: str
    file_path: str
    content_type: str
    size: int
    relative_path: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

