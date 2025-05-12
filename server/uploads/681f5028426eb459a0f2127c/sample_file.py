# sample_module.py
"""
This is a sample Python module designed for testing file uploads.
It contains various classes and functions with docstrings to test parsing.
"""
import datetime
from typing import List, Dict, Optional, Any


class Person:
    """
    A class representing a person with basic attributes.
    
    This class demonstrates nested class structure parsing.
    """
    
    def __init__(self, name: str, age: int, email: Optional[str] = None):
        """Initialize a new Person instance.
        
        Args:
            name: The person's full name
            age: The person's age in years
            email: The person's email address (optional)
        """
        self.name = name
        self.age = age
        self.email = email
        self._created_at = datetime.datetime.now()
    
    def get_info(self) -> Dict[str, Any]:
        """Return a dictionary with the person's information.
        
        Returns:
            Dictionary containing name, age, and email
        """
        return {
            "name": self.name,
            "age": self.age,
            "email": self.email
        }
    
    @property
    def is_adult(self) -> bool:
        """Check if the person is an adult (18 or older)."""
        return self.age >= 18


class Student(Person):
    """
    A student class that inherits from Person.
    
    This class demonstrates inheritance for the parser to detect.
    """
    
    def __init__(self, name: str, age: int, student_id: str, courses: List[str] = None):
        """Initialize a Student instance.
        
        Args:
            name: The student's full name
            age: The student's age
            student_id: Unique identifier for the student
            courses: List of course names the student is enrolled in
        """
        super().__init__(name, age)
        self.student_id = student_id
        self.courses = courses or []
    
    def add_course(self, course_name: str) -> None:
        """Add a course to the student's course list.
        
        Args:
            course_name: Name of the course to add
        """
        if course_name not in self.courses:
            self.courses.append(course_name)
    
    def get_course_count(self) -> int:
        """Get the number of courses the student is enrolled in.
        
        Returns:
            Number of courses
        """
        return len(self.courses)


def calculate_average(numbers: List[float]) -> float:
    """
    Calculate the average of a list of numbers.
    
    Args:
        numbers: List of numbers to average
        
    Returns:
        The average value
        
    Raises:
        ValueError: If the list is empty
    """
    if not numbers:
        raise ValueError("Cannot calculate average of empty list")
    return sum(numbers) / len(numbers)


def generate_report(students: List[Student]) -> Dict[str, Any]:
    """
    Generate a summary report for a list of students.
    
    Args:
        students: List of Student objects
        
    Returns:
        Dictionary with summary statistics
    """
    total_students = len(students)
    adults = sum(1 for student in students if student.is_adult)
    avg_age = sum(student.age for student in students) / total_students if total_students else 0
    
    return {
        "total_students": total_students,
        "adult_students": adults,
        "average_age": avg_age,
        "courses_per_student": calculate_average([len(student.courses) for student in students]) if students else 0
    }


if __name__ == "__main__":
    # Example usage
    students = [
        Student("Alice Smith", 20, "S12345", ["Math", "Computer Science"]),
        Student("Bob Johnson", 19, "S12346", ["Physics", "Chemistry", "Biology"]),
        Student("Charlie Brown", 17, "S12347", ["Art", "Music"])
    ]
    
    for student in students:
        print(f"Student: {student.name}, Age: {student.age}, Courses: {student.get_course_count()}")
    
    report = generate_report(students)
    print(f"Report: {report}")