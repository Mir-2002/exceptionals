import os
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
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    
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
        
        created_project["_id"] = str(created_project["_id"])

        # Return the response model
        return ProjectResponseModel(
            **created_project,
            message="Project created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {e}")
    
async def get(project_id: str, db=Depends(get_db)):
    """Get a project by ID."""
    # Validate MongoDB ObjectId format
    if not ObjectId.is_valid(project_id):
            raise HTTPException(status_code=404, detail="Invalid project ID format")
        
        # Handle database connection issues
    if db is None:
            raise HTTPException(status_code=500, detail="Database connection error")
    try:
        # Find the project
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        
        # Return 404 if project not found
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        return ProjectResponseModel(**project)
    except Exception as e:
        # Log the exception but don't expose details to client
        print(f"Error fetching project: {str(e)}")
        # Return generic 404 for any errors related to finding the object
        raise HTTPException(status_code=404, detail="Project not found") 
    
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
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    
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
        
        # Get file statistics
        file_count = await db.files.count_documents({"project_id": ObjectId(project_id)})
        processed_files = await db.files.count_documents({
        "project_id": ObjectId(project_id),
        "processed": True
        })

        # Return the response model
        return ProjectUpdateResponseModel(
            **updated_project,
            file_count=file_count,
            processed_files=processed_files,
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
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    try:
        # Fetch the existing project
        existing_project = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not existing_project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get associated files for cleanup
        files = await db.files.find({"project_id": ObjectId(project_id)}).to_list(length=None)
        
        # Delete the project from the database
        project_result = await db.projects.delete_one({"_id": ObjectId(project_id)})
        if project_result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Project deletion failed")
        
        # Delete all associated files from disk and database
        deleted_file_count = 0
        for file in files:
            # Delete from disk if exists
            if "file_path" in file and os.path.exists(file["file_path"]):
                try:
                    os.remove(file["file_path"])
                except Exception as e:
                    print(f"Warning: Could not delete file {file['file_path']}: {e}")
            
            # Delete from database
            file_result = await db.files.delete_one({"_id": file["_id"]})
            if file_result.deleted_count > 0:
                deleted_file_count += 1
        
        # Return the response model
        return ProjectDeleteResponseModel(
            **existing_project,
            message=f"Project deleted successfully with {deleted_file_count} associated files"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting project: {e}")
    