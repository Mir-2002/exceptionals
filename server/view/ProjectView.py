from fastapi import APIRouter, Depends, File, Query, UploadFile
from controller.ProjectController import create, get, remove, update, get_project_structure, set_project_exclusions, get_project_exclusions, upload_project_zip
from model.Project import ProjectDeleteResponseModel, ProjectExclusionResponse, ProjectModel, ProjectResponseModel, ProjectUpdateModel, ProjectUpdateResponseModel, ProjectStructureResponseModel
from model.File import ProjectExclusions, ZipUploadResponseModel
from utils.db import get_db
from utils.auth import get_current_user, verify_project_owner


router = APIRouter()

@router.post("/projects", response_model=ProjectResponseModel)
async def create_project(project: ProjectModel, current_user = Depends(get_current_user),db=Depends(get_db)):
    return await create(project, db)

@router.get("/projects/{project_id}", response_model=ProjectResponseModel)
async def get_project(project_id: str, current_user = Depends(get_current_user),db=Depends(get_db)):
    return await get(project_id, db)

@router.patch("/projects/{project_id}", response_model=ProjectUpdateResponseModel)
async def update_project(project_id: str, project: ProjectUpdateModel, project_data = Depends(verify_project_owner),db=Depends(get_db)):
    return await update(project_id, project, db)

@router.delete("/projects/{project_id}", response_model=ProjectDeleteResponseModel)
async def delete_project(project_id: str, project_data = Depends(verify_project_owner),db=Depends(get_db)):
    return await remove(project_id, db)

@router.get("/projects/{project_id}/structure", response_model=ProjectStructureResponseModel)
async def get_structure_for_project(project_id: str, use_default_exclusions: bool = Query(True, description="Apply default exclusions to common files/folders"),project_data = Depends(verify_project_owner),db=Depends(get_db)):
    """
    Get the folder structure of a project.
    
    Returns a tree representing the directory structure of the project.
    This is useful for displaying folder organization in a file explorer UI.
    """
    return await get_project_structure(project_id, use_default_exclusions,
    db)

@router.post("/projects/{project_id}/exclusions", response_model=ProjectExclusionResponse)
async def update_project_exclusions(
    project_id: str,
    exclusions: ProjectExclusions,
    project_data = Depends(verify_project_owner),
    db=Depends(get_db)
):
    """
    Set which directories and files to exclude from project documentation.
    """
    return await set_project_exclusions(project_id, exclusions, db)

@router.post("/projects/{project_id}/upload-zip", response_model=ZipUploadResponseModel)
async def upload_project_zip_file(
    project_id: str,
    zip_file: UploadFile = File(...),
    project_data = Depends(verify_project_owner),
    db=Depends(get_db)
):
    """
    Upload a ZIP file containing a project structure.
    
    This allows users to upload entire projects with their directory structure intact.
    """
    return await upload_project_zip(project_id, zip_file, db)

@router.get("/projects/{project_id}/exclusions", response_model=ProjectExclusions)
async def retrieve_project_exclusions(project_id: str, project_data = Depends(verify_project_owner),db=Depends(get_db)):
    """
    Get the current exclusions for a project.
    """
    return await get_project_exclusions(project_id, db)