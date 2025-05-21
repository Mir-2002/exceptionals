import os
import subprocess
import platform

def create_models_directory():
    """Create the models directory if it doesn't exist"""
    models_dir = os.path.join(".", "nlp_models")
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        print(f"Created models directory: {models_dir}")
    else:
        print(f"nlp_models directory already exists: {models_dir}")

def install_requirements():
    """Install required packages with optimized versions"""
    print("Installing requirements...")
    
    # Determine if we should use CPU-only PyTorch
    cpu_only = input("Install CPU-only version of PyTorch? (y/n): ").lower() == "y"
    
    # Base requirements
    requirements = [
        "fastapi",
        "uvicorn",
        "python-multipart",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "motor",
        "transformers==4.52.1",
    ]
    
    # Add PyTorch with appropriate version
    if cpu_only:
        if platform.system() == "Windows":
            requirements.append("torch==2.0.1+cpu -f https://download.pytorch.org/whl/torch_stable.html")
        else:
            requirements.append("torch==2.0.1 --index-url https://download.pytorch.org/whl/cpu")
    else:
        requirements.append("torch==2.0.1")
    
    # Install packages
    for req in requirements:
        if " -f " in req or " --index-url " in req:
            # Handle special installation URLs
            parts = req.split(" ", 1)
            subprocess.check_call(["pip", "install", parts[0], parts[1]], shell=(platform.system() == "Windows"))
        else:
            subprocess.check_call(["pip", "install", req], shell=(platform.system() == "Windows"))
    
    print("Requirements installed successfully!")

if __name__ == "__main__":
    create_models_directory()
    install_requirements()
    print("\nSetup complete! Run 'python start.py' to start the server.")