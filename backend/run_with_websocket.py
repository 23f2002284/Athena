#!/usr/bin/env python3
"""
Run main_test.py with WebSocket integration
This script starts both the FastAPI server and runs the pipeline with WebSocket support
"""

import asyncio
import sys
import os
import threading
import time
import uvicorn
from multiprocessing import Process

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def start_fastapi_server():
    """Start FastAPI server in a separate process"""
    from realtime_api import app
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

async def run_pipeline_with_websocket(pipeline: str, text: str):
    """Run the pipeline with WebSocket integration"""
    # Give the server time to start
    await asyncio.sleep(2)
    
    # Import and run the enhanced pipeline
    from main_test import run_pipeline
    result = await run_pipeline(pipeline, text)
    return result

def main():
    if len(sys.argv) < 3:
        print("Usage: python run_with_websocket.py <pipeline> <text>")
        print("Example: python run_with_websocket.py fact 'Your text here'")
        sys.exit(1)
    
    pipeline = sys.argv[1]
    text = sys.argv[2]
    
    # Start FastAPI server in background process
    server_process = Process(target=start_fastapi_server)
    server_process.start()
    
    try:
        print(f"Starting FastAPI server...")
        time.sleep(3)  # Give server time to start
        
        print(f"Running {pipeline} pipeline with WebSocket integration...")
        print(f"Text: {text[:100]}...")
        print("Connect to WebSocket at: ws://localhost:8000/ws")
        print("View test page at: file:///" + os.path.abspath("test_websocket.html"))
        
        # Run the pipeline
        result = asyncio.run(run_pipeline_with_websocket(pipeline, text))
        print(f"Pipeline completed: {result}")
        
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        server_process.terminate()
        server_process.join()

if __name__ == "__main__":
    main()
