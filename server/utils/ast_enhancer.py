import ast
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class ASTEnhancedDocGenerator:
    """
    Enhances code documentation generation by using AST analysis to provide 
    targeted context to the language model (CodeT5), replicating the preprocessing
    approach used in training.
    """
    
    # Keep the same nodes as in your preprocessing script
    KEEP_NODES = {
        'FunctionDef', 'AsyncFunctionDef', 'ClassDef',
        'arguments', 'arg', 'Return',
        'If', 'For', 'While', 'Try', 'With',
        'Assign', 'Call',
        'Raise', 'ExceptHandler',
        'decorator', 'bases',
        'Compare', 'BoolOp'
    }
    
    def __init__(self):
        pass
    
    def ast_to_dict(self, node):
        """Convert AST node to dictionary representation, keeping only specified node types"""
        if node is None:
            return None
        
        if isinstance(node, ast.AST):
            node_type = type(node).__name__
            
            # Only process nodes we want to keep
            if node_type not in self.KEEP_NODES:
                # Skip this node but process its children
                result = []
                for field, value in ast.iter_fields(node):
                    child_result = self.ast_to_dict(value)
                    if child_result is not None:
                        if isinstance(child_result, list):
                            result.extend(child_result)
                        else:
                            result.append(child_result)
                return result if result else None
            
            # Keep this node - create dictionary representation
            result = {'type': node_type}
            
            for field, value in ast.iter_fields(node):
                processed_value = self.ast_to_dict(value)
                if processed_value is not None:
                    result[field] = processed_value
            
            return result
            
        elif isinstance(node, list):
            filtered_list = []
            for item in node:
                processed_item = self.ast_to_dict(item)
                if processed_item is not None:
                    if isinstance(processed_item, list):
                        filtered_list.extend(processed_item)
                    else:
                        filtered_list.append(processed_item)
            return filtered_list if filtered_list else None
            
        elif isinstance(node, bytes):
            return node.decode('utf-8', errors='replace')
        elif isinstance(node, (int, float, str, bool)) or node is None:
            return node
        else:
            return str(node)

    def flatten_ast_data(self, ast_data: Dict) -> str:
        """Convert nested AST dictionary to linear sequence, keeping only relevant nodes"""
        if not ast_data or not isinstance(ast_data, dict):
            return ""
        
        tokens = []
        
        def traverse_ast(node, depth=0):
            """Recursively traverse AST and create linear sequence"""
            if not isinstance(node, dict):
                return
            
            node_type = node.get('type', 'unknown')
            
            # Only process nodes we want to keep
            if node_type not in self.KEEP_NODES:
                # Skip this node but process its children
                for field, value in node.items():
                    if field != 'type':
                        if isinstance(value, list):
                            for item in value:
                                traverse_ast(item, depth)
                        elif isinstance(value, dict):
                            traverse_ast(value, depth)
                return
            
            tokens.append(node_type)
            
            # Function/Class names
            if 'name' in node:
                tokens.append(f"name:{node['name']}")
            
            # Function arguments
            if 'args' in node and isinstance(node['args'], dict):
                args_node = node['args']
                if 'args' in args_node and isinstance(args_node['args'], list):
                    for arg in args_node['args']:
                        if isinstance(arg, dict) and 'arg' in arg:
                            tokens.append(f"arg:{arg['arg']}")
            
            # Return statements
            if node_type == 'Return':
                has_value = 'value' in node and node['value'] is not None
                tokens.append(f"return:{'yes' if has_value else 'no'}")
            
            # Function calls
            if node_type == 'Call' and 'func' in node:
                func = node['func']
                if isinstance(func, dict) and 'id' in func:
                    tokens.append(f"call:{func['id']}")
            
            # Comparison operators
            if node_type == 'Compare' and 'ops' in node:
                ops = node['ops']
                if isinstance(ops, list):
                    for op in ops:
                        if isinstance(op, dict) and 'type' in op:
                            tokens.append(f"op:{op['type']}")
            
            # Exception information
            if node_type == 'Raise' and 'exc' in node:
                exc = node['exc']
                if isinstance(exc, dict) and 'id' in exc:
                    tokens.append(f"raises:{exc['id']}")
            
            # Process all children recursively
            for field, value in node.items():
                if field != 'type':
                    if isinstance(value, list):
                        for item in value:
                            traverse_ast(item, depth + 1)
                    elif isinstance(value, dict):
                        traverse_ast(value, depth + 1)
        
        traverse_ast(ast_data)
        
        # Clean up and join
        sequence = ' '.join(tokens)
        sequence = ' '.join(sequence.split())
        
        return sequence

# Create a singleton instance
ast_enhancer = ASTEnhancedDocGenerator()

def get_ast_enhancer():
    """Get the AST enhancer service instance"""
    return ast_enhancer