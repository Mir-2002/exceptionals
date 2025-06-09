from bson import ObjectId
from fastapi import HTTPException, Depends
import bcrypt
import logging
from model.User import UpdateUserResponseModel, UserCreateModel, UserInDBModel, UserModel, UserUpdateModel, BaseResponseModel, DeleteUserResponseModel
from utils.db import get_db, get_transaction_session

# Set up logging
logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_bytes)

async def create(user: UserCreateModel, db=Depends(get_db)):
    """Create a new user with transaction support if available."""
    try:
        # First check if user exists (outside transaction for efficiency)
        existing_user = await db.users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email or username already exists")

        # Hash the password
        hashed_password = hash_password(user.password)
        user_data = UserInDBModel(**user.model_dump(), hashed_password=hashed_password)
        user_data_dict = user_data.model_dump(by_alias=True)
        user_data_dict["_id"] = ObjectId(user_data_dict["_id"])  # Convert `_id` to ObjectId for MongoDB

        # Use transaction for database operation
        async with get_transaction_session("Create new user") as session:
            # Insert the user with or without transaction
            if session:
                await db.users.insert_one(user_data_dict, session=session)
            else:
                await db.users.insert_one(user_data_dict)
        
        # Convert the ObjectId to string for the response
        user_data_dict["_id"] = str(user_data_dict["_id"])
        logger.info(f"Created new user: {user_data_dict['username']}")
        
        return BaseResponseModel(**user_data_dict)
        
    except HTTPException as http_ex:
        # Re-raise HTTP exceptions
        raise http_ex
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

async def get(user_id: str, db=Depends(get_db)):
    """Get a user by ID."""
    try:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Prepare for response
        user["_id"] = str(user["_id"])
        return UserModel(**user)
        
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error retrieving user: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving user: {str(e)}")

async def update(user_id: str, user_update: UserUpdateModel, db=Depends(get_db)):
    """Update a user with transaction support if available."""
    try:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        # Check if user exists before starting transaction
        user_id_obj = ObjectId(user_id)
        user = await db.users.find_one({"_id": user_id_obj})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Prepare update data
        update_data = user_update.model_dump(exclude_unset=True)
        
        # Check if email or username is being updated and if they're already taken
        if "email" in update_data:
            email_exists = await db.users.find_one({"email": update_data["email"], "_id": {"$ne": user_id_obj}})
            if email_exists:
                raise HTTPException(status_code=400, detail="Email already in use")
                
        if "username" in update_data:
            username_exists = await db.users.find_one({"username": update_data["username"], "_id": {"$ne": user_id_obj}})
            if username_exists:
                raise HTTPException(status_code=400, detail="Username already in use")

        # Use transaction for database operation
        updated_user = None
        async with get_transaction_session(f"Update user {user_id}") as session:
            # Update the user with or without transaction
            if session:
                result = await db.users.update_one(
                    {"_id": user_id_obj}, 
                    {"$set": update_data},
                    session=session
                )
                
                if result.matched_count == 0:
                    raise HTTPException(status_code=404, detail="User not found")

                # Get the updated user within the transaction
                updated_user = await db.users.find_one({"_id": user_id_obj}, session=session)
            else:
                result = await db.users.update_one(
                    {"_id": user_id_obj}, 
                    {"$set": update_data}
                )
                
                if result.matched_count == 0:
                    raise HTTPException(status_code=404, detail="User not found")

                # Get the updated user outside transaction
                updated_user = await db.users.find_one({"_id": user_id_obj})
                
        if not updated_user:
            raise HTTPException(status_code=500, detail="Error retrieving updated user")
                
        # Prepare for response
        updated_user["_id"] = str(updated_user["_id"])
        logger.info(f"Updated user {user_id}: {', '.join(update_data.keys())}")
        
        return UpdateUserResponseModel(**updated_user, updated_fields=update_data)
        
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

async def remove(user_id: str, db=Depends(get_db)):
    """Delete a user with transaction support if available."""
    try:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        # Get user before deletion for response
        user_id_obj = ObjectId(user_id)
        user = await db.users.find_one({"_id": user_id_obj})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Keep a copy for the response
        user_copy = user.copy()

        # Check if user has any projects (outside transaction)
        project_count = await db.projects.count_documents({"user_id": user_id_obj})
        
        # Use transaction for database operation
        async with get_transaction_session(f"Delete user {user_id}") as session:
            if session:
                # With transaction
                # Delete the user
                result = await db.users.delete_one({"_id": user_id_obj}, session=session)
                
                if result.deleted_count == 0:
                    raise HTTPException(status_code=500, detail="Error deleting user")
                    
                # Delete all related data in the transaction
                if project_count > 0:
                    # Find all project IDs first
                    projects = await db.projects.find({"user_id": user_id_obj}, session=session).to_list(None)
                    project_ids = [project["_id"] for project in projects]
                    
                    # Delete projects
                    await db.projects.delete_many({"user_id": user_id_obj}, session=session)
                    
                    # Delete all files associated with these projects
                    if project_ids:
                        await db.files.delete_many({"project_id": {"$in": project_ids}}, session=session)
            else:
                # Without transaction - operations are not atomic
                # Delete the user first
                result = await db.users.delete_one({"_id": user_id_obj})
                
                if result.deleted_count == 0:
                    raise HTTPException(status_code=500, detail="Error deleting user")
                
                # Delete related data
                if project_count > 0:
                    # Find project IDs
                    projects = await db.projects.find({"user_id": user_id_obj}).to_list(None)
                    project_ids = [project["_id"] for project in projects]
                    
                    # Delete projects
                    await db.projects.delete_many({"user_id": user_id_obj})
                    
                    # Delete files
                    if project_ids:
                        await db.files.delete_many({"project_id": {"$in": project_ids}})
        
        # Log the results
        if project_count > 0:
            logger.info(f"Deleted {project_count} projects for user {user_id}")
                    
        # Convert ObjectId to string for the response
        user_copy["_id"] = str(user_copy["_id"])
        logger.info(f"Deleted user: {user_copy.get('username', user_id)}")
        
        return DeleteUserResponseModel(**user_copy)
        
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")