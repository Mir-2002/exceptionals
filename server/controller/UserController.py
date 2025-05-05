from fastapi import HTTPException, Depends
from bson import ObjectId
from model.User import UserCreate, UserInDB, UserResponse, UserBase
from utils.db import Database
from passlib.context import CryptContext
import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash a password using bcrypt
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
    return hashed_password.decode('utf-8')  # Store as a string

# Verify if the provided password matches the hashed password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')  # Convert stored hash back to bytes
    return bcrypt.checkpw(password=password_byte_enc, hashed_password=hashed_password_bytes)

# Create a new user
async def create(user: UserCreate, db: Database = Depends(Database)):
    # Check if the user already exists
    existing_user = await db.db.users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing_user:
        if existing_user.get("email") == user.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            raise HTTPException(status_code=400, detail="Username already registered")
    
    # Hash the password
    hashed_password = hash_password(user.password)

    # Prepare the user data for insertion
    user_data = UserInDB(**user.model_dump(), hashed_password=hashed_password)

    # Insert the user into the database
    try:
        result = await db.db.users.insert_one(user_data.model_dump(by_alias=True))
        user_data.id = str(result.inserted_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {e}")
    
    return user_data

async def remove(user_id: str, db: Database = Depends(Database)):
    # Check if the user exists
    user = await db.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete the user from the database
    try:
        await db.db.users.delete_one({"_id": ObjectId(user_id)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user: {e}")
    
    return {"message": f"User {user_id} deleted successfully"}

