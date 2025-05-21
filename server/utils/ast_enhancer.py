import logging
import re
from typing import Dict, List, Any, Optional
from utils.parser import CodeParserService

logger = logging.getLogger(__name__)

class ASTEnhancedDocGenerator:
    """
    Enhances code documentation generation by using AST analysis to provide 
    targeted context to the language model (CodeT5).
    """
    
    def __init__(self):
        self.parser = CodeParserService()
    
    def enhance_code_context(self, code: str) -> Dict[str, Any]:
        """
        Analyze code with AST and extract contextual information to guide documentation.
        
        Args:
            code: Python source code to analyze
            
        Returns:
            Dict containing enhanced context (signatures, dependencies, etc.)
        """
        # Parse the code to get AST-based structure
        parsed_structure = self.parser.parse_code(code)
        
        # Extract key contextual elements
        context = {
            "imports": self._extract_imports(parsed_structure),
            "class_hierarchy": self._extract_class_hierarchy(parsed_structure),
            "function_signatures": self._extract_function_signatures(parsed_structure),
            "variables": self._extract_variables(parsed_structure),
            "related_elements": self._find_related_elements(parsed_structure)
        }
        
        return context
    
    def prepare_for_docgen(self, code: str, element_type: str = None, element_name: str = None) -> Dict[str, Any]:
        """
        Prepare code with AST-guided context for documentation generation.
        
        Args:
            code: Python source code
            element_type: Type of element to document (function, class, etc.)
            element_name: Name of specific element to document
            
        Returns:
            Dict with code and enhanced context for the model
        """
        # Parse the full code to understand context
        context = self.enhance_code_context(code)
        
        if element_type and element_name:
            # Extract the specific element to document
            element = self._extract_specific_element(code, element_type, element_name)
            
            if element:
                # Prepare the element with its context
                return {
                    "code": element["code"],
                    "context": {
                        "element_type": element_type,
                        "element_name": element_name,
                        "parameters": element.get("parameters", []),
                        "return_type": element.get("return_type"),
                        "class_context": element.get("class_context"),
                        "imports": context["imports"],
                        "related_functions": self._find_related_functions(context, element_name)
                    }
                }
        
        # If no specific element or element not found, return entire code with context
        return {
            "code": code,
            "context": context
        }
    
    def generate_prompt_with_ast_context(self, code_data: Dict[str, Any]) -> str:
            """
            Generate a simplified prompt for the language model using AST insights.
            
            Args:
                code_data: Code and context information
                    
            Returns:
                Structured prompt for better documentation generation
            """
            code = code_data["code"]
            context = code_data["context"]
            
            # Start with a simpler, more direct prompt
            prompt = "Generate a Python docstring for this code:\n\n"
            prompt += f"{code}\n\n"
            
            # Add minimal but useful context
            if "element_type" in context and "element_name" in context:
                element_type = context["element_type"]
                element_name = context["element_name"]
                prompt += f"This is a {element_type} named '{element_name}'.\n"
                
                # Add parameter info for functions
                if element_type == "function" and context.get("parameters"):
                    prompt += "Parameters:\n"
                    for param in context["parameters"]:
                        param_name = param.get("name", "")
                        param_type = param.get("type", "")
                        if param_type:
                            prompt += f"- {param_name}: {param_type}\n"
                        else:
                            prompt += f"- {param_name}\n"
            
            # Very concise instructions
            prompt += "\nUse Google-style docstrings with triple double quotes."
            prompt += "\nInclude parameter and return value descriptions."
            
            return prompt
    
    def _extract_imports(self, parsed_structure: Dict[str, Any]) -> List[str]:
        """Extract import statements from parsed code"""
        imports = []
        try:
            if "imports" in parsed_structure:
                for imp in parsed_structure["imports"]:
                    if "name" in imp:
                        if "module" in imp and imp["module"]:
                            imports.append(f"{imp['module']}.{imp['name']}")
                        else:
                            imports.append(imp["name"])
                    elif "module" in imp:
                        imports.append(imp["module"])
        except Exception as e:
            logger.error(f"Error extracting imports: {str(e)}")
        return imports
    
    def _extract_class_hierarchy(self, parsed_structure: Dict[str, Any]) -> Dict[str, List[str]]:
        """Extract class hierarchy information"""
        hierarchy = {}
        try:
            if "classes" in parsed_structure:
                for cls in parsed_structure["classes"]:
                    class_name = cls.get("name", "")
                    if not class_name:
                        continue
                        
                    # Get base classes
                    bases = cls.get("bases", [])
                    hierarchy[class_name] = bases
                    
                    # Process nested classes
                    if "classes" in cls:
                        for nested_cls in cls["classes"]:
                            nested_name = nested_cls.get("name", "")
                            if nested_name:
                                nested_bases = nested_cls.get("bases", [])
                                hierarchy[f"{class_name}.{nested_name}"] = nested_bases
        except Exception as e:
            logger.error(f"Error extracting class hierarchy: {str(e)}")
        return hierarchy
    
    def _extract_function_signatures(self, parsed_structure: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract function signatures with parameter information"""
        signatures = []
        try:
            # Process top-level functions
            if "functions" in parsed_structure:
                for func in parsed_structure["functions"]:
                    signature = self._process_function_signature(func)
                    if signature:
                        signatures.append(signature)
            
            # Process class methods
            if "classes" in parsed_structure:
                for cls in parsed_structure["classes"]:
                    class_name = cls.get("name", "")
                    if "methods" in cls:
                        for method in cls["methods"]:
                            signature = self._process_function_signature(method)
                            if signature:
                                signature["class"] = class_name
                                signatures.append(signature)
        except Exception as e:
            logger.error(f"Error extracting function signatures: {str(e)}")
        return signatures
    
    def _process_function_signature(self, func: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process a function to extract its signature information"""
        try:
            name = func.get("name", "")
            if not name:
                return None
                
            signature = {
                "name": name,
                "parameters": [],
                "return_hint": func.get("returns", "")
            }
            
            # Extract parameters
            if "params" in func:
                for param in func["params"]:
                    param_info = {
                        "name": param.get("name", ""),
                        "type": param.get("annotation", ""),
                        "default": param.get("default", None)
                    }
                    signature["parameters"].append(param_info)
            
            return signature
        except Exception as e:
            logger.error(f"Error processing function signature: {str(e)}")
            return None
    
    def _extract_variables(self, parsed_structure: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract variable definitions and usages"""
        variables = []
        try:
            # Parse the AST to get global variables and assignments
            if isinstance(parsed_structure.get("body"), dict):
                for node in parsed_structure["body"].get("body", []):
                    if node.get("type") == "Assign":
                        var_info = {
                            "name": self._get_target_name(node.get("targets", [])[0]),
                            "value": node.get("value", {}).get("value", ""),
                            "type": self._infer_type(node.get("value", {}))
                        }
                        variables.append(var_info)
        except Exception as e:
            logger.error(f"Error extracting variables: {str(e)}")
        return variables
    
    def _get_target_name(self, target: Dict[str, Any]) -> str:
        """Get the name of an assignment target"""
        if target.get("type") == "Name":
            return target.get("id", "")
        return ""
    
    def _infer_type(self, value_node: Dict[str, Any]) -> str:
        """Infer the type of a value node"""
        node_type = value_node.get("type", "")
        if node_type == "Constant":
            value = value_node.get("value")
            if value is None:
                return "None"
            return type(value).__name__
        elif node_type == "List":
            return "list"
        elif node_type == "Dict":
            return "dict"
        elif node_type == "Set":
            return "set"
        elif node_type == "Call":
            func = value_node.get("func", {})
            if func.get("type") == "Name":
                return func.get("id", "")
        return "unknown"
    
    def _find_related_elements(self, parsed_structure: Dict[str, Any]) -> Dict[str, List[str]]:
        """Find relationships between code elements"""
        relationships = {}
        try:
            # Find function calls within other functions
            function_calls = self._extract_function_calls(parsed_structure)
            
            # Find class relationships (inheritance, composition)
            class_relationships = self._extract_class_relationships(parsed_structure)
            
            relationships.update({
                "function_calls": function_calls,
                "class_relationships": class_relationships
            })
        except Exception as e:
            logger.error(f"Error finding related elements: {str(e)}")
        return relationships
    
    def _extract_function_calls(self, parsed_structure: Dict[str, Any]) -> Dict[str, List[str]]:
        """Extract function calls within functions"""
        calls = {}
        # Implementation can analyze the AST to find function calls within other functions
        return calls
    
    def _extract_class_relationships(self, parsed_structure: Dict[str, Any]) -> Dict[str, Dict[str, List[str]]]:
        """Extract relationships between classes"""
        relationships = {
            "inheritance": {},  # class -> base classes
            "composition": {}   # class -> contained classes
        }
        
        if "classes" in parsed_structure:
            for cls in parsed_structure["classes"]:
                class_name = cls.get("name", "")
                if not class_name:
                    continue
                
                # Add inheritance relationships
                bases = cls.get("bases", [])
                if bases:
                    relationships["inheritance"][class_name] = bases
                
                # Analyze class attributes for composition relationships
                # (This would require deeper analysis of assignments within the class)
        
        return relationships
    
    def _extract_specific_element(self, code: str, element_type: str, element_name: str) -> Optional[Dict[str, Any]]:
        """Extract a specific element from code"""
        try:
            # Parse the code
            parsed_structure = self.parser.parse_code(code)
            
            # Look for the element based on type and name
            if element_type == "function":
                if "functions" in parsed_structure:
                    for func in parsed_structure["functions"]:
                        if func.get("name") == element_name:
                            return {
                                "code": func.get("code", ""),
                                "parameters": [
                                    {"name": p.get("name", ""), "type": p.get("annotation", "")}
                                    for p in func.get("params", [])
                                ],
                                "return_type": func.get("returns", "")
                            }
                
                # Check for methods in classes
                if "classes" in parsed_structure:
                    for cls in parsed_structure["classes"]:
                        if "methods" in cls:
                            for method in cls["methods"]:
                                if method.get("name") == element_name:
                                    return {
                                        "code": method.get("code", ""),
                                        "parameters": [
                                            {"name": p.get("name", ""), "type": p.get("annotation", "")}
                                            for p in method.get("params", [])
                                        ],
                                        "return_type": method.get("returns", ""),
                                        "class_context": cls.get("name", "")
                                    }
            
            elif element_type == "class":
                if "classes" in parsed_structure:
                    for cls in parsed_structure["classes"]:
                        if cls.get("name") == element_name:
                            return {
                                "code": cls.get("code", ""),
                                "bases": cls.get("bases", []),
                                "methods": [m.get("name", "") for m in cls.get("methods", [])]
                            }
            
        except Exception as e:
            logger.error(f"Error extracting specific element: {str(e)}")
        
        return None
    
    def _find_related_functions(self, context: Dict[str, Any], function_name: str) -> List[str]:
        """Find functions related to the target function"""
        related = []
        try:
            # Check function calls
            function_calls = context.get("related_elements", {}).get("function_calls", {})
            
            # Functions that call our target function
            for caller, called in function_calls.items():
                if function_name in called and caller != function_name:
                    related.append(caller)
            
            # Functions that our target function calls
            if function_name in function_calls:
                related.extend(function_calls[function_name])
            
            # Find functions with similar names
            function_signatures = context.get("function_signatures", [])
            for func in function_signatures:
                name = func.get("name", "")
                if name != function_name and (
                    name.startswith(function_name) or 
                    function_name.startswith(name) or
                    self._are_names_related(name, function_name)
                ):
                    related.append(name)
        
        except Exception as e:
            logger.error(f"Error finding related functions: {str(e)}")
        
        return list(set(related))  # Remove duplicates
    
    def _are_names_related(self, name1: str, name2: str) -> bool:
        """Check if two function names are semantically related"""
        # Simple heuristic: Check if names share common words
        words1 = re.findall(r'[a-z]+', name1.lower())
        words2 = re.findall(r'[a-z]+', name2.lower())
        
        # Check for common words
        common_words = set(words1) & set(words2)
        return len(common_words) > 0

# Create a singleton instance
ast_enhancer = ASTEnhancedDocGenerator()

def get_ast_enhancer():
    """Get the AST enhancer service instance"""
    return ast_enhancer