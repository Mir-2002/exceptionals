from fastapi import APIRouter, Depends
from controller.UserController import create, remove
from model.User import UserCreate, UserResponse, DeleteUserResponse
from utils.db import Database

router = APIRouter()

@router.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Database = Depends(Database)):
    """
    Creates a new user.
    
    Args:
        user (UserCreate): The user data to create.
        db (Database): The database instance.

    Returns:
        UserResponse: The created user data.
    """
    return await create(user, db)

@router.delete("/users/{user_id}", response_model=DeleteUserResponse)
async def delete_user(user_id: str, db: Database = Depends(Database)):
    """
    Deletes a user by ID.
    
    Args:
        user_id (str): The ID of the user to delete.
        db (Database): The database instance.

    Returns:
        DeleteUserResponse: A response indicating the result of the deletion.
    """
    return await remove(user_id, db)

