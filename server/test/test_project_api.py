import pytest
from httpx import AsyncClient
from bson import ObjectId

@pytest.mark.asyncio
async def test_create_project(test_client: AsyncClient, test_project_data):
    """Test creating a new project."""
    response = await test_client.post("/api/projects", json=test_project_data)
    
    # Check status code and response
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == test_project_data["name"]
    assert data["description"] == test_project_data["description"]
    
    # Store the project ID for later tests
    return data["_id"]

@pytest.mark.asyncio
async def test_get_project(test_client: AsyncClient, test_project_data):
    """Test retrieving a project."""
    # First create a project
    create_response = await test_client.post("/api/projects", json=test_project_data)
    project_id = create_response.json()["_id"]
    
    # Then retrieve it
    response = await test_client.get(f"/api/projects/{project_id}")
    
    # Check status code and response
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == test_project_data["name"]
    assert data["description"] == test_project_data["description"]

@pytest.mark.asyncio
async def test_update_project(test_client: AsyncClient, test_project_data):
    """Test updating a project."""
    # First create a project
    create_response = await test_client.post("/api/projects", json=test_project_data)
    project_id = create_response.json()["_id"]
    
    # Update data
    update_data = {"description": "Updated description"}
    
    # Update the project
    response = await test_client.patch(f"/api/projects/{project_id}", json=update_data)
    
    # Check status code and response
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == test_project_data["name"]  # Name should be unchanged
    assert data["description"] == update_data["description"]  # Description should be updated

@pytest.mark.asyncio
async def test_delete_project(test_client: AsyncClient, test_project_data):
    """Test deleting a project."""
    # First create a project
    create_response = await test_client.post("/api/projects", json=test_project_data)
    project_id = create_response.json()["_id"]
    
    # Delete the project
    response = await test_client.delete(f"/api/projects/{project_id}")
    
    # Check status code and response
    assert response.status_code == 200
    data = response.json()
    assert data["deleted"] == True
    
    # Verify it's actually deleted by trying to get it
    get_response = await test_client.get(f"/api/projects/{project_id}")
    assert get_response.status_code == 404