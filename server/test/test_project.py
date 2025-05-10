import pytest
from model.Project import ProjectModel
from datetime import datetime, timezone


def test_valid_project():
    """Test creating a valid ProjectModel."""
    project = ProjectModel(
        name="Valid Project",
        description="This is a valid project description.",
        created_at=datetime.now(timezone.utc)
    )
    assert project.name == "Valid Project"
    assert project.description == "This is a valid project description."
    assert isinstance(project.created_at, datetime)


def test_empty_name():
    """Test that an empty name raises a ValueError."""
    with pytest.raises(ValueError, match="Project name cannot be empty or whitespace."):
        ProjectModel(
            name="   ",
            description="This is a valid project description.",
            created_at=datetime.now(timezone.utc)
        )


def test_long_name():
    """Test that a name exceeding 100 characters raises a ValueError."""
    long_name = "A" * 101  # 101 characters
    with pytest.raises(ValueError, match="Project name cannot exceed 100 characters."):
        ProjectModel(
            name=long_name,
            description="This is a valid project description.",
            created_at=datetime.now(timezone.utc)
        )


def test_empty_description():
    """Test that an empty description raises a ValueError."""
    with pytest.raises(ValueError, match="Project description cannot be empty or whitespace."):
        ProjectModel(
            name="Valid Project",
            description="   ",
            created_at=datetime.now(timezone.utc)
        )


def test_long_description():
    """Test that a description exceeding 500 characters raises a ValueError."""
    long_description = "A" * 501  # 501 characters
    with pytest.raises(ValueError, match="Project description cannot exceed 500 characters."):
        ProjectModel(
            name="Valid Project",
            description=long_description,
            created_at=datetime.now(timezone.utc)
        )