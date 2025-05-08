# conftest.py
import sys
from pathlib import Path
import pytest
from unittest.mock import AsyncMock, patch
from bson import ObjectId
from fastapi.testclient import TestClient

# Get the root directory (server/)
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

# Import after setting path
from server.app import app
from server.utils.db import get_db, db

@pytest.fixture
def mock_mongodb():
    """Create a mock MongoDB database with the necessary collections and methods."""
    mock_db = AsyncMock()
    
    # Setup users collection with necessary methods
    mock_db.users = AsyncMock()
    mock_db.users.find_one = AsyncMock(return_value=None)
    mock_db.users.insert_one = AsyncMock()
    mock_db.users.insert_one.return_value = AsyncMock(inserted_id=ObjectId())
    mock_db.users.create_index = AsyncMock()
    
    # Add other collections as needed
    
    return mock_db

@pytest.fixture
def test_app(mock_mongodb):
    """Create a test app with mocked database dependency."""
    # Override the get_db dependency
    app.dependency_overrides[get_db] = lambda: mock_mongodb
    
    # Important: Also patch the db singleton instance's db attribute
    with patch.object(db, 'db', mock_mongodb):
        yield app
    
    # Clean up after tests
    app.dependency_overrides = {}

@pytest.fixture
def test_client(test_app):
    """Create a TestClient using the test app with mocked dependencies."""
    with TestClient(test_app) as client:
        yield client