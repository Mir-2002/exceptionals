from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from utils.db import db 
from view.UserView import router as user_router
from view.ProjectView import router as project_router
from view.FileView import router as file_router
from view.AuthView import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to the database when the app starts
    try:
        await db.connect_to_database(app)
        print("Database connection established.")
        yield
    # Disconnect from the database when the app stops
    finally:
        await db.close_database_connection()
        print("Database connection closed.")

app = FastAPI(
    title="Automatic Python Documentation Generator",
    description="An NLP powered tool to generate documentation for Python code.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to the Automatic Python Documentation Generator API!"}

app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(user_router, prefix="/api", tags=["users"])
app.include_router(project_router, prefix="/api", tags=["projects"])
app.include_router(file_router, prefix="/api", tags=["files"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info", reload=True, debug=True)

        
        


        


