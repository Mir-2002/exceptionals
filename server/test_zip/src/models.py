from typing import Optional

class User:
    
    
    def __init__(self, username: str, email: str):
        
        self.username = username
        self.email = email
        self._password = None
    
    def __str__(self) -> str:
        
        return f"User(username={self.username}, email={self.email})"
    
    def _hash_password(self, password: str) -> str:
        
        return f"hashed_{password}"
    
    def set_password(self, password: str) -> None:
        
        self._password = self._hash_password(password)

class _InternalCache:
    
    
    def __init__(self):
        
        self._cache = {}
    
    def get(self, key: str) -> Optional[str]:
        
        return self._cache.get(key)
    
    def set(self, key: str, value: str) -> None:
        
        self._cache[key] = value