"""Models for the application."""
from typing import Optional

class User:
    """Represents a user in the system."""
    
    def __init__(self, username: str, email: str):
        """
        Initialize a new user.
        
        Args:
            username: The user's username
            email: The user's email address
        """
        self.username = username
        self.email = email
        self._password = None
    
    def __str__(self) -> str:
        """Return string representation of the user."""
        return f"User(username={self.username}, email={self.email})"
    
    def _hash_password(self, password: str) -> str:
        """Hash a password (private method)."""
        return f"hashed_{password}"
    
    def set_password(self, password: str) -> None:
        """Set user password."""
        self._password = self._hash_password(password)

class _InternalCache:
    """Internal cache implementation (private class)."""
    
    def __init__(self):
        """Initialize the cache."""
        self._cache = {}
    
    def get(self, key: str) -> Optional[str]:
        """Get a value from the cache."""
        return self._cache.get(key)
    
    def set(self, key: str, value: str) -> None:
        """Set a value in the cache."""
        self._cache[key] = value