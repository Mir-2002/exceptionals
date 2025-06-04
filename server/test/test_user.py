import pytest
from server.model.User import UserCreateModel

def test_username_too_short():
    with pytest.raises(ValueError, match="Username must be at least 3 characters long"):
        UserCreateModel(email="test@example.com", username="ab", password="Test1234", password_repeat="Test1234")

def test_password_too_short():
    with pytest.raises(ValueError, match="Password must be at least 8 characters long"):
        UserCreateModel(email="test@example.com", username="validuser", password="short", password_repeat="short")

def test_password_no_number():
    with pytest.raises(ValueError, match="Password must contain at least one digit"):
        UserCreateModel(email="test@example.com", username="validuser", password="NoDigitsHere", password_repeat="NoDigitsHere")

def test_password_mismatch():
    with pytest.raises(ValueError, match="Passwords do not match"):
        UserCreateModel(email="test@example.com", username="validuser", password="Test1234", password_repeat="DifferentPass")
    