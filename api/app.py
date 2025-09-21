from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional

# Initialize FastAPI app
app = FastAPI(title="Athena Fact Checker API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FactCheckRequest(BaseModel):
    text: str
    source_url: Optional[str] = None

class FactCheckResponse(BaseModel):
    status: str
    result: Dict[str, Any]
    task_id: str

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Athena Fact Checker API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "athena-fact-checker"}

@app.post("/fact-check", response_model=FactCheckResponse)
async def fact_check(request: FactCheckRequest):
    """
    Fact-check endpoint - simplified version for Vercel deployment
    In production, this would integrate with the full fact-checking pipeline
    """
    # For now, return a mock response indicating the service is available
    # but the full fact-checking pipeline needs to be integrated
    return FactCheckResponse(
        status="service_available",
        result={
            "message": "Fact-checking service is deployed but pipeline integration pending",
            "text_received": request.text[:100] + "..." if len(request.text) > 100 else request.text,
            "timestamp": "2025-09-21T15:00:00Z"
        },
        task_id="mock-task-id"
    )

@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    return {
        "api_version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "fact_check": "/fact-check",
            "status": "/api/status"
        }
    }

# Export the app for Vercel
# Vercel will automatically detect this as the ASGI application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)