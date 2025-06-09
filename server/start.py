import uvicorn
import os

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 8000))
    
    # Start with optimized settings for handling concurrent requests
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        workers=1,           # Single process for model sharing
        loop="asyncio",      # Use asyncio for concurrency
        timeout_keep_alive=65,
        access_log=True
    )