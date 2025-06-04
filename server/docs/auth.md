# Authentication API Documentation

## Overview

The Authentication API provides secure user authentication using JWT (JSON Web Tokens) with a 7-day token expiration. It handles user login and provides current user information retrieval.

## Base URL

```
http://127.0.0.1:8000/api
```

## Authentication

The login endpoint does not require authentication. The `/auth/me` endpoint requires a valid Bearer token.

---

## Endpoints

### 1. User Login

Authenticates a user and returns a JWT access token.

**Endpoint:** `POST /auth/login`

**Authentication:** Not required

**Request Body:** (application/x-www-form-urlencoded)

```
username=johndoe&password=securepassword123
```

**Response:** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huZG9lIiwidXNlcl9pZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImV4cCI6MTcwNDY3MjAwMH0.signature",
  "token_type": "bearer",
  "user_id": "507f1f77bcf86cd799439011",
  "username": "johndoe",
  "expires_at": 1704672000
}
```

**Token Details:**

- **Token Type**: Bearer token
- **Expiration**: 7 days from issue time
- **Algorithm**: HS256
- **Contains**: Username, User ID, and expiration timestamp

**Error Responses:**

- `401 Unauthorized` - Incorrect username or password

```json
{
  "detail": "Incorrect username or password"
}
```

---

### 2. Get Current User

Retrieves information about the currently authenticated user.

**Endpoint:** `GET /auth/me`

**Authentication:** Required

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Note:** The `hashed_password` field is automatically excluded from the response for security.

**Error Responses:**

- `401 Unauthorized` - Missing, invalid, or expired token

```json
{
  "detail": "Could not validate credentials"
}
```

---

## JavaScript Examples

### Login and Token Storage

```javascript
// Login function with automatic token storage
async function login(username, password) {
  try {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    const tokenData = await response.json();

    // Store token in localStorage
    localStorage.setItem("access_token", tokenData.access_token);
    localStorage.setItem("user_id", tokenData.user_id);
    localStorage.setItem("username", tokenData.username);
    localStorage.setItem("token_expires_at", tokenData.expires_at);

    console.log("✅ Login successful");
    console.log("👤 User:", tokenData.username);
    console.log("🔑 Token expires:", new Date(tokenData.expires_at * 1000));

    return tokenData;
  } catch (error) {
    console.error("❌ Login failed:", error.message);
    throw error;
  }
}

// Usage
login("johndoe", "securepassword123")
  .then((tokenData) => {
    console.log("Login successful:", tokenData);
  })
  .catch((error) => {
    console.error("Login error:", error);
  });
```

### Get Current User Information

```javascript
// Get current user info with stored token
async function getCurrentUser() {
  try {
    const token = localStorage.getItem("access_token");

    if (!token) {
      throw new Error("No access token found. Please login first.");
    }

    const response = await fetch("http://localhost:8000/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid - clear storage
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("username");
        localStorage.removeItem("token_expires_at");
        throw new Error("Token expired. Please login again.");
      }

      const error = await response.json();
      throw new Error(error.detail || "Failed to get user info");
    }

    const userData = await response.json();
    console.log("✅ User info retrieved:", userData);

    return userData;
  } catch (error) {
    console.error("❌ Failed to get user info:", error.message);
    throw error;
  }
}

// Usage
getCurrentUser()
  .then((user) => {
    console.log("Current user:", user);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```

### Token Validation and Auto-Refresh Check

```javascript
// Check if token is valid and not expired
function isTokenValid() {
  const token = localStorage.getItem("access_token");
  const expiresAt = localStorage.getItem("token_expires_at");

  if (!token || !expiresAt) {
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const tokenExpiresAt = parseInt(expiresAt);

  // Check if token expires within the next hour (3600 seconds)
  const isExpiringSoon = tokenExpiresAt - currentTime < 3600;

  if (isExpiringSoon) {
    console.log("⚠️ Token expires soon. Consider re-authenticating.");
  }

  return currentTime < tokenExpiresAt;
}

// Authenticated API request wrapper
async function authenticatedRequest(url, options = {}) {
  if (!isTokenValid()) {
    throw new Error("No valid token. Please login first.");
  }

  const token = localStorage.getItem("access_token");

  const defaultOptions = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, mergedOptions);

    if (response.status === 401) {
      // Token expired - clear storage
      localStorage.clear();
      throw new Error("Session expired. Please login again.");
    }

    return response;
  } catch (error) {
    console.error("❌ Authenticated request failed:", error);
    throw error;
  }
}

// Usage for other API calls
authenticatedRequest("http://localhost:8000/api/projects")
  .then((response) => response.json())
  .then((projects) => console.log("Projects:", projects))
  .catch((error) => console.error("Error:", error));
```

### Complete Authentication Helper Class

```javascript
class AuthService {
  constructor(baseUrl = "http://localhost:8000/api") {
    this.baseUrl = baseUrl;
  }

  async login(username, password) {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }

    const tokenData = await response.json();
    this.storeToken(tokenData);
    return tokenData;
  }

  storeToken(tokenData) {
    localStorage.setItem("access_token", tokenData.access_token);
    localStorage.setItem("user_id", tokenData.user_id);
    localStorage.setItem("username", tokenData.username);
    localStorage.setItem("token_expires_at", tokenData.expires_at);
  }

  getToken() {
    return localStorage.getItem("access_token");
  }

  isAuthenticated() {
    const token = this.getToken();
    const expiresAt = localStorage.getItem("token_expires_at");

    if (!token || !expiresAt) return false;

    return Math.floor(Date.now() / 1000) < parseInt(expiresAt);
  }

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("token_expires_at");
  }

  async getCurrentUser() {
    const response = await this.authenticatedRequest("/auth/me");
    return response.json();
  }

  async authenticatedRequest(endpoint, options = {}) {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    const token = this.getToken();

    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }
}

// Usage
const auth = new AuthService();

// Login
auth
  .login("johndoe", "password123")
  .then(() => console.log("Logged in successfully"))
  .catch(console.error);

// Check authentication status
if (auth.isAuthenticated()) {
  console.log("User is authenticated");
} else {
  console.log("User needs to login");
}
```

---

## Security Notes

1. **Token Storage**: Store tokens securely (consider httpOnly cookies for production)
2. **Token Expiration**: Tokens expire after 7 days for security
3. **HTTPS**: Always use HTTPS in production environments
4. **Secret Key**: Change the secret key in production and use environment variables
5. **Password Security**: Passwords are hashed using bcrypt with 12 rounds

---

## Token Details

### JWT Payload Structure

```json
{
  "sub": "johndoe",
  "user_id": "507f1f77bcf86cd799439011",
  "exp": 1704672000
}
```

- `sub`: Username (subject)
- `user_id`: MongoDB ObjectId of the user
- `exp`: Expiration timestamp (Unix timestamp)

### Token Validation

- Algorithm: HS256
- Automatic expiration handling
- Invalid tokens return 401 Unauthorized
- Expired tokens are automatically rejected

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
- `401` - Unauthorized (invalid credentials or expired token)
- `422` - Unprocessable Entity (validation errors)
- `500` - Internal Server Error

---

## Related APIs

- [Users API](./users.md) - For user management
- [Projects API](./projects.md) - For project management
- [Files API](./files.md) - For file operations
