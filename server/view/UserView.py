from fastapi import APIRouter, Depends, HTTPException
from controller.UserController import create, remove, update, get, get_all, login
from model.User import UserCreate, UserUpdate, UserResponse, UserUpdateResponse, DeleteUserResponse, UserLoginResponse, UserLogin
from utils.db import db  # Use the singleton instance
from utils.auth import get_current_user

router = APIRouter()

@router.post("/users/", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate, db_instance=Depends(lambda: db)):
    """
    Creates a new user.
    
    Args:
        user (UserCreate): The user data to create.
        db_instance: The database instance.

    Returns:
        UserResponse: The created user data.
    """
    return await create(user, db_instance)

@router.delete("/users/{user_id}", response_model=DeleteUserResponse, status_code=200)
async def delete_user(user_id: str, db_instance=Depends(lambda: db), current_user=Depends(get_current_user)):
    """
    Deletes a user by ID.
    
    Args:
        user_id (str): The ID of the user to delete.
        db_instance: The database instance.

    Returns:
        DeleteUserResponse: A response indicating the result of the deletion.
    """
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Not authorized to delete users")
    return await remove(user_id, db_instance)

@router.patch("/users/{user_id}", response_model=UserUpdateResponse, status_code=200)
async def update_user(user_id: str, user_update: UserUpdate, db_instance=Depends(lambda: db), current_user=Depends(get_current_user)):
    """
    Updates a user by ID.
    
    Args:
        user_id (str): The ID of the user to update.
        user_update (UserUpdate): The updated user data.
        db_instance: The database instance.

    Returns:
        UserResponse: The updated user data.
    """
    return await update(user_id, user_update, db_instance)

@router.get("/users/{user_id}", response_model=UserResponse, status_code=200)
async def get_user(user_id: str, db_instance=Depends(lambda: db), current_user=Depends(get_current_user)):
    """
    Retrieves a user by ID.
    
    Args:
        user_id (str): The ID of the user to retrieve.
        db_instance: The database instance.

    Returns:
        UserResponse: The retrieved user data.
    """
    return await get(user_id, db_instance)

@router.get("/users/", response_model=list[UserResponse], status_code=200)
async def get_all_users(limit: int = 10, skip: int = 0, db_instance=Depends(lambda: db), current_user=Depends(get_current_user)):
    """
    Retrieves all users.
    
    Args:
        db_instance: The database instance.

    Returns:
        list[UserResponse]: A list of all user data.
    """
    return await get_all(limit=limit, skip=skip, db_instance = db_instance)

@router.post("/login", response_model=UserLoginResponse,status_code=200)
async def login_user(login_request: UserLogin, db_instance=Depends(lambda: db)):
    """
    Logs in a user and returns a JWT token.
    
    Args:
        username (str): The username of the user.
        password (str): The password of the user.
        db_instance: The database instance.

    Returns:
        dict: A dictionary containing the JWT token and user data.
    """
    return await login(login_request.email, login_request.password, db_instance)