# Files API Documentation

## Overview

The Files API provides comprehensive file management functionality including file uploads, retrieval, structure analysis, content access, exclusion management, and deletion. All endpoints require authentication and proper project ownership verification.

## NOTE

A /testing_files folder is provided containing a test file and folder.

## Base URL

```
http://127.0.0.1:8000/api
```

## Authentication

All endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Upload File to Project

Uploads a Python file to a specific project and extracts its code structure.

**Endpoint:** `POST /projects/{project_id}/files`

**Authentication:** Required (Project Owner)

**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Request Body:** (multipart/form-data)

- `file` (file) - Python (.py) file to upload

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439013",
  "project_id": "507f1f77bcf86cd799439011",
  "file_name": "main.py",
  "size": 1024,
  "relative_path": "src/main.py",
  "created_at": "2024-01-01T00:00:00Z",
  "processed": true,
  "file_path": "/uploads/507f1f77bcf86cd799439011/main.py",
  "content_type": "text/x-python",
  "structure": {
    "file_name": "main.py",
    "classes": [],
    "functions": [],
    "error": null
  }
}
```

**Validation Rules:**

- Only Python (.py) files are supported
- File name cannot contain invalid characters
- File size must not exceed 100MB
- File name must be unique within the project

**Error Responses:**

- `400 Bad Request` - Invalid project ID, unsupported file type, or invalid filename
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not project owner
- `404 Not Found` - Project not found
- `409 Conflict` - File with same name already exists

---

### 2. Get Project Files

Retrieves all files belonging to a specific project with pagination.

**Endpoint:** `GET /projects/{project_id}/files`

**Authentication:** Required

**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Query Parameters:**

- `skip` (integer, optional) - Number of files to skip (default: 0, min: 0)
- `limit` (integer, optional) - Maximum number of files to return (default: 100, min: 1, max: 1000)

**Response:** `200 OK`

```json
[
  {
    "id": "507f1f77bcf86cd799439013",
    "project_id": "507f1f77bcf86cd799439011",
    "file_name": "main.py",
    "size": 1024,
    "relative_path": "src/main.py",
    "created_at": "2024-01-01T00:00:00Z",
    "processed": true,
    "file_path": "/uploads/507f1f77bcf86cd799439011/main.py",
    "content_type": "text/x-python",
    "structure": {
      "file_name": "main.py",
      "classes": [],
      "functions": []
    }
  }
]
```

**Error Responses:**

- `400 Bad Request` - Invalid project ID or query parameters
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Project not found

---

### 3. Get File by ID

Retrieves detailed information about a specific file.

**Endpoint:** `GET /files/{file_id}`

**Authentication:** Required

**Path Parameters:**

- `file_id` (string) - MongoDB ObjectId of the file

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439013",
  "project_id": "507f1f77bcf86cd799439011",
  "file_name": "main.py",
  "size": 1024,
  "relative_path": "src/main.py",
  "created_at": "2024-01-01T00:00:00Z",
  "processed": true,
  "file_path": "/uploads/507f1f77bcf86cd799439011/main.py",
  "content_type": "text/x-python",
  "structure": {
    "file_name": "main.py",
    "classes": [],
    "functions": []
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file ID format
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - File not found

---

### 4. Get File Structure

Retrieves the parsed code structure of a Python file including classes, functions, and methods.

**Endpoint:** `GET /files/{file_id}/structure`

**Authentication:** Required

**Path Parameters:**

- `file_id` (string) - MongoDB ObjectId of the file

**Query Parameters:**

- `include_code` (boolean, optional) - Include source code in the response (default: false)
- `use_default_exclusions` (boolean, optional) - Apply default exclusion patterns (default: true)

**Response:** `200 OK`

```json
{
  "file_name": "main.py",
  "classes": [
    {
      "name": "MyClass",
      "line": 10,
      "end_line": 25,
      "docstring": "A sample class",
      "bases": ["BaseClass"],
      "code": null,
      "excluded": false,
      "default_exclusion": false,
      "inherited_exclusion": false,
      "methods": [
        {
          "name": "my_method",
          "line": 15,
          "end_line": 20,
          "args": ["self", "param1"],
          "docstring": "A sample method",
          "decorators": ["@property"],
          "code": null,
          "excluded": false,
          "default_exclusion": false,
          "inherited_exclusion": false
        }
      ]
    }
  ],
  "functions": [
    {
      "name": "my_function",
      "line": 5,
      "end_line": 8,
      "args": ["param1", "param2"],
      "docstring": "A sample function",
      "decorators": [],
      "code": null,
      "excluded": false,
      "default_exclusion": false,
      "inherited_exclusion": false
    }
  ],
  "error": null
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file ID format
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - File not found or file content not found

---

### 5. Get File Content

Retrieves the raw source code content of a file.

**Endpoint:** `GET /files/{file_id}/content`

**Authentication:** Required

**Path Parameters:**

- `file_id` (string) - MongoDB ObjectId of the file

**Response:** `200 OK`

```json
{
  "file_id": "507f1f77bcf86cd799439013",
  "file_name": "main.py",
  "content": "def main():\n    print('Hello World')\n\nif __name__ == '__main__':\n    main()",
  "size": 1024,
  "content_type": "text/x-python"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file ID format
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - File not found or file content not found

---

### 6. Delete File

Deletes a file from the project and removes its physical file from storage.

**Endpoint:** `DELETE /files/{file_id}`

**Authentication:** Required (File Owner)

**Path Parameters:**

- `file_id` (string) - MongoDB ObjectId of the file

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "File main.py deleted successfully",
  "file_id": "507f1f77bcf86cd799439013"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file ID format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not file owner
- `404 Not Found` - File not found

---

### 7. Update File Exclusions

Sets which classes and functions to exclude from documentation generation for a specific file.

**Endpoint:** `POST /files/{file_id}/exclusions`

**Authentication:** Required (File Owner)

**Path Parameters:**

- `file_id` (string) - MongoDB ObjectId of the file

**Request Body:**

```json
{
  "file_id": "507f1f77bcf86cd799439013",
  "excluded_classes": ["TestClass", "DebugHelper"],
  "excluded_functions": [
    "test_function",
    "debug_print",
    "MyClass.private_method"
  ]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Exclusions updated successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file ID format or missing exclusions data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not file owner
- `404 Not Found` - File not found

---

### 8. Get File Exclusions

Retrieves current exclusion settings for a file.

**Endpoint:** `GET /files/{file_id}/exclusions`

**Authentication:** Required (File Owner)

**Path Parameters:**

- `file_id` (string) - MongoDB ObjectId of the file

**Response:** `200 OK`

```json
{
  "file_id": "507f1f77bcf86cd799439013",
  "excluded_classes": ["TestClass", "DebugHelper"],
  "excluded_functions": [
    "test_function",
    "debug_print",
    "MyClass.private_method"
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file ID format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not file owner
- `404 Not Found` - File not found

---

## File Processing

### Supported File Types

- Python (.py) files only
- Maximum file size: 100MB
- UTF-8 and latin-1 encodings supported

### Structure Analysis

The API automatically analyzes uploaded Python files to extract:

- **Classes**: Name, line numbers, docstrings, base classes, methods
- **Functions**: Name, line numbers, arguments, docstrings, decorators
- **Methods**: Name, line numbers, arguments, docstrings, decorators

### Default Exclusions

When `use_default_exclusions=true`, the following patterns are automatically excluded:

**Default Excluded Functions:**

- `test_*` - Test functions
- `_*` - Private methods/functions
- `setup` - Setup functions
- `teardown` - Teardown functions

**Default Excluded Classes:**

- `Test*` - Test classes
- `*TestCase` - Test case classes
- `_*` - Private classes

---

## Security Notes

1. **File Ownership**: Users can only access/modify files in their own projects
2. **File Validation**: All uploaded files are validated for type and content
3. **Path Security**: File paths are sanitized to prevent directory traversal
4. **Content Security**: File content is validated and safely stored

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
- `409` - Conflict (duplicate file)
- `422` - Unprocessable Entity (validation errors)
- `500` - Internal Server Error

---

## Related APIs

- [Authentication API](./auth.md) - For login and token management
- [Users API](./users.md) - For user management
- [Projects API](./projects.md) - For project management
