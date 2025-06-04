from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import logging

# Set up logging
logger = logging.getLogger(__name__)

load_dotenv()

# Database Configuration
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

# Check if required environment variables are set
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is not set")
if not DB_NAME:
    raise ValueError("DB_NAME environment variable is not set")

class Database:
    client: AsyncIOMotorClient = None
    db = None
    
    # Implement as a singleton to ensure one instance
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance.client = None
            cls._instance.db = None
        return cls._instance

    async def connect_to_database(self, app: FastAPI = None):
        """Connect to MongoDB database with transaction support"""
        if self.client is None:
            try:
                # Configure client with write concern for transactions
                self.client = AsyncIOMotorClient(
                    MONGO_URI,
                    retryWrites=True,
                    w="majority"  # Important for transactions
                )
                self.db = self.client[DB_NAME]
                
                # Add database connection info to app state if app is provided
                if app:
                    app.state.mongodb_client = self.client
                    app.state.mongodb = self.db
                
                logger.info(f"Connected to MongoDB database: {DB_NAME}")
                
                # Setup collections
                await self.setup_collections()
                
            except Exception as e:
                logger.error(f"Error connecting to MongoDB: {e}")
                raise e
        return self.db

    async def supports_transactions(self):
        """Check if the MongoDB server supports transactions"""
        try:
            # Try to start a session and transaction as a test
            async with await self.client.start_session() as session:
                async with session.start_transaction():
                    # Just run a simple command to test
                    await self.db.command("ping", session=session)
                    return True
        except Exception as e:
            logger.warning(f"MongoDB transactions not supported: {e}")
            return False

    @asynccontextmanager
    async def transaction(self, description="Database transaction"):
        """
        Context manager for MongoDB operations with transaction support if available.
        Falls back to regular operations if transactions aren't supported.
        
        Usage:
            async with db_instance.transaction("Create project") as session:
                if session:  # Transaction supported
                    await db_instance.db.projects.insert_one(data, session=session)
                else:  # No transaction support
                    await db_instance.db.projects.insert_one(data)
        """
        if self.client is None:
            await self.connect_to_database()
        
        # Check if transactions are supported (cache the result)
        if not hasattr(self, "_transactions_supported"):
            self._transactions_supported = await self.supports_transactions()
        
        if self._transactions_supported:
            # Use transactions if supported
            session = await self.client.start_session()
            
            try:
                logger.info(f"Starting transaction: {description}")
                async with session.start_transaction():
                    # Yield control back to the calling function with session
                    yield session
                    
                    # Transaction commits automatically when the context exits without exception
                    logger.info(f"Committing transaction: {description}")
                    
            except Exception as e:
                logger.error(f"Transaction error ({description}): {e}")
                # Re-raise the exception for proper error handling
                raise
            finally:
                # Always close the session
                await session.end_session()
                logger.info(f"Transaction session ended: {description}")
        else:
            # Fallback for non-replica set MongoDB - no transaction support
            logger.info(f"Executing without transaction (not supported): {description}")
            yield None  # Return None to indicate no transaction support

    async def setup_collections(self):
        """Setup all required collections and indexes"""
        try:
            await self.setup_users_collection()
            # Add other collection setup methods as needed
        except Exception as e:
            logger.error(f"Error setting up collections: {e}")
            raise e

    async def setup_users_collection(self):
        """Setup users collection and its indexes"""
        try:
            # Create indexes for the "users" collection
            await self.db.users.create_index("email", unique=True)
            await self.db.users.create_index("username", unique=True)
            await self.db.users.create_index("is_admin")
            await self.db.users.create_index("disabled")
            logger.info("Users collection setup completed.")
        except Exception as e:
            logger.error(f"Error setting up users collection: {e}")
            raise e

    async def close_database_connection(self):
        """Close the database connection"""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            logger.info("MongoDB connection closed")

# Create a singleton instance
db = Database()

def get_db():
    """Get database instance for dependency injection"""
    return db.db

@asynccontextmanager
async def get_transaction_session(description="Database transaction"):
    """
    Get a transaction session for use in controllers.
    Returns None if transactions aren't supported.
    
    Usage:
        async with get_transaction_session("Update user profile") as session:
            if session:  # Transaction supported
                await db.users.update_one({"_id": user_id}, update, session=session)
            else:  # No transaction support
                await db.users.update_one({"_id": user_id}, update)
    """
    async with db.transaction(description) as session:
        yield session