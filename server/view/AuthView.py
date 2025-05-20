from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from utils.auth import Token, create_access_token, get_current_user
from utils.db import get_db
from controller.UserController import verify_password
import logging

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str
    expires_at: int

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

@router.get("/auth/me")
async def read_users_me(current_user = Depends(get_current_user)):
    """Get current authenticated user info"""
    # Remove sensitive fields
    user_data = {k: v for k, v in current_user.items() if k != "hashed_password"}
    return user_data