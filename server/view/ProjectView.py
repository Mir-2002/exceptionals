import os
from bson import ObjectId
from fastapi import APIRouter, Depends, Query

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
async def get_structure_for_project(project_id: str, use_default_exclusions: bool = Query(True, description="Apply default exclusions to common files/folders"),db=Depends(get_db)):
    """
    Get the folder structure of a project.
    
    Returns a tree representing the directory structure of the project.
    This is useful for displaying folder organization in a file explorer UI.
    """
    return await get_project_structure(project_id, use_default_exclusions,
    db)

@router.get("/debug-path-matching/{project_id}")
async def debug_path_matching(project_id: str, db=Depends(get_db)):
    """Debug endpoint for path matching issues"""
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    excluded_dirs = project.get("excluded_directories", [])
    excluded_files = project.get("excluded_files", [])
    
    test_paths = {
        "src/helpers": {
            "normalized": os.path.normpath("src/helpers"),
            "with_slash": "src/helpers/",
            "backslash": "src\\helpers",
            "normalized_backslash": os.path.normpath("src\\helpers"),
            "match_direct": "src/helpers" in excluded_dirs,
            "match_with_slash": "src/helpers/" in excluded_dirs,
            "match_backslash_replaced": "src\\helpers".replace("\\", "/") in excluded_dirs
        },
        "main.py": {
            "normalized": os.path.normpath("main.py"),
            "match_direct": "main.py" in excluded_files,
            "match_normalized": os.path.normpath("main.py") in excluded_files,
            "match_backslash_replaced": "main.py".replace("\\", "/") in excluded_files
        }
    }
    
    return {
        "excluded_dirs": excluded_dirs,
        "excluded_files": excluded_files,
        "test_paths": test_paths,
        "os_sep": os.path.sep
    }



