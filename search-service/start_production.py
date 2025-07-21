#!/usr/bin/env python3
"""
Production startup script for the image similarity search service
"""

import os
import uvicorn
from main import app

if __name__ == "__main__":
    # Set environment variables for production
    os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
    
    # Get port from environment or default to 8001
    port = int(os.environ.get("PORT", 8001))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"Starting production server on {host}:{port}")
    
    # Run with production settings
    uvicorn.run(
        app,
        host=host,
        port=port,
        workers=1,  # Single worker for now
        log_level="info"
    ) 