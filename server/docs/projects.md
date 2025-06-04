# Projects API Documentation

## Overview

The Projects API provides comprehensive project management functionality including creation, retrieval, updates, deletion, structure analysis, exclusion management, and ZIP file uploads. All endpoints require authentication.

## Base URL

```
http://127.0.0.1:8000/api/projects
```

## Authentication

All endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Create Project

Creates a new project for the authenticated user.

**Endpoint:** `POST /projects`

**Authentication:** Required

**Request Body:**

```json
{
  "name": "My Python Project",
  "description": "A sample Python project for documentation generation",
  "excluded_directories": [],
  "excluded_files": []
}
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "My Python Project",
  "description": "A sample Python project for documentation generation",
  "excluded_directories": [],
  "excluded_files": [],
  "created_at": "2024-01-01T00:00:00Z",
  "user_id": "507f1f77bcf86cd799439012",
  "message": "Project created successfully",
  "file_count": 0,
  "processed_files": 0,
  "processing_status": "Not Started"
}
```

**Validation Rules:**

- Project name cannot be empty or whitespace
- Project name cannot exceed 100 characters
- Project name must be unique for the user
- Description cannot be empty or whitespace
- Description cannot exceed 500 characters

**Error Responses:**

- `400 Bad Request` - Validation errors or duplicate project name
- `401 Unauthorized` - Missing or invalid token
- `422 Unprocessable Entity` - Invalid input format

---

### 2. Get Project

Retrieves project information by project ID.

**Endpoint:** `GET /projects/{project_id}`

**Authentication:** Required

**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "My Python Project",
  "description": "A sample Python project for documentation generation",
  "excluded_directories": [],
  "excluded_files": [],
  "created_at": "2024-01-01T00:00:00Z",
  "user_id": "507f1f77bcf86cd799439012",
  "message": "Operation successful",
  "file_count": 5,
  "processed_files": 3,
  "processing_status": "In Progress"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid project ID format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot access other user's project
- `404 Not Found` - Project not found

---

### 3. Update Project

Updates project information.

**Endpoint:** `PATCH /projects/{project_id}`

**Authentication:** Required

**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Request Body:** (All fields optional)

```json
{
  "name": "Updated Project Name",
  "description": "Updated project description"
}
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Updated Project Name",
  "description": "Updated project description",
  "excluded_directories": [],
  "excluded_files": [],
  "created_at": "2024-01-01T00:00:00Z",
  "user_id": "507f1f77bcf86cd799439012",
  "message": "Project updated successfully",
  "file_count": 5,
  "processed_files": 3,
  "processing_status": "In Progress",
  "updated_fields": {
    "name": "Updated Project Name",
    "description": "Updated project description"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid project ID, validation errors, or duplicate name
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot update other user's project
- `404 Not Found` - Project not found

---

### 4. Delete Project

Deletes a project and all associated files.

**Endpoint:** `DELETE /projects/{project_id}`

**Authentication:** Required

**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "message": "Project deleted successfully with 5 files removed"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid project ID format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot delete other user's project
- `404 Not Found` - Project not found

---

### 5. Get Project Structure

Retrieves the folder and file structure of a project as a tree.

**Endpoint:** `GET /projects/{project_id}/structure`

**Authentication:** Required

**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Query Parameters:**

- `use_default_exclusions` (boolean, optional) - Apply default exclusions to common files/folders (default: true)

**Response:** `200 OK`

```json
{
  "project_id": "507f1f77bcf86cd799439011",
  "project_name": "My Python Project",
  "root": {
    "name": "root",
    "type": "folder",
    "excluded": false,
    "default_exclusion": false,
    "inherited_exclusion": false,
    "children": [
      {
        "name": "src",
        "type": "folder",
        "excluded": false,
        "default_exclusion": false,
        "inherited_exclusion": false,
        "children": [
          {
            "name": "main.py",
            "type": "file",
            "size": 1024,
            "processed": true,
            "id": "507f1f77bcf86cd799439013",
            "excluded": false,
            "default_exclusion": false,
            "inherited_exclusion": false
          }
        ]
      }
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid project ID format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot access other user's project
- `404 Not Found` - Project not found

---

### 6. Update Project Exclusions

Sets which directories and files to exclude from project documentation.

**Endpoint:** `POST /projects/{project_id}/exclusions`

**Authentication:** Required

**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Request Body:**

```json
{
  "project_id": "507f1f77bcf86cd799439011",
  "excluded_directories": ["tests", "docs", "__pycache__"],
  "excluded_files": ["setup.py", "conftest.py", "test_*.py"]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Exclusions updated successfully",
  "project_id": "507f1f77bcf86cd799439011"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid project ID format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot update other user's project
- `404 Not Found` - Project not found

---

### 7. Get Project Exclusions

Retrieves current exclusions for a project.

**Endpoint:** `GET /projects/{project_id}/exclusions`

**Authentication:** Required

**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Response:** `200 OK`

```json
{
  "project_id": "507f1f77bcf86cd799439011",
  "excluded_directories": ["tests", "docs", "__pycache__"],
  "excluded_files": ["setup.py", "conftest.py", "test_*.py"]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid project ID format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot access other user's project
- `404 Not Found` - Project not found

---

### 8. Upload ZIP File

Uploads a ZIP file containing a project structure and processes Python files.

**Endpoint:** `POST /projects/{project_id}/upload-zip`

**Authentication:** Required

**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Request Body:** (multipart/form-data)

- `zip_file` (file) - ZIP file containing project structure

**Response:** `200 OK`

```json
{
  "message": "Successfully uploaded and processed 10 files (7 Python files processed)",
  "processed_count": 7,
  "total_files": 10,
  "files": [
    {
      "id": "507f1f77bcf86cd799439013",
      "file_name": "main.py",
      "relative_path": "src/main.py",
      "size": 1024,
      "processed": true
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid project ID, invalid file type, or file processing error
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot upload to other user's project
- `404 Not Found` - Project not found

---

## Security Notes

1. **Project Ownership**: Users can only access/modify their own projects
2. **File Security**: Uploaded files are stored securely and validated
3. **Authorization**: All operations require valid authentication
4. **Input Validation**: All inputs are validated and sanitized

---

## Default Exclusions

When `use_default_exclusions=true`, the following patterns are automatically excluded:

**Default Excluded Directories:**

- `__pycache__`, `.git`, `.github`, `tests`, `test`, `docs`, `venv`, `.venv`, `env`, `node_modules`

**Default Excluded Files:**

- `setup.py`, `conftest.py`, `__init__.py`, `__main__.py`, `test_*.py`, `*_test.py`

---

## Error Handling

All errors follow this format:

```json
{
  "detail": "Error message description"
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (validation errors)
- `500` - Internal Server Error

---

## Related APIs

- [Authentication API](./auth.md) - For login and token management
- [Users API](./users.md) - For user management
- [Files API](./files.md) - For individual file operations
