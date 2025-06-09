from fastapi import APIRouter, Depends, HTTPException
from controller.UserController import create, get, remove, update
from model.User import BaseResponseModel, DeleteUserResponseModel, UpdateUserResponseModel, UserCreateModel, UserModel, UserUpdateModel
from utils.auth import get_current_user
from utils.db import get_db


router = APIRouter()

@router.post("/users", response_model=BaseResponseModel)
async def create_user(user: UserCreateModel, db=Depends(get_db)):
    """
    Create a new user.
    
    Args:
        user (UserCreateModel): The user data to create.
        current_user: The authenticated user making the request.
        db: The database instance.

    Returns:
        BaseResponseModel: The created user data.
    """
    # Call the create function from the controller
    return await create(user, db)

@router.get("/users/{user_id}", response_model=UserModel)
async def get_user(user_id: str, current_user = Depends(get_current_user), db=Depends(get_db)):
    """
    Get a user by ID.
    
    Args:
        user_id (str): The ID of the user to retrieve.
        current_user: The authenticated user making the request.
        db: The database instance.

    Returns:
        BaseResponseModel: The retrieved user data.
    """
    # Call the get function from the controller
    return await get(user_id, db)

@router.patch("/users/{user_id}", response_model=UpdateUserResponseModel)
async def update_user(user_id: str, user_update: UserUpdateModel, current_user = Depends(get_current_user), db=Depends(get_db)):
    """
    Update a user by ID.
    
    Args:
        user_id (str): The ID of the user to update.
        user_update (UserModel): The updated user data.
        current_user: The authenticated user making the request.
        db: The database instance.

    Returns:
        UpdateUserResponseModel: The updated user data.
    """
    # Call the update function from the controller
    if str(user_id) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="You can only update your own profile.")
    
    return await update(user_id, user_update, db)

@router.delete("/users/{user_id}", response_model=DeleteUserResponseModel)
async def delete_user(user_id: str, current_user = Depends(get_current_user), db=Depends(get_db)):
    """
    Delete a user by ID.
    
    Args:
        user_id (str): The ID of the user to delete.
        current_user: The authenticated user making the request.
        db: The database instance.

    Returns:
        DeleteUserResponseModel: A response indicating the result of the deletion.
    """
    if str(user_id) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="You can only delete your own profile.")
    
    # Call the remove function from the controller
    return await remove(user_id, db)