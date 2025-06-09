from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import asyncio

from utils.db import db
from view.UserView import router as user_router
from view.ProjectView import router as project_router
from view.FileView import router as file_router
from view.AuthView import router as auth_router
from view.DocumentationView import router as documentation_router

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    force=True
)

# Set logging levels for better debugging
logging.getLogger('controller').setLevel(logging.DEBUG)
logging.getLogger('utils').setLevel(logging.DEBUG)

@asynccontextmanager
async def app_lifespan(app: FastAPI):
    # Connect to the database when the app starts
    try:
        await db.connect_to_database(app)
        print("Database connection established.")
        print("Documentation service using Hugging Face Inference API.")
        
        # This special yield pattern is required for Python 3.13 compatibility
        yield
    # Clean up resources when the app stops
    finally:
        # Disconnect from database
        await db.close_database_connection()
        print("Database connection closed.")

# Work around Python 3.13 async iterator compatibility issue
def get_lifespan(lifespan_func):
    @asynccontextmanager
    async def _wrapper(app):
        async with lifespan_func(app):
            yield {}
    return _wrapper

# Create the FastAPI app with the lifespan handler
app = FastAPI(
    title="Python Documentation Generator",
    description="Automated Python codebase documentation generation using Abstract Syntax Trees and NLP techniques via Hugging Face API",
    version="0.1.0",
    lifespan=get_lifespan(app_lifespan),
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to the Python Documentation Generator API!"}

# Include routers
app.include_router(auth_router, prefix="/api", tags=["authentication"])
app.include_router(user_router, prefix="/api", tags=["users"])
app.include_router(project_router, prefix="/api", tags=["projects"])
app.include_router(file_router, prefix="/api", tags=["files"])
app.include_router(documentation_router, prefix="/api", tags=["documentation"])