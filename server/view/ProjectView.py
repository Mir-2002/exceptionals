from fastapi import APIRouter, Depends

from controller.ProjectController import create, get, remove, update
from model.Project import ProjectDeleteResponseModel, ProjectModel, ProjectResponseModel, ProjectUpdateModel, ProjectUpdateResponseModel
from controller.FileController import get_project_structure
from model.File import ProjectStructureResponseModel
from utils.db import get_db


router = APIRouter()

@router.post("/projects", response_model=ProjectResponseModel)
async def create_project(project: ProjectModel, db=Depends(get_db)):
    return await create(project, db)

@router.get("/projects/{project_id}", response_model=ProjectResponseModel)
async def get_project(project_id: str, db=Depends(get_db)):
    return await get(project_id, db)

@router.patch("/projects/{project_id}", response_model=ProjectUpdateResponseModel)
async def update_project(project_id: str, project: ProjectUpdateModel, db=Depends(get_db)):
    return await update(project_id, project, db)

@router.delete("/projects/{project_id}", response_model=ProjectDeleteResponseModel)
async def delete_project(project_id: str, db=Depends(get_db)):
    return await remove(project_id, db)

@router.get("/projects/{project_id}/structure", response_model=ProjectStructureResponseModel)
async def get_structure_for_project(project_id: str, db=Depends(get_db)):
    """
    Get the folder structure of a project.
    
    Returns a tree representing the directory structure of the project.
    This is useful for displaying folder organization in a file explorer UI.
    """
    return await get_project_structure(project_id, db)

