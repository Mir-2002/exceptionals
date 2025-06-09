import asyncio
from pathlib import Path
import sys
import httpx
import pytest
import pytest_asyncio
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError
import os

# Add the parent directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Now imports should work
from app import app

# Test Database Configuration
TEST_MONGO_URI = "mongodb://localhost:27017"
TEST_DB_NAME = "test_db_thesis"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    asyncio.set_event_loop(loop)  # This line is crucial - it sets the loop globally
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session")
async def test_db_client(event_loop):
    """Create a separate test database connection"""
    try:
        # Use the event loop provided by the fixture
        client = AsyncIOMotorClient(TEST_MONGO_URI, serverSelectionTimeoutMS=2000, io_loop=event_loop)
        await client.server_info()  # Test connection
        yield client
        await client.drop_database(TEST_DB_NAME)  # Cleanup
        client.close()
    except ServerSelectionTimeoutError:
        pytest.skip("MongoDB server not available")

@pytest_asyncio.fixture
async def test_db(test_db_client, event_loop):
    """Get the test database instance"""
    db = test_db_client[TEST_DB_NAME]
    
    # Use a try-except block to handle potential errors
    try:
        # Initialize collections without awaiting directly
        future = db.projects.create_index("name", unique=True)
        await asyncio.wait_for(future, timeout=5.0)
    except Exception as e:
        print(f"Warning: Error creating index: {e}")
        # Try creating the collection first if the index fails
        try:
            await test_db_client.admin.command("create", "projects")
        except Exception:
            # Collection might already exist
            pass
    
    return db

@pytest_asyncio.fixture
async def test_client(test_db, event_loop):
    """Test client with overridden database dependency"""
    # Import the get_db function - fix the import path
    from utils.db import get_db  # Changed from server.utils.db
    
    # Create a replacement function that returns the test database
    def override_get_db():
        return test_db
    
    # Override the dependency
    app.dependency_overrides[get_db] = override_get_db
    
    # Create the test client
    transport = httpx.ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver"
    ) as client:
        yield client
    
    # Clear dependency overrides after test
    app.dependency_overrides.clear()

@pytest.fixture
def test_project_data():
    """Sample project data for testing."""
    return {
        "name": "Test Project",
        "description": "This is a test project for pytest"
    }

@pytest_asyncio.fixture(autouse=True)
async def clean_projects_collection(test_db):
    """Clean the projects collection before each test."""
    await test_db.projects.delete_many({})  # Clear all projects
    yield
    await test_db.projects.delete_many({})  # Clean up after test