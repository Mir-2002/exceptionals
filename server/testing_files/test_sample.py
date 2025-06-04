"""
Sample file for testing documentation exclusion functionality.
This file contains a mix of classes and functions with various naming patterns.
"""
import os
from typing import List, Dict, Optional


def public_function(name: str) -> str:
    """A public function that should be included by default."""
    return f"Hello, {name}!"


def _private_function(value: int) -> int:
    """A private function that should be excluded by default."""
    return value * 2


def test_function() -> bool:
    """A test function that should be excluded by default."""
    return True


class PublicClass:
    """A normal class that should be included by default."""
    
    def __init__(self, value: str):
        """Initialize with a string value."""
        self.value = value
    
    def public_method(self) -> str:
        """Public method that should be included."""
        return self.value.upper()
    
    def _private_method(self) -> str:
        """Private method that should be excluded by default."""
        return self.value.lower()


class _PrivateClass:
    """A private class that should be excluded by default."""
    
    def __init__(self):
        """Initialize private class."""
        self.hidden = True
    
    def get_hidden(self) -> bool:
        """Get hidden status."""
        return self.hidden


class TestCase:
    """A test class that should be excluded by default."""
    
    def setup(self):
        """Setup method that should be excluded by default."""
        pass
    
    def test_something(self):
        """Test method that should be excluded by default."""
        assert True
    
    def teardown(self):
        """Teardown method that should be excluded by default."""
        pass


class SpecialFormatter:
    """A special class for text formatting."""
    
    @staticmethod
    def format_text(text: str, style: str = "normal") -> str:
        """
        Format text according to the specified style.
        
        Args:
            text: The text to format
            style: Style to apply (normal, bold, italic)
            
        Returns:
            Formatted text
        """
        if style == "bold":
            return f"**{text}**"
        elif style == "italic":
            return f"*{text}*"
        return text


def calculate_statistics(numbers: List[int]) -> Dict[str, float]:
    """
    Calculate basic statistics for a list of numbers.
    
    Args:
        numbers: List of integers to analyze
        
    Returns:
        Dictionary containing mean, median, and mode
    """
    if not numbers:
        return {"mean": 0, "median": 0, "mode": 0}
    
    n = len(numbers)
    mean = sum(numbers) / n
    
    sorted_numbers = sorted(numbers)
    if n % 2 == 0:
        median = (sorted_numbers[n//2 - 1] + sorted_numbers[n//2]) / 2
    else:
        median = sorted_numbers[n//2]
    
    # Simple mode calculation
    counts = {}
    for num in numbers:
        counts[num] = counts.get(num, 0) + 1
    mode = max(counts, key=counts.get)
    
    return {
        "mean": mean, 
        "median": median, 
        "mode": mode
    }


if __name__ == "__main__":
    print(public_function("World"))
    print(calculate_statistics([1, 2, 3, 4, 4, 5]))