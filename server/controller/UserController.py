# from fastapi import HTTPException, Depends
# from bson import ObjectId
# from model.User import UserCreate, UserInDB, UserUpdate, UserResponse
# from utils.db import db
# from passlib.context import CryptContext
# import bcrypt

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # Hash a password using bcrypt
# def hash_password(password: str) -> str:
#     pwd_bytes = password.encode('utf-8')
#     salt = bcrypt.gensalt()
#     hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
#     return hashed_password.decode('utf-8')  # Store as a string

# # Verify if the provided password matches the hashed password
# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     password_byte_enc = plain_password.encode('utf-8')
#     hashed_password_bytes = hashed_password.encode('utf-8')  # Convert stored hash back to bytes
#     return bcrypt.checkpw(password_byte_enc, hashed_password_bytes)

# # Create a new user
# async def create(user: UserCreate, db_instance=Depends(lambda: db)):
#     db = db_instance.db  # Fix: Access the database instance correctly
#     existing_user = await db.users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
#     if existing_user:
#         if existing_user.get("email") == user.email:
#             raise HTTPException(status_code=400, detail="Email already registered")
#         else:
#             raise HTTPException(status_code=400, detail="Username already registered")
    
#     hashed_password = hash_password(user.password)
#     user_data = UserInDB(**user.model_dump(), hashed_password=hashed_password)

#     try:
#         result = await db.users.insert_one(user_data.model_dump(by_alias=True))
#         user_data.id = str(result.inserted_id)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error creating user: {e}")
    
#     return user_data

# async def remove(user_id: str, db_instance=Depends(lambda: db)):
#     db = db_instance.db  # Fix: Access the database instance correctly
#     if not ObjectId.is_valid(user_id):
#         raise HTTPException(status_code=400, detail="Invalid user ID format")
    
#     user = await db.users.find_one({"_id": ObjectId(user_id)})
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     try:
#         await db.users.delete_one({"_id": ObjectId(user_id)})
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error deleting user: {e}")
    
#     return {"message": f"User {user_id} deleted successfully"}

# async def update(user_id: str, user_update: UserUpdate, db_instance=Depends(lambda: db)):
#     db = db_instance.db  # Fix: Access the database instance correctly
#     if not ObjectId.is_valid(user_id):
#         raise HTTPException(status_code=400, detail="Invalid user ID format")
    
#     user = await db.users.find_one({"_id": ObjectId(user_id)})
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     update_data = user_update.model_dump(exclude_unset=True)
    
#     try:
#         await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error updating user: {e}")
    
#     # Fetch the updated user document
#     updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
#     if not updated_user:
#         raise HTTPException(status_code=500, detail="Error retrieving updated user")
    
#     # Convert the MongoDB document to the response model
#     updated_user["_id"] = str(updated_user["_id"])  # Convert ObjectId to string
#     return UserResponse(**updated_user).model_dump(by_alias=True)

# async def get(user_id: str, db_instance=Depends(lambda: db)):
#     db = db_instance.db  # Fix: Access the database instance correctly
#     if not ObjectId.is_valid(user_id):
#         raise HTTPException(status_code=400, detail="Invalid user ID format")
    
#     user = await db.users.find_one({"_id": ObjectId(user_id)})
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     user["_id"] = str(user["_id"])
#     return UserResponse(**user).model_dump(by_alias=True)

# async def get_all(limit: int = 10, skip: int = 0, db_instance=Depends(lambda: db)):
#     db = db_instance.db  # Fix: Access the database instance correctly
#     try:
#         users_cursor = db.users.find().skip(skip).limit(limit)
#         users = await users_cursor.to_list(length=limit)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error retrieving users: {e}")
    
#     for user in users:
#         user["_id"] = str(user["_id"])
#     return [UserResponse(**user).model_dump(by_alias=True) for user in users]

from bson import ObjectId
from fastapi import HTTPException
import bcrypt
from fastapi import Depends
from model.User import UpdateUserResponseModel, UserCreateModel, UserInDBModel, UserModel, UserUpdateModel, BaseResponseModel, DeleteUserResponseModel
from utils.db import get_db


def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_bytes)

async def create(user: UserCreateModel, db = Depends(get_db)):
    existing_user = await db.users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already exists")
    
    hashed_password = hash_password(user.password)
    user_data = UserInDBModel(**user.model_dump(), hashed_password=hashed_password)

    try:
        await db.users.insert_one(user_data.model_dump(by_alias=True))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {e}")
    
    return BaseResponseModel(**user_data.model_dump()).model_dump(by_alias=True)

async def get(user_id: str, db = Depends(get_db)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user["_id"] = str(user["_id"])
    return UserModel(**user).model_dump(by_alias=True)

async def update(user_id: str, user_update: UserUpdateModel, db = Depends(get_db)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    try:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user: {e}")
    
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not updated_user:
        raise HTTPException(status_code=500, detail="Error retrieving updated user")

    updated_user["_id"] = str(updated_user["_id"])
    return UpdateUserResponseModel(
    **updated_user,
    updated_fields=update_data
    ).model_dump(by_alias=True)


async def remove(user_id: str, db = Depends(get_db)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        await db.users.delete_one({"_id": ObjectId(user_id)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user: {e}")
    
    return DeleteUserResponseModel(**user).model_dump(by_alias=True)

    