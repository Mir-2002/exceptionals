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
        user_data_dict = user_data.model_dump(by_alias=True)
        user_data_dict["_id"] = ObjectId(user_data_dict["_id"])  # Convert `_id` to ObjectId for MongoDB
        await db.users.insert_one(user_data_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {e}")

    return BaseResponseModel(**user_data_dict).model_dump(by_alias=True)

async def get(user_id: str, db = Depends(get_db)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    user = await db.users.find_one({"_id": ObjectId(user_id)})  # Convert `user_id` to ObjectId
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["_id"] = str(user["_id"])  # Convert ObjectId back to string for response
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

    updated_user["_id"] = str(updated_user["_id"])  # Ensure `_id` is a string for response
    return UpdateUserResponseModel(**updated_user, updated_fields=update_data).model_dump(by_alias=True)

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

    user["_id"] = str(user["_id"])  # Convert `_id` for response
    return DeleteUserResponseModel(**user).model_dump(by_alias=True)


    