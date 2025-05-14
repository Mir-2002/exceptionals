"""Tests for the models module."""
import unittest
from src.models import User

class TestUser(unittest.TestCase):
    """Test cases for the User class."""
    
    def setUp(self):
        """Set up the test case."""
        self.user = User("testuser", "test@example.com")
    
    def test_str_representation(self):
        """Test the string representation of a user."""
        expected = "User(username=testuser, email=test@example.com)"
        self.assertEqual(str(self.user), expected)
    
    def test_password_setting(self):
        """Test setting a password."""
        self.user.set_password("password123")
        self.assertIsNotNone(self.user._password)