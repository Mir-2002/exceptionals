import logging
from typing import Dict, Any, Optional
from functools import lru_cache
import time

logger = logging.getLogger(__name__)

class TaskStatus:
    """Task status constants"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskQueue:
    """
    Simple in-memory task queue for tracking background documentation tasks.
    """
    
    def __init__(self):
        """Initialize an empty task queue"""
        self.tasks = {}
    
    def add_task(self, task_id: str, description: str) -> Dict[str, Any]:
        """
        Add a new task to the queue
        
        Args:
            task_id: Unique identifier for the task
            description: Description of the task
            
        Returns:
            Task data dictionary
        """
        self.tasks[task_id] = {
            "task_id": task_id,
            "status": TaskStatus.PENDING,
            "description": description,
            "result": None,
            "error": None,
            "created_at": time.time(),
            "updated_at": time.time()
        }
        return self.tasks[task_id]
    
    def update_task(self, task_id: str, status: str, result: Any = None, error: str = None) -> Optional[Dict[str, Any]]:
        """
        Update the status of a task
        
        Args:
            task_id: The task to update
            status: New status (use TaskStatus constants)
            result: Optional result data for completed tasks
            error: Optional error message for failed tasks
            
        Returns:
            Updated task data dictionary or None if task not found
        """
        if task_id in self.tasks:
            self.tasks[task_id]["status"] = status
            self.tasks[task_id]["updated_at"] = time.time()
            
            if result is not None:
                self.tasks[task_id]["result"] = result
                
            if error is not None:
                self.tasks[task_id]["error"] = error
                
            return self.tasks[task_id]
        return None
    
    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the current state of a task
        
        Args:
            task_id: The task to retrieve
            
        Returns:
            Task data dictionary or None if not found
        """
        return self.tasks.get(task_id)
    
    def list_tasks(self, limit: int = 100, skip: int = 0) -> list:
        """
        Get a list of tasks
        
        Args:
            limit: Maximum number of tasks to return
            skip: Number of tasks to skip
            
        Returns:
            List of task dictionaries
        """
        task_list = list(self.tasks.values())
        # Sort by created_at descending (newest first)
        task_list.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        return task_list[skip:skip+limit]
    
    def clear_completed_tasks(self, max_age: int = 3600) -> int:
        """
        Clear completed or failed tasks that are older than max_age seconds
        
        Args:
            max_age: Maximum age in seconds to keep completed tasks
            
        Returns:
            Number of tasks cleared
        """
        current_time = time.time()
        count = 0
        
        for task_id in list(self.tasks.keys()):
            task = self.tasks[task_id]
            status = task.get("status")
            updated_at = task.get("updated_at", 0)
            
            # Remove completed or failed tasks that are older than max_age
            if status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                if current_time - updated_at > max_age:
                    del self.tasks[task_id]
                    count += 1
                    
        return count

# Create a singleton task queue
task_queue = TaskQueue()

# Helper function to get the task queue
@lru_cache(maxsize=1)
def get_task_queue():
    """Get the global task queue instance"""
    return task_queue