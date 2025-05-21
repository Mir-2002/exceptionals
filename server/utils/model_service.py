import logging
import os
import asyncio
from functools import lru_cache
from pathlib import Path
from typing import Dict, Any, Optional, Union
import re

logger = logging.getLogger(__name__)

# Model configuration
MODEL_NAME = "Salesforce/codet5-base"
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "nlp_models")
MAX_SOURCE_LENGTH = 1024
MAX_TARGET_LENGTH = 512

# Add a lock for model loading to prevent concurrent loading attempts
model_loading_lock = asyncio.Lock()

class UnifiedDocGenService:
    """
    Unified service that integrates with AST-enhanced context for Python code documentation generation.
    Enhanced with concurrency management, memory optimization, and lazy loading.
    """
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "cpu"
        self.is_initialized = False
        self.transformers_available = False
        self.request_queue = asyncio.Queue(maxsize=10)  # Limit concurrent model inferences
        self._worker_task = None
        logger.info("UnifiedDocGenService created with concurrency management")
    
    async def initialize(self):
        """Initialize the service asynchronously to avoid blocking the server startup"""
        if self.is_initialized:
            return
        
        # Check for transformers availability without loading model
        try:
            import transformers
            self.transformers_available = True
            logger.info("Transformers library is available. Model will be loaded on first request.")

            # Check model directory
            model_dir = Path(MODEL_DIR)
            logger.info(f"Model directory: {model_dir} (exists: {model_dir.exists()})")
            if model_dir.exists():
                files = list(model_dir.glob('*'))
                logger.info(f"Files in model directory: {[f.name for f in files]}")
                if len(files) > 0:
                    logger.info("Model files found - model may be pre-downloaded")
            else:
                os.makedirs(MODEL_DIR, exist_ok=True)
                logger.info(f"Created model directory: {MODEL_DIR}")
            
            # Start the background worker if transformers is available
            self._worker_task = asyncio.create_task(self._process_queue())
            logger.info("Started background inference worker")
        except ImportError:
            logger.warning("Transformers library not available. Using placeholder documentation generation.")
            self.transformers_available = False
        
        self.is_initialized = True
        logger.info("Documentation service initialized")

    async def is_model_loaded(self):
        """Check if the model is loaded"""
        return self.model is not None
    
    async def cleanup(self):
        """Clean up resources when application shuts down"""
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            logger.info("Background worker cleaned up")
    
    async def _process_queue(self):
        """Background worker that processes inference requests sequentially"""
        logger.info("Inference worker started")
        while True:
            # Get next item from queue
            code_data, future = await self.request_queue.get()
            try:
                # Load model if needed (first request)
                if self.model is None:
                    async with model_loading_lock:
                        if self.model is None:
                            # Only the first request loads the model
                            loop = asyncio.get_event_loop()
                            await loop.run_in_executor(None, self._load_model)
                            logger.info("Model loaded by worker on first request")
                
                # Generate the docstring
                code, prompt, element_type, element_name = code_data
                result = await self._generate_with_model(prompt)
                
                # Format the result and set it in the future
                formatted_docstring = self._format_docstring(result)
                future.set_result(formatted_docstring)
                
            except Exception as e:
                logger.error(f"Error in inference worker: {str(e)}")
                try:
                    code, _, element_type, element_name = code_data
                    fallback = self._generate_placeholder_docstring(code, element_type, element_name)
                    if not future.done():  # Check if future is still pending
                        future.set_result(fallback)
                except Exception as inner_e:
                    logger.error(f"Fallback generation failed: {str(inner_e)}")
                    if not future.done():  # Check if future is still pending
                        future.set_exception(e)
                finally:
                # Mark task as done
                    self.request_queue.task_done()
    
    def _load_model(self):
        """Load the CodeT5 model with memory optimizations"""
        try:
            # Only import here to allow service to start without transformers
            from transformers import T5ForConditionalGeneration, RobertaTokenizer
            import torch
            
            # Use GPU if available, otherwise fallback to CPU
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading model on device: {self.device}")
            
            # Create the model directory if it doesn't exist
            os.makedirs(MODEL_DIR, exist_ok=True)

            # Debug memory availability
            if torch.cuda.is_available():
                free_mem = torch.cuda.get_device_properties(0).total_memory - torch.cuda.memory_allocated(0)
                logger.info(f"CUDA available, free memory: {free_mem/1024**3:.2f} GB")
            else:
                logger.info("CUDA not available, using CPU")
            
            # Print model directory contents
            if os.path.exists(MODEL_DIR):
                logger.info(f"Model directory contents: {os.listdir(MODEL_DIR)}")
            
            # Load tokenizer 
            logger.info(f"Loading tokenizer from {MODEL_NAME}...")
            self.tokenizer = RobertaTokenizer.from_pretrained(MODEL_NAME, cache_dir=MODEL_DIR)
            logger.info(f"Tokenizer loaded successfully")
            
            # Load model with memory optimizations
            logger.info(f"Loading model from {MODEL_NAME}...")
            self.model = T5ForConditionalGeneration.from_pretrained(
                MODEL_NAME, 
                cache_dir=MODEL_DIR,
                low_cpu_mem_usage=True,       # Reduces memory during loading
                torch_dtype=torch.float16     # Use half-precision to reduce memory
            )
            
            # Add CPU optimizations AFTER model is loaded
            if self.device == "cpu":
                logger.info("Optimizing for CPU inference...")
                if hasattr(self.model, "config"):
                    self.model.config.use_cache = True  # Enable caching for faster inference

                try:
                    import torch
                    torch.set_num_threads(4)  # Limit to 4 threads for better performance
                    logger.info(f"Set PyTorch to use {torch.get_num_threads()} threads")
                except:
                    pass
        
                # Enable fast tokenization
                if hasattr(self.tokenizer, "use_fast") and hasattr(self.model.config, "max_position_embeddings"):
                    self.model.config.use_cache = True
                    logger.info("Enabled fast tokenization and model caching")

            
            # Move to appropriate device
            self.model.to(self.device)
            
            # Set model to evaluation mode
            self.model.eval()
            logger.info(f"Model loaded successfully on {self.device} with optimizations")
            return True
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    async def _generate_with_model(self, prompt):
        """Run model inference in a separate thread pool"""
        try:
            # Run in executor to avoid blocking
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._run_inference, prompt)
        except Exception as e:
            logger.error(f"Error in model inference: {str(e)}")
            raise
    
    def _run_inference(self, prompt):
        """Execute model inference with optimized settings for CPU"""
        import torch
        
        # Minimize prompt size by truncating if needed
        if len(prompt) > 1000:
            logger.info(f"Truncating long prompt from {len(prompt)} chars to 1000")
            prompt = prompt[:1000]
        
        # Tokenize with minimal settings
        inputs = self.tokenizer(
            prompt,
            truncation=True,
            return_tensors="pt"
        ).to(self.device)
        
        # Generate with optimized settings for CPU
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=128,  # Shorter output for faster generation
                num_beams=2,     # Reduce beam size for CPU
                early_stopping=True
            )
        
        # Decode output
        docstring = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return docstring
    
    async def ensure_initialized(self):
        """Ensure the service is initialized"""
        if not self.is_initialized:
            await self.initialize()

    async def ensure_model_loaded(self):
        """Force model loading for testing"""
        if self.model is None:
            async with model_loading_lock:
                if self.model is None:
                    # Run in executor to avoid blocking
                    loop = asyncio.get_event_loop()
                    try:
                        await loop.run_in_executor(None, self._load_model)
                        logger.info("Model loaded successfully on demand")
                        return True
                    except Exception as e:
                        logger.error(f"Failed to load model on demand: {str(e)}")
                        return False
        return True
    
    async def generate_docstring(self, code: str, element_type: str = None, element_name: str = None) -> str:
        """
        Generate a docstring for Python code with AST-enhanced context.
        
        Args:
            code: The Python code to document
            element_type: Optional type of element (function, class)
            element_name: Optional name of the specific element
            
        Returns:
            Generated docstring
        """
        await self.ensure_initialized()
        
        try:
            # If transformers available, use model with queue
            if self.transformers_available:
                # Get AST enhancer
                from utils.ast_enhancer import get_ast_enhancer
                ast_enhancer = get_ast_enhancer()
                
                # Enhance code with AST context
                enhanced_code_data = ast_enhancer.prepare_for_docgen(code, element_type, element_name)
                
                # Generate prompt with AST context
                prompt = ast_enhancer.generate_prompt_with_ast_context(enhanced_code_data)

                # Debug the prompt
                logger.debug(f"Generated prompt: {prompt[:100]}...")
                
                # Create a future for the result
                loop = asyncio.get_event_loop()
                future = loop.create_future()
                
                # Add to processing queue with timeout
                try:
                    # Package all data needed for generation
                    code_data = (code, prompt, element_type, element_name)
                    
                    # Put in queue with timeout
                    await asyncio.wait_for(
                        self.request_queue.put((code_data, future)),
                        timeout=30.0  # Timeout if queue is full
                    )
                    
                    # Wait for result with timeout
                    docstring = await asyncio.wait_for(future, timeout=120.0)
                    logger.info(f"Generated docstring: {docstring[:50]}...")
                    return docstring
                    
                except asyncio.TimeoutError:
                    # Queue is full or processing took too long
                    logger.warning("Queue full or inference timeout, using fallback generation")
                    return self._generate_placeholder_docstring(code, element_type, element_name)
            
            # Otherwise, use placeholder generation based on code analysis
            else:
                logger.info("Using placeholder docstring generation (no transformers)")
                return self._generate_placeholder_docstring(code, element_type, element_name)
            
        except Exception as e:
            logger.error(f"Error generating docstring: {str(e)}")
            return self._generate_placeholder_docstring(code, element_type, element_name)
    
    def _format_docstring(self, docstring: str) -> str:
        """Format the generated docstring to follow PEP conventions"""
        # Clean up the docstring
        docstring = docstring.strip()
        
        # Add triple quotes if not present
        if not docstring.startswith('"""') and not docstring.startswith("'''"):
            docstring = f'"""{docstring}"""'
        
        return docstring
    
    def _generate_placeholder_docstring(self, code: str, element_type: str = None, element_name: str = None) -> str:
        """Generate a placeholder docstring based on code analysis when model isn't available"""
        try:
            # Extract function/method signature
            if element_type == "function" or not element_type:
                # Look for function definition
                match = re.search(r'def\s+(\w+)\s*\((.*?)\)(?:\s*->\s*([^:]+))?:', code)
                if match:
                    func_name = match.group(1)
                    params = match.group(2).strip()
                    return_type = match.group(3).strip() if match.group(3) else "None"
                    
                    # Generate simple docstring
                    lines = [f'"""{func_name}', '']
                    
                    # Add parameters
                    if params:
                        param_list = [p.strip() for p in params.split(',')]
                        for param in param_list:
                            if param and param != 'self':
                                param_name = param.split(':')[0].split('=')[0].strip()
                                lines.append(f"Args:")
                                lines.append(f"    {param_name}: Description of {param_name}")
                                break
                    
                    # Add return
                    if return_type and return_type != 'None':
                        lines.append("")
                        lines.append("Returns:")
                        lines.append(f"    {return_type}: Description of return value")
                    
                    lines.append('"""')
                    return '\n'.join(lines)
            
            # Extract class documentation
            elif element_type == "class":
                # Look for class definition
                match = re.search(r'class\s+(\w+)(?:\s*\((.*?)\))?:', code)
                if match:
                    class_name = match.group(1)
                    inherits = match.group(2).strip() if match.group(2) else ""
                    
                    lines = [f'"""{class_name}', '']
                    lines.append(f"A class for {class_name.lower().replace('_', ' ')}.")
                    
                    if inherits:
                        lines.append("")
                        lines.append(f"Inherits from: {inherits}")
                    
                    lines.append('"""')
                    return '\n'.join(lines)
            
            # Default docstring
            return '"""Description of the code."""'
            
        except Exception as e:
            logger.error(f"Error generating placeholder docstring: {str(e)}")
            return '"""Auto-generated documentation."""'
    
    async def generate_file_docs(self, file_content: str) -> str:
        """
        Generate documentation for all functions and classes in a file.
        
        Args:
            file_content: The Python file content
            
        Returns:
            Documented file content
        """
        await self.ensure_initialized()
        
        try:
            # Get the parser
            from utils.parser import CodeParserService
            parser = CodeParserService()
            
            # Parse the file
            parsed_structure = parser.parse_code(file_content)
            
            # Document the file
            documented_content = file_content
            
            # Add file docstring if not present
            if not parsed_structure.get("module_docstring"):
                file_name = parsed_structure.get("file_name", "")
                module_docstring = f'"""\n{file_name}\n\nThis module contains functions and classes for various operations.\n"""\n\n'
                # Insert at beginning of file, after any imports
                import_end = 0
                lines = file_content.split('\n')
                for i, line in enumerate(lines):
                    if line.startswith(('import ', 'from ')) or line == '':
                        import_end = i + 1
                    else:
                        break
                
                lines.insert(import_end, module_docstring)
                documented_content = '\n'.join(lines)
            
            # Document classes
            if "classes" in parsed_structure:
                for cls in parsed_structure["classes"]:
                    class_name = cls.get("name")
                    class_code = cls.get("code")
                    
                    # Skip if class already has a docstring
                    if cls.get("docstring"):
                        continue
                    
                    if not class_name or not class_code:
                        continue
                    
                    # Generate docstring
                    docstring = await self.generate_docstring(class_code, "class", class_name)
                    
                    # Find insertion point (after class definition line)
                    lines = class_code.split('\n')
                    insertion_point = 1  # After the definition line
                    
                    # Add appropriate indentation
                    indent = re.match(r'^(\s*)', lines[0]).group(1) + "    "
                    indented_docstring = docstring.replace('\n', f'\n{indent}')
                    
                    # Insert the docstring
                    modified_lines = lines[:insertion_point] + [f"{indent}{indented_docstring}"] + lines[insertion_point:]
                    modified_class = '\n'.join(modified_lines)
                    
                    # Replace in the full content
                    documented_content = documented_content.replace(class_code, modified_class)
            
            # Document functions
            if "functions" in parsed_structure:
                for func in parsed_structure["functions"]:
                    func_name = func.get("name")
                    func_code = func.get("code")
                    
                    # Skip if function already has a docstring
                    if func.get("docstring"):
                        continue
                    
                    if not func_name or not func_code:
                        continue
                    
                    # Generate docstring
                    docstring = await self.generate_docstring(func_code, "function", func_name)
                    
                    # Find insertion point (after function definition line)
                    lines = func_code.split('\n')
                    insertion_point = 1  # After the definition line
                    
                    # Add appropriate indentation
                    indent = re.match(r'^(\s*)', lines[0]).group(1) + "    "
                    indented_docstring = docstring.replace('\n', f'\n{indent}')
                    
                    # Insert the docstring
                    modified_lines = lines[:insertion_point] + [f"{indent}{indented_docstring}"] + lines[insertion_point:]
                    modified_func = '\n'.join(modified_lines)
                    
                    # Replace in the full content
                    documented_content = documented_content.replace(func_code, modified_func)
            
            return documented_content
            
        except Exception as e:
            logger.error(f"Error generating file documentation: {str(e)}")
            return file_content  # Return original content on error
    
    async def search_related_code(self, code: str, query: str) -> Dict[str, Any]:
        """
        Search for code elements related to a query using AST analysis.
        
        Args:
            code: The Python code to search in
            query: Search query (function name, class name, etc.)
            
        Returns:
            Dictionary of related code elements
        """
        try:
            # Get the parser
            from utils.parser import CodeParserService
            parser = CodeParserService()
            
            # Parse the code
            parsed_structure = parser.parse_code(code)
            
            # Search for matches
            matches = {
                "functions": [],
                "classes": [],
                "variables": []
            }
            
            # Search functions
            if "functions" in parsed_structure:
                for func in parsed_structure["functions"]:
                    if query.lower() in func.get("name", "").lower():
                        matches["functions"].append({
                            "name": func.get("name", ""),
                            "docstring": func.get("docstring", ""),
                            "code": func.get("code", ""),
                            "line": func.get("line", 0)
                        })
            
            # Search classes
            if "classes" in parsed_structure:
                for cls in parsed_structure["classes"]:
                    if query.lower() in cls.get("name", "").lower():
                        matches["classes"].append({
                            "name": cls.get("name", ""),
                            "docstring": cls.get("docstring", ""),
                            "code": cls.get("code", ""),
                            "line": cls.get("line", 0)
                        })
            
            # Process results
            return {
                "query": query,
                "matches": matches,
                "total_matches": len(matches["functions"]) + len(matches["classes"]) + len(matches["variables"])
            }
            
        except Exception as e:
            logger.error(f"Error searching code: {str(e)}")
            return {"query": query, "error": str(e), "matches": {}, "total_matches": 0}

# Create a singleton instance
model_service = UnifiedDocGenService()

# Helper function to get the service
@lru_cache(maxsize=1)
def get_model_service():
    return model_service