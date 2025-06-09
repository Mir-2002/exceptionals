from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from utils.db import get_db
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Configuration
SECRET_KEY = "your-secret-key-change-this-in-production"  # Use env variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7  # Longer-lived token for simplicity

# Password handling is already in your UserController
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str
    expires_at: int

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[str] = None

def create_access_token(data: dict):
    """Create a new access token with 7-day expiration"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "token": encoded_jwt,
        "expires_at": int(expire.timestamp())
    }

async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    """Validate token and get current user"""
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Decode and verify the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = await db.users.find_one({"username": username})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert ObjectId to string
    user["_id"] = str(user["_id"])
    return user

# in utils/auth.py
async def verify_project_owner(
    project_id: str,
    current_user = Depends(get_current_user),
    db=Depends(get_db)
):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
        
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project_user_id = str(project.get("user_id"))
    user_id = str(current_user.get("_id"))
    
    if project_user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to access this project"
        )
        
    return project, current_user

# Add to utils/auth.py
async def verify_file_owner(
    file_id: str,
    current_user = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Verify that the current user is the owner of the specified file.
    This checks if the user owns the project that contains the file.
    
    Args:
        file_id: The ID of the file to check
        current_user: The authenticated user
        db: Database connection
        
    Returns:
        Tuple of (file, project, user) if authorized
        
    Raises:
        HTTPException: If file not found or user is not authorized
    """
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID format")
        
    # Get the file
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get the project that owns this file
    project_id = file.get("project_id")
    if not project_id:
        raise HTTPException(status_code=404, detail="File not associated with any project")
        
    # Get the project
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Associated project not found")
        
    # Check if current user is the project owner
    project_user_id = str(project.get("user_id", ""))
    user_id = str(current_user.get("_id", ""))
    
    if not project_user_id or project_user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to access this file"
        )
        
    # Return file, project, and user for convenience
    return file, project, current_user