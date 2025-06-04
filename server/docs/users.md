# Users API Documentation

## Overview

This API provides basic CRUD (Create, Read, Update, Delete) functionality for user management. All routes except user creation requires authentication.

## Base URL

```
http://127.0.0.1:8000/api/users
```

## Authentication

READ, UPDATE, and DELETE endpoints requires a Bearer Token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### Create User

Creates a user.

**Authentication:** NO

**Method:** `POST` <br>
**Route:** `/api/users` <br>
**Body Format:**

```
{
    "email" : <your_email>, // REQUIRED
    "username" : <your_username>, // REQUIRED
    "password" : <password>, // REQUIRED
    "password_repeat" : <passoword_repeat> // REQUIRED
}
```

**Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "username",
  "message": "User created successfully"
}
```

**Validation Rules:** <br>

- Email must have a valid domain format ('@')
- Username must not exist
- Username must be at least 3 characters long
- Username must be alphanumeric
- Password must be at least 8 characters long
- Password must contain at least one digit
- Password must contain at least one letter
- Passwords must match

**Error Responses:**

- `400 Bad Request` - Validation errors or duplicate username/email
- `422 Unprocessable Entity` - Invalid input format

---

### Get User

Fetches user information provided via a user id.

**Authentication:** YES

**Path Parameters:**

- `user_id` (string) - MongoDB ObjectId of the user

**Method:** `GET` <br>
**Route:** `/api/users/<user_id>` <br>
**Body Format:** NONE

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "username": "username",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### Update User

Updates a user's information provided via a user id.

**Authentication:** YES

**Path Parameters:**

- `user_id` (string) - MongoDB ObjectId of the user

**Method:** `PATCH` <br>
**Route:** `/api/users/<user_id>` <br>
**Body Format:**

```
{
  "email": "newemail@example.com",
  "username": "newusername",
  "full_name": "John Doe"
}
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "newusername",
  "message": "User updated successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid user ID or validation errors
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot update other user's data
- `404 Not Found` - User not found
- `409 Conflict` - Username/email already taken

---

### Delete User

Deletes a user provided via a user id.

**Authentication:** YES

**Path Parameters:**

- `user_id` (string) - MongoDB ObjectId of the user

**Method:** `DELETE` <br>
**Route:** `/api/users/<user_id>` <br>
**Body Format:** NONE <br>
**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "username",
  "message": "User deleted successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid user ID format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot delete other user's data
- `404 Not Found` - User not found

---

## Related APIs

- [Authentication API](./auth.md) - For login and token management
- [Projects API](./projects.md) - For managing user projects
