from fastapi import APIRouter, Depends

from controller.ProjectController import create
from model.Project import ProjectModel, ProjectResponseModel
from utils.db import get_db


router = APIRouter()

@router.post("/projects", response_model=ProjectResponseModel)
async def create_project(project: ProjectModel, db=Depends(get_db)):
    await create(project, db)