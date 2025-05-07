from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import FastAPI
import os
from dotenv import load_dotenv

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
        """Connect to MongoDB database"""
        if self.client is None:
            try:
                self.client = AsyncIOMotorClient(MONGO_URI)
                self.db = self.client[DB_NAME]
                
                # Add database connection info to app state if app is provided
                if app:
                    app.state.mongodb_client = self.client
                    app.state.mongodb = self.db
                
                print(f"Connected to MongoDB database: {DB_NAME}")
                
                # Setup collections
                await self.setup_collections()
                
            except Exception as e:
                print(f"Error connecting to MongoDB: {e}")
                raise e
        return self.db

    async def setup_collections(self):
        """Setup all required collections and indexes"""
        try:
            await self.setup_users_collection()
            # Add other collection setup methods as needed
        except Exception as e:
            print(f"Error setting up collections: {e}")
            raise e

    async def setup_users_collection(self):
        """Setup users collection and its indexes"""
        try:
            # Create indexes for the "users" collection
            await self.db.users.create_index("email", unique=True)
            await self.db.users.create_index("username", unique=True)
            await self.db.users.create_index("is_admin")
            await self.db.users.create_index("disabled")
            print("Users collection setup completed.")
        except Exception as e:
            print(f"Error setting up users collection: {e}")
            raise e

    async def close_database_connection(self):
        """Close the database connection"""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            print("MongoDB connection closed")

# Create a singleton instance
db = Database()

def get_db():
    return db.db