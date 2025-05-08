from fastapi import APIRouter, Depends
from controller.UserController import create, get, remove, update
from model.User import BaseResponseModel, DeleteUserResponseModel, UpdateUserResponseModel, UserCreateModel, UserModel, UserUpdateModel
from utils.db import get_db


router = APIRouter()

@router.post("/users", response_model=BaseResponseModel)
async def create_user(user: UserCreateModel, db=Depends(get_db)):
    """
    Create a new user.
    
    Args:
        user (UserCreateModel): The user data to create.
        db: The database instance.

    Returns:
        BaseResponseModel: The created user data.
    """
    # Call the create function from the controller
    return await create(user, db)

@router.get("/users/{user_id}", response_model=UserModel)
async def get_user(user_id: str, db=Depends(get_db)):
    """
    Get a user by ID.
    
    Args:
        user_id (str): The ID of the user to retrieve.
        db: The database instance.

    Returns:
        BaseResponseModel: The retrieved user data.
    """
    # Call the get function from the controller
    return await get(user_id, db)

@router.patch("/users/{user_id}", response_model=UpdateUserResponseModel)
async def update_user(user_id: str, user_update: UserUpdateModel, db=Depends(get_db)):
    """
    Update a user by ID.
    
    Args:
        user_id (str): The ID of the user to update.
        user_update (UserModel): The updated user data.
        db: The database instance.

    Returns:
        UpdateUserResponseModel: The updated user data.
    """
    # Call the update function from the controller
    return await update(user_id, user_update, db)

@router.delete("/users/{user_id}", response_model=DeleteUserResponseModel)
async def delete_user(user_id: str, db=Depends(get_db)):
    """
    Delete a user by ID.
    
    Args:
        user_id (str): The ID of the user to delete.
        db: The database instance.

    Returns:
        DeleteUserResponseModel: A response indicating the result of the deletion.
    """
    # Call the remove function from the controller
    return await remove(user_id, db)