# from fastapi import APIRouter, Depends
# from controller.UserController import create, remove, update, get, get_all
# from model.User import UserCreate, UserUpdate, UserResponse, DeleteUserResponse
# from utils.db import db  # Use the singleton instance

# router = APIRouter()

# @router.post("/users/", response_model=UserResponse)
# async def create_user(user: UserCreate, db_instance=Depends(lambda: db)):
#     """
#     Creates a new user.
    
#     Args:
#         user (UserCreate): The user data to create.
#         db_instance: The database instance.

#     Returns:
#         UserResponse: The created user data.
#     """
#     return await create(user, db_instance)

# @router.delete("/users/{user_id}", response_model=DeleteUserResponse)
# async def delete_user(user_id: str, db_instance=Depends(lambda: db)):
#     """
#     Deletes a user by ID.
    
#     Args:
#         user_id (str): The ID of the user to delete.
#         db_instance: The database instance.

#     Returns:
#         DeleteUserResponse: A response indicating the result of the deletion.
#     """
#     return await remove(user_id, db_instance)

# @router.patch("/users/{user_id}", response_model=UserResponse)
# async def update_user(user_id: str, user_update: UserUpdate, db_instance=Depends(lambda: db)):
#     """
#     Updates a user by ID.
    
#     Args:
#         user_id (str): The ID of the user to update.
#         user_update (UserUpdate): The updated user data.
#         db_instance: The database instance.

#     Returns:
#         UserResponse: The updated user data.
#     """
#     return await update(user_id, user_update, db_instance)

# @router.get("/users/{user_id}", response_model=UserResponse)
# async def get_user(user_id: str, db_instance=Depends(lambda: db)):
#     """
#     Retrieves a user by ID.
    
#     Args:
#         user_id (str): The ID of the user to retrieve.
#         db_instance: The database instance.

#     Returns:
#         UserResponse: The retrieved user data.
#     """
#     return await get(user_id, db_instance)

# @router.get("/users/", response_model=list[UserResponse])
# async def get_all_users(limit: int = 10, skip: int = 0, db_instance=Depends(lambda: db)):
#     """
#     Retrieves all users.
    
#     Args:
#         db_instance: The database instance.

#     Returns:
#         list[UserResponse]: A list of all user data.
#     """
#     return await get_all(limit=limit, skip=skip, db_instance = db_instance)

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