from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from utils.auth import Token, create_access_token, get_current_user
from utils.db import get_db
from controller.UserController import verify_password, hash_password  # Remove create_user
import logging
from datetime import datetime

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str
    expires_at: int

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str
    message: str

@router.post("/auth/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    """Login and get access token"""
    # Find user by username
    user = await db.users.find_one({"username": form_data.username})
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    token_data = create_access_token(
        data={"sub": user["username"], "user_id": str(user["_id"])}
    )
    
    return {
        "access_token": token_data["token"],
        "token_type": "bearer",
        "user_id": str(user["_id"]),
        "username": user["username"],
        "expires_at": token_data["expires_at"]
    }

@router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db=Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"email": user_data.email},
            {"username": user_data.username}
        ]
    })
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    
    result = await db.users.insert_one(user_doc)
    
    return {
        "user_id": str(result.inserted_id),
        "username": user_data.username,
        "email": user_data.email,
        "message": "User registered successfully"
    }