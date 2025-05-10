from fastapi import Depends, HTTPException
from model.Project import ProjectModel, ProjectResponseModel
from utils.db import get_db
from bson import ObjectId


async def create(project: ProjectModel, db=Depends(get_db)):
    """
    Create a new project.
    
    Args:
        project (ProjectModel): The project data to create.
        db: The database instance.

    Returns:
        ProjectResponseModel: The created project data with additional information.
    """
    existing_project = await db.projects.find_one({"name": project.name})
    if existing_project:
        raise HTTPException(status_code=400, detail="Project with this name already exists")
    
    try:
        # Insert the project into the database
        result = await db.projects.insert_one(project.model_dump(by_alias=True))
        
        # Fetch the inserted project ID
        project_id = result.inserted_id

        # Return the response model with the project ID and additional information
        return ProjectResponseModel(
            id=str(project_id),
            name=project.name,
            description=project.description,
            created_at=project.created_at,
            message="Project created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {e}")