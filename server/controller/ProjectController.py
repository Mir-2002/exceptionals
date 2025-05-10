
from fastapi import Depends, HTTPException
from model.Project import ProjectDeleteResponseModel, ProjectModel, ProjectResponseModel, ProjectUpdateModel, ProjectUpdateResponseModel
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
    # Check for existing project
    existing_project = await db.projects.find_one({"name": project.name})
    if existing_project:
        raise HTTPException(
            status_code=400,
            detail="Project with this name already exists"
        )
    
    try:
        # Insert the project into the database
        project_data = project.model_dump(by_alias=True)
        result = await db.projects.insert_one(project_data)
        
        # Fetch the complete document to ensure consistency
        created_project = await db.projects.find_one({"_id": result.inserted_id})
        if not created_project:
            raise HTTPException(
                status_code=500,
                detail="Project created but could not be retrieved"
            )

        # Return the response model
        return ProjectResponseModel(
            **created_project,
            message="Project created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {e}")
    
async def get(project_id: str, db=Depends(get_db)):
    """
    Retrieve a project by its ID.
    
    Args:
        project_id (str): The ID of the project to retrieve.
        db: The database instance.

    Returns:
        ProjectResponseModel: The retrieved project data with additional information.
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    try:
        # Fetch the project from the database
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Create the response model directly from the document
        return ProjectResponseModel(
            **project,
            message="Project retrieved successfully"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving project: {e}")
    
async def update(project_id: str, project_update: ProjectUpdateModel, db=Depends(get_db)):
    """
    Update a project by its ID.
    
    Args:
        project_id (str): The ID of the project to update.
        project_update (ProjectUpdateModel): The updated project data.
        db: The database instance.

    Returns:
        ProjectResponseModel: The updated project data with additional information.
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    try:
        # Fetch the existing project
        existing_project = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not existing_project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Prepare the update data
        update_data = project_update.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No valid fields provided for update"
            )
        
        # Check for name uniqueness if name is being updated
        if "name" in update_data:
            existing_with_name = await db.projects.find_one({
                "name": update_data["name"],
                "_id": {"$ne": ObjectId(project_id)}
            })
            if existing_with_name:
                raise HTTPException(
                    status_code=400,
                    detail="Another project with this name already exists"
                )
        
        # Update the project in the database
        updated_project = await db.projects.find_one_and_update(
            {"_id": ObjectId(project_id)},
            {"$set": update_data},
            return_document=True  # Returns the updated document
        )
        
        if not updated_project:
            raise HTTPException(
                status_code=500,
                detail="Project update failed"
            )
        

        # Return the response model
        return ProjectUpdateResponseModel(
            **updated_project,
            updated_fields=update_data,
            message="Project updated successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating project: {e}")
    
async def remove(project_id: str, db=Depends(get_db)):
    """
    Delete a project by its ID.
    
    Args:
        project_id (str): The ID of the project to delete.
        db: The database instance.

    Returns:
        ProjectResponseModel: The deleted project data with additional information.
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    try:
        # Fetch the existing project
        existing_project = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not existing_project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Delete the project from the database
        result = await db.projects.delete_one({"_id": ObjectId(project_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Project deletion failed")
        
        # Return the response model
        return ProjectDeleteResponseModel(
            **existing_project,
            message="Project deleted successfully"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting project: {e}")
    
    