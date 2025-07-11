import ast
import os
import inspect
import textwrap
from typing import Dict, List, Any, Optional
import traceback
import astor


class CodeParserService:
    def __init__(self):
        pass
        
    def parse_file(self, file_path: str) -> Dict[str, Any]:
        """
        Parse a Python file and extract its structure.
        
        Args:
            file_path: Path to the Python file
            
        Returns:
            Dictionary containing the file structure with classes and functions
        """
        if not os.path.exists(file_path):
            return {
                "file_name": os.path.basename(file_path),
                "error": "File not found",
                "classes": [],
                "functions": []
            }
            
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                code = file.read()
                self.file_lines = code.splitlines()
                
            # Check if file is empty
            if not code.strip():
                return {
                    "file_name": os.path.basename(file_path),
                    "error": "File is empty",
                    "classes": [],
                    "functions": []
                }
                
            tree = ast.parse(code)
            return self._analyze_ast(tree, os.path.basename(file_path))
        except SyntaxError as e:
            return {
                "file_name": os.path.basename(file_path),
                "error": f"Python syntax error: {str(e)}",
                "error_line": e.lineno,
                "error_offset": e.offset,
                "classes": [],
                "functions": []
            }
        except Exception as e:
            return {
                "file_name": os.path.basename(file_path),
                "error": f"Failed to parse file: {str(e)}",
                "error_details": traceback.format_exc(),
                "classes": [],
                "functions": []
            }
    
    def parse_code(self, code: str) -> Dict[str, Any]:
        """
        Parse Python code string and extract its structure.
        
        Args:
            code: Python code as a string
                
        Returns:
            Dictionary containing the code structure with classes and functions
        """
        try:
            self.file_lines = code.splitlines()
                
            # Check if code is empty
            if not code.strip():
                return {
                    "file_name": "code_snippet",
                    "error": "Code is empty",
                    "classes": [],
                    "functions": []
                }
                    
            tree = ast.parse(code)
            return self._analyze_ast(tree, "code_snippet")
        except SyntaxError as e:
            return {
                "file_name": "code_snippet",
                "error": f"Python syntax error: {str(e)}",
                "error_line": e.lineno,
                "error_offset": e.offset,
                "classes": [],
                "functions": []
            }
        except Exception as e:
            return {
                "file_name": "code_snippet",
                "error": f"Failed to parse code: {str(e)}",
                "error_details": traceback.format_exc(),
                "classes": [],
                "functions": []
            }
    
    def _analyze_ast(self, tree: ast.AST, file_name: str) -> Dict[str, Any]:
        """
        Analyze the AST and extract classes and functions.
        
        Args:
            tree: The AST tree
            file_name: Name of the file
            
        Returns:
            Dictionary with extracted information
        """
        result = {
            "file_name": file_name,
            "classes": [],
            "functions": []  # Top-level functions
        }
        
        for node in ast.iter_child_nodes(tree):
            # Extract classes
            if isinstance(node, ast.ClassDef):
                class_info = self._extract_class_info(node)
                result["classes"].append(class_info)
            
            # Extract top-level functions
            elif isinstance(node, ast.FunctionDef):
                func_info = self._extract_function_info(node)
                result["functions"].append(func_info)
        
        return result
    
    def _extract_class_info(self, node: ast.ClassDef) -> Dict[str, Any]:
        """Extract information from a class definition."""
        class_info = {
            "name": node.name,
            "line": node.lineno,
            "end_line": self._get_end_line(node),
            "methods": [],
            "docstring": ast.get_docstring(node) or "",
            "bases": [self._get_name(base) for base in node.bases],
            "code": self._extract_code(node)  # Extract the class code
        }
        
        # Extract methods and class variables
        for item in node.body:
            if isinstance(item, ast.FunctionDef):
                method_info = self._extract_function_info(item)
                class_info["methods"].append(method_info)
        
        return class_info
    
    def _extract_function_info(self, node: ast.FunctionDef) -> Dict[str, Any]:
        """Extract information from a function definition."""
        return {
            "name": node.name,
            "line": node.lineno,
            "end_line": self._get_end_line(node),
            "args": self._extract_args(node.args),
            "docstring": ast.get_docstring(node) or "",
            "decorators": [self._get_name(d) for d in node.decorator_list],
            "code": self._extract_code(node)  # Extract the function code
        }
    
    def _extract_code(self, node: ast.AST) -> str:
        """Extract the source code from a node."""
        try:
            # Method 1: Use astor to convert AST back to source
            return astor.to_source(node)
        except Exception:
            try:
                # Method 2: Extract from original file lines
                start_line = node.lineno - 1  # Convert to 0-indexed
                end_line = self._get_end_line(node)
                
                if hasattr(self, 'file_lines') and len(self.file_lines) >= end_line:
                    code_lines = self.file_lines[start_line:end_line]
                    return '\n'.join(code_lines)
                return "# Code extraction failed"
            except Exception as e:
                return f"# Code extraction error: {str(e)}"
    
    def _extract_args(self, args: ast.arguments) -> List[str]:
        """Extract function arguments."""
        arg_list = []
        
        # Add positional arguments
        for arg in args.args:
            arg_list.append(arg.arg)
            
        # Add *args if present
        if args.vararg:
            arg_list.append(f"*{args.vararg.arg}")
            
        # Add keyword-only arguments
        for arg in args.kwonlyargs:
            arg_list.append(arg.arg)
            
        # Add **kwargs if present
        if args.kwarg:
            arg_list.append(f"**{args.kwarg.arg}")
            
        return arg_list
    
    def _get_end_line(self, node: ast.AST) -> int:
        """Get the end line of a node."""
        return max(getattr(node, 'lineno', 0), 
                  max([self._get_end_line(child) for child in ast.iter_child_nodes(node)], default=0))
    
    def _get_name(self, node: ast.AST) -> str:
        """Extract the name from a node."""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_name(node.value)}.{node.attr}"
        elif isinstance(node, ast.Call):
            return self._get_name(node.func)
        elif isinstance(node, ast.Subscript):
            return self._get_name(node.value)
        else:
            return str(node)