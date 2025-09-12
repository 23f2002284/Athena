import asyncio
import json
import logging
import os
import subprocess  # Add this line
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional  # Add Optional here
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import load_env  # Direct environment loader

# Load environment variables first
load_dotenv('config.env')
load_dotenv('.env')

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn
import os
from typing import Dict, Any

# Add current directory to path for backend imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from websocket_broadcaster import broadcaster
from models import FactCheckRequest, ProcessStatus, WebSocketMessage

# Add parent directory to path to import main_test
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI(title="Athena Real-time Fact Checker API", version="1.0.0")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global process tracking
current_process: Optional[subprocess.Popen] = None
process_status = ProcessStatus(status="idle")

@app.post("/api/start-analysis")
async def start_analysis(request: FactCheckRequest, background_tasks: BackgroundTasks):
    """Start fact-checking or educational analysis with real-time updates"""
    global current_process, process_status
    
    try:
        # Kill existing process if running
        if current_process and current_process.poll() is None:
            current_process.terminate()
            await broadcaster.broadcast("status", {"status": "terminated", "message": "Previous process terminated"})
        
        # Update status
        process_status.status = "starting"
        process_status.pipeline = request.pipeline
        
        # Send initial status to connected clients
        await broadcaster.broadcast("status", {
            "status": "starting",
            "pipeline": request.pipeline.value,
            "input_text": request.text[:100] + "..." if len(request.text) > 100 else request.text
        })
        
        # Start the process in background
        background_tasks.add_task(run_pipeline_process, request.pipeline.value, request.text)
        
        return {
            "status": "started",
            "pipeline": request.pipeline.value,
            "message": "Analysis started successfully"
        }
        
    except Exception as e:
        await broadcaster.broadcast("error", {"message": str(e), "error_type": "startup"})
        raise HTTPException(status_code=500, detail=str(e))

async def run_pipeline_process(pipeline: str, text: str):
    """Run the main_test.py pipeline process"""
    global current_process, process_status
    
    try:
        # Update status
        process_status.status = "running"
        process_status.current_step = "initializing"
        
        # Import and run the pipeline directly
        from main_test import run_pipeline
        
        # Execute the pipeline
        result = await run_pipeline(pipeline, text)
        
        # Update final status
        process_status.status = "completed"
        process_status.progress_percentage = 100.0
        
        await broadcaster.broadcast("status", {
            "status": "completed",
            "pipeline": pipeline,
            "message": "Analysis completed successfully"
        })
        
        return result
        
    except Exception as e:
        process_status.status = "error"
        process_status.error_message = str(e)
        
        await broadcaster.broadcast("error", {
            "message": str(e),
            "error_type": "execution",
            "pipeline": pipeline
        })
        
        logging.error(f"Pipeline execution error: {e}")
        raise

@app.get("/api/status")
async def get_status():
    """Get current process status"""
    return process_status.dict()

@app.post("/api/stop")
async def stop_analysis():
    """Stop current analysis"""
    global current_process, process_status
    
    if current_process and current_process.poll() is None:
        current_process.terminate()
        process_status.status = "stopped"
        
        await broadcaster.broadcast("status", {
            "status": "stopped",
            "message": "Analysis stopped by user"
        })
        
        return {"status": "stopped", "message": "Analysis stopped successfully"}
    
    return {"status": "idle", "message": "No active analysis to stop"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await broadcaster.connect(websocket)
    
    try:
        # Send current status to newly connected client
        await websocket.send_text(json.dumps({
            "type": "status",
            "data": process_status.dict(),
            "timestamp": datetime.now().isoformat()
        }))
        
        # Keep connection alive
        while True:
            try:
                # Wait for messages from client (ping/pong, etc.)
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }))
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logging.error(f"WebSocket error: {e}")
                break
                
    except WebSocketDisconnect:
        pass
    finally:
        broadcaster.disconnect(websocket)

@app.get("/api/check-llm-config")
async def check_llm_config():
    """Check if LLM is properly configured"""
    try:
        # Check for Google API Key (Gemini)
        google_api_key = os.getenv('GOOGLE_API_KEY')
        if google_api_key:
            return {
                "llm_provider": "Google Gemini",
                "model_name": "gemini-2.0-flash",
                "status": "configured"
            }
        
        # Check for Vertex AI configuration
        gcp_project = os.getenv('GCP_PROJECT')
        gcp_location = os.getenv('GCP_LOCATION', 'us-central1')
        google_creds = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        
        if gcp_project and google_creds and os.path.isfile(google_creds):
            return {
                "llm_provider": "Google Vertex AI",
                "model_name": "chat-bison",
                "project_id": gcp_project,
                "location": gcp_location,
                "status": "configured"
            }
        
        # No valid configuration found
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "No valid LLM configuration found",
                "details": "Please set either GOOGLE_API_KEY for Gemini or GCP_PROJECT and GOOGLE_APPLICATION_CREDENTIALS for Vertex AI in config.env"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Error checking LLM configuration",
                "details": str(e)
            }
        )

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "version": "1.0.0",
        "websocket_connected": len(broadcaster.active_connections) > 0,
        "current_process_status": process_status.status
    }

@app.get("/")
async def serve_frontend():
    """Serve the frontend HTML file"""
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend_test.html")
    if os.path.exists(frontend_path):
        return FileResponse(frontend_path)
    else:
        return {
            "message": "Athena Real-time Fact Checker API",
            "version": "1.0.0",
            "endpoints": {
                "start_analysis": "POST /api/start-analysis",
                "get_status": "GET /api/status",
                "stop_analysis": "POST /api/stop",
                "websocket": "WS /ws",
                "health": "GET /api/health"
            },
            "websocket_events": [
                "status", "progress", "claims", "result", "educational", "sources", "error"
            ]
        }

if __name__ == "__main__":
    # Ensure logs directory exists
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    uvicorn.run(
        "realtime_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
