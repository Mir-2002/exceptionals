"""
Sample file for testing documentation exclusion functionality.
This file contains a mix of classes and functions with various naming patterns.
"""
import os
from typing import List, Dict, Optional


def public_function(name: str) -> str:
    return f"Hello, {name}!"


def _private_function(value: int) -> int:
    return value * 2


def test_function() -> bool:
    
    return True


class PublicClass:
    
    
    def __init__(self, value: str):
        
        self.value = value
    
    def public_method(self) -> str:
        
        return self.value.upper()
    
    def _private_method(self) -> str:
        
        return self.value.lower()


class _PrivateClass:
    
    
    def __init__(self):
        
        self.hidden = True
    
    def get_hidden(self) -> bool:
        
        return self.hidden


class TestCase:
    
    
    def setup(self):
        
        pass
    
    def test_something(self):
        
        assert True
    
    def teardown(self):
        
        pass


class SpecialFormatter:
    
    
    @staticmethod
    def format_text(text: str, style: str = "normal") -> str:
        
        if style == "bold":
            return f"**{text}**"
        elif style == "italic":
            return f"*{text}*"
        return text


def calculate_statistics(numbers: List[int]) -> Dict[str, float]:
   
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