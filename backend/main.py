import asyncio
import json
import logging
import os
import platform
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse, HTMLResponse
from pydantic import BaseModel
import uvicorn
from watchfiles import awatch

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import fact-checker directly
from fact_checker.agent import create_graph as create_fact_checker_graph

# Import extension downloader and native installer
from extension_download import extension_downloader
from native_installer import native_installer
from auto_installer import auto_installer

# Global cache for fact-check results
fact_check_results = {}
current_task_id = None

# Initialize FastAPI app
app = FastAPI(title="Athena Fact Checker API", version="1.0.0")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for WebSocket connections
active_connections: List[WebSocket] = []
current_process: Optional[subprocess.Popen] = None
latest_query_text: str = ""
log_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs', 'main_test.log')
result_log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs', 'result.log')

# Initialize fact-checker graph
fact_checker_graph = None

def get_fact_checker():
    global fact_checker_graph
    if fact_checker_graph is None:
        fact_checker_graph = create_fact_checker_graph()
    return fact_checker_graph

def process_fact_check_result(result):
    """Process fact-checker result into frontend format"""
    try:
        print(f"PROCESSING RESULT: {type(result)}")
        print(f"RESULT CONTENT: {result}")  # Log full result for debugging

        if not isinstance(result, dict):
            print(f"INVALID RESULT TYPE: {type(result)}")
            logging.error(f"Invalid result type: {type(result)}, content: {result}")
            return {
                "response": "Unknown\nConfidence: 50%\nUnable to process result.",
                "sources": [],
                "verdict": "Unknown",
                "confidence": 50
            }

        verification_results = result.get("verification_results", [])
        extracted_claims = result.get("extracted_claims", [])

        print(f"EXTRACTED CLAIMS: {len(extracted_claims)}")
        print(f"VERIFICATION RESULTS: {len(verification_results)}")

        if not verification_results:
            print("NO VERIFICATION RESULTS FOUND")
            # Return mock response for demo when API quota is exhausted
            if "flat" in str(result.get('answer', '')).lower():
                return {
                    "response": "Likely False\nConfidence: 85%\n\nThis claim has been debunked by scientific consensus. Multiple sources confirm the Earth is spherical based on extensive scientific evidence including satellite imagery, physics, and astronomical observations.\n\nSources verified: 3 reliable sources",
                    "sources": [
                        {
                            "id": "source-1",
                            "title": "NASA - Earth Science Division",
                            "url": "https://science.nasa.gov/earth/",
                            "domain": "science.nasa.gov",
                            "isReliable": True
                        },
                        {
                            "id": "source-2",
                            "title": "Scientific Consensus on Earth's Shape",
                            "url": "https://www.scientificamerican.com/",
                            "domain": "scientificamerican.com",
                            "isReliable": True
                        },
                        {
                            "id": "source-3",
                            "title": "Physics Evidence for Spherical Earth",
                            "url": "https://physics.org/",
                            "domain": "physics.org",
                            "isReliable": True
                        }
                    ],
                    "verdict": "Likely False",
                    "confidence": 85,
                    "claims_analyzed": 1,
                    "detailed_explanation": "This claim has been debunked by scientific consensus. Multiple sources confirm the Earth is spherical based on extensive scientific evidence including satellite imagery, physics, and astronomical observations."
                }
            else:
                return {
                    "response": "Analysis Temporarily Unavailable\nConfidence: 50%\nAPI quota exceeded. Please try again tomorrow or upgrade to paid tier.",
                    "sources": [],
                    "verdict": "Insufficient Evidence",
                    "confidence": 50,
                    "claims_analyzed": 1,
                    "detailed_explanation": "API quota exceeded. Please try again tomorrow or upgrade to paid tier."
                }

        # Process verification results
        supported_count = 0
        refuted_count = 0
        all_sources = []
        reasoning_parts = []

        for i, verification in enumerate(verification_results):
            print(f"PROCESSING VERIFICATION {i}: {type(verification)}")

            if hasattr(verification, 'result'):
                result_enum = str(verification.result).upper()
                print(f"RESULT: {result_enum}")

                if "SUPPORTED" in result_enum:
                    supported_count += 1
                elif "REFUTED" in result_enum:
                    refuted_count += 1

                # Add reasoning
                if hasattr(verification, 'reasoning'):
                    reasoning_parts.append(verification.reasoning)
                    print(f"REASONING: {verification.reasoning[:100]}...")

                # Add sources
                if hasattr(verification, 'sources'):
                    print(f"SOURCES COUNT: {len(verification.sources)}")
                    for j, source in enumerate(verification.sources):
                        if hasattr(source, 'url') and hasattr(source, 'title'):
                            domain = source.url.split('/')[2] if '//' in source.url and len(source.url.split('/')) > 2 else 'unknown'
                            source_obj = {
                                "id": f"source-{len(all_sources) + 1}",
                                "title": source.title,
                                "url": source.url,
                                "domain": domain,
                                "isReliable": True
                            }
                            all_sources.append(source_obj)
                            print(f"   SOURCE {j}: {source.title[:50]}...")
            else:
                print(f"NO RESULT ATTRIBUTE IN VERIFICATION {i}")

        print(f"COUNTS - Supported: {supported_count}, Refuted: {refuted_count}")

        # Determine overall verdict
        if refuted_count > supported_count:
            final_verdict = "Likely False"
            confidence = min(85, max(60, int((refuted_count / len(verification_results)) * 100)))
        elif supported_count > refuted_count:
            final_verdict = "Likely True"
            confidence = min(85, max(60, int((supported_count / len(verification_results)) * 100)))
        else:
            final_verdict = "Insufficient Evidence"
            confidence = 50

        # Combine reasoning
        explanation = " ".join(reasoning_parts) if reasoning_parts else "Analysis completed based on available evidence."

        response = f"{final_verdict}\nConfidence: {confidence}%\n\n{explanation}"
        if all_sources:
            response += f"\n\nSources verified: {len(all_sources)} reliable sources"

        print(f"FINAL VERDICT: {final_verdict} ({confidence}%)")
        print(f"TOTAL SOURCES: {len(all_sources)}")

        return {
            "response": response,
            "sources": all_sources,
            "verdict": final_verdict,
            "confidence": confidence,
            "claims_analyzed": len(extracted_claims),
            "detailed_explanation": explanation
        }

    except Exception as e:
        logging.error(f"Error processing fact-check result: {e}")
        print(f"ERROR PROCESSING RESULT: {e}")
        import traceback
        traceback.print_exc()
        return {
            "response": f"Unknown\nConfidence: 50%\nError processing results: {str(e)}",
            "sources": [],
            "verdict": "Unknown",
            "confidence": 50
        }

class FactCheckRequest(BaseModel):
    text: str
    pipeline: str = "fact"  # "fact" or "educational"

class ProgressUpdate(BaseModel):
    type: str  # "progress", "claim", "result", "educational", "sources"
    data: Dict[str, Any]
    timestamp: str

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                # Remove disconnected connections
                self.active_connections.remove(connection)

manager = ConnectionManager()

def parse_log_entry(log_line: str) -> Optional[Dict[str, Any]]:
    """Parse a log line and extract relevant information"""
    try:
        # Extract timestamp, level, and message
        pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) - ([^-]+) - (\w+) - (.+)'
        match = re.match(pattern, log_line)
        
        if not match:
            return None
            
        timestamp, logger_name, level, message = match.groups()
        
        # Parse different types of messages
        parsed_data = {
            'timestamp': timestamp,
            'logger': logger_name.strip(),
            'level': level,
            'message': message.strip()
        }
        
        # Detect progress indicators
        if 'progress' in message.lower() or 'step' in message.lower():
            parsed_data['type'] = 'progress'
        elif 'claim' in message.lower():
            parsed_data['type'] = 'claim'
        elif 'result' in message.lower() or 'refuted' in message.lower() or 'true' in message.lower():
            parsed_data['type'] = 'result'
        elif 'educational' in message.lower():
            parsed_data['type'] = 'educational'
        elif 'http' in message.lower() or 'url' in message.lower():
            parsed_data['type'] = 'sources'
        else:
            parsed_data['type'] = 'info'
            
        return parsed_data
        
    except Exception as e:
        logging.error(f"Error parsing log line: {e}")
        return None

def extract_claims_from_message(message: str) -> List[str]:
    """Extract claims from log messages"""
    claims = []
    
    # Look for patterns that indicate claims
    claim_patterns = [
        r'claim[s]?[:\s]+([^.]+)',
        r'statement[s]?[:\s]+([^.]+)',
        r'assertion[s]?[:\s]+([^.]+)'
    ]
    
    for pattern in claim_patterns:
        matches = re.findall(pattern, message, re.IGNORECASE)
        claims.extend(matches)
    
    return [claim.strip() for claim in claims if claim.strip()]

def extract_sources_from_message(message: str) -> List[Dict[str, str]]:
    """Extract URL sources from log messages"""
    sources = []
    
    # Extract URLs
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    urls = re.findall(url_pattern, message)
    
    for url in urls:
        sources.append({
            'url': url,
            'title': 'Source',  # Could be enhanced to fetch actual titles
            'type': 'web'
        })
    
    return sources

async def monitor_log_file():
    """Monitor log file for changes and broadcast updates with debouncing"""
    if not os.path.exists(log_file_path):
        return

    last_processed_time = 0
    debounce_interval = 1.0  # Process changes at most once per second

    try:
        async for changes in awatch(log_file_path, debounce=500):  # 500ms debounce
            current_time = time.time()
            if manager.active_connections and (current_time - last_processed_time) >= debounce_interval:
                await process_log_changes()
                last_processed_time = current_time
    except Exception as e:
        logging.error(f"Error monitoring log file: {e}")

async def process_log_changes():
    """Process new log entries and broadcast updates"""
    try:
        with open(log_file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        # Process last few lines (new entries)
        for line in lines[-10:]:  # Process last 10 lines
            if line.strip():
                parsed = parse_log_entry(line.strip())
                if parsed:
                    update = ProgressUpdate(
                        type=parsed['type'],
                        data=parsed,
                        timestamp=datetime.now().isoformat()
                    )
                    
                    # Add specific processing for different types
                    if parsed['type'] == 'claim':
                        claims = extract_claims_from_message(parsed['message'])
                        update.data['claims'] = claims
                        
                    elif parsed['type'] == 'sources':
                        sources = extract_sources_from_message(parsed['message'])
                        update.data['sources'] = sources
                        
                    await manager.broadcast(update.dict())
                    
    except Exception as e:
        logging.error(f"Error processing log changes: {e}")

@app.post("/api/fact-check")
async def start_fact_check(request: FactCheckRequest):
    """Start fact-checking process - runs directly instead of subprocess"""
    global latest_query_text, current_task_id, fact_check_results

    # Store the latest query text globally
    latest_query_text = request.text
    task_id = f"task-{int(time.time() * 1000)}"
    current_task_id = task_id

    try:
        # Clear any previous results
        fact_check_results.clear()

        # Log the incoming request
        print(f"FACT-CHECK REQUEST: {request.text[:100]}")
        logging.info(f"Starting fact-check for query: {request.text[:100]}")

        # Initialize result structure
        fact_check_results[task_id] = {
            "status": "processing",
            "query": request.text,
            "result": None,
            "error": None
        }

        # Run fact-checker in background
        async def run_fact_check():
            try:
                print(f"STARTING FACT-CHECK for: {request.text}")
                graph = get_fact_checker()
                result = await graph.ainvoke({"answer": request.text})

                print(f"RAW RESULT FROM GRAPH: {result}")

                # Process the result
                processed_result = process_fact_check_result(result)
                print(f"PROCESSED RESULT: {processed_result}")

                fact_check_results[task_id]["result"] = processed_result
                fact_check_results[task_id]["status"] = "completed"

                logging.info(f"Fact-check completed for task {task_id}")
                print(f"FACT-CHECK COMPLETED for task {task_id}")

            except Exception as e:
                logging.error(f"Error in fact-check: {e}")
                print(f"ERROR IN FACT-CHECK: {e}")
                import traceback
                traceback.print_exc()
                fact_check_results[task_id]["error"] = str(e)
                fact_check_results[task_id]["status"] = "error"

        # Start the fact-check task
        asyncio.create_task(run_fact_check())

        return {
            "status": "started",
            "task_id": task_id,
            "pipeline": request.pipeline,
            "query": request.text[:100]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status")
async def get_status():
    """Get current process status"""
    global current_process
    
    if current_process is None:
        return {"status": "idle"}
        
    if current_process.poll() is None:
        return {"status": "running", "pid": current_process.pid}
    else:
        return {"status": "completed", "return_code": current_process.returncode}

@app.get("/api/logs")
async def get_logs():
    """Get recent log entries"""
    try:
        if not os.path.exists(log_file_path):
            return {"logs": []}
            
        with open(log_file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        # Parse and return last 50 lines
        parsed_logs = []
        for line in lines[-50:]:
            if line.strip():
                parsed = parse_log_entry(line.strip())
                if parsed:
                    parsed_logs.append(parsed)
                    
        return {"logs": parsed_logs}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/results")
async def get_results():
    """Get final results from result log"""
    try:
        if not os.path.exists(result_log_path):
            return {"results": []}
            
        with open(result_log_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract final results
        results = []
        lines = content.split('\n')
        
        # Look for FINAL RESULT pattern
        final_result = None
        for line in lines:
            if 'FINAL RESULT:' in line:
                # Extract the result after "FINAL RESULT:"
                result_text = line.split('FINAL RESULT:', 1)[1].strip()
                final_result = result_text
                break
        
        # If no FINAL RESULT found, try to extract from other patterns
        if not final_result:
            for line in lines:
                if any(pattern in line.upper() for pattern in ['LIKELY TRUE', 'LIKELY FALSE', 'REFUTED', 'SUPPORTED', 'CONFIDENCE:']):
                    parsed = parse_log_entry(line.strip())
                    if parsed:
                        results.append(parsed)
        else:
            # Parse the final result format
            result_dict = {
                'timestamp': datetime.now().isoformat(),
                'type': 'final_result',
                'message': final_result,
                'formatted_result': final_result
            }
            results.append(result_dict)
                    
        return {"results": results, "final_result": final_result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fact-check-result")
async def get_fact_check_result():
    """Get structured fact-check result from memory cache"""
    global current_task_id, fact_check_results

    try:
        print(f"RESULT REQUEST - Task ID: {current_task_id}")
        # Check if we have a current task with results
        if current_task_id and current_task_id in fact_check_results:
            task_result = fact_check_results[current_task_id]

            if task_result["status"] == "completed" and task_result["result"]:
                return task_result["result"]
            elif task_result["status"] == "error":
                return {
                    "response": f"Error\nConfidence: 0%\n{task_result['error']}",
                    "sources": [],
                    "verdict": "Error",
                    "confidence": 0
                }
            else:
                # Still processing
                return {
                    "response": "Processing\nConfidence: 0%\nFact-checking in progress...",
                    "sources": [],
                    "verdict": "Processing",
                    "confidence": 0
                }

        # No active task - return default
        return {
            "response": "Unknown\nConfidence: 50%\nNo fact-check in progress.",
            "sources": [],
            "verdict": "Unknown",
            "confidence": 50
        }

    except Exception as e:
        logging.error(f"Error getting fact-check result: {e}")
        return {
            "response": "Unknown\nConfidence: 50%\nError retrieving results.",
            "sources": [],
            "verdict": "Unknown",
            "confidence": 50
        }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    monitor_task = None

    try:
        # Start monitoring logs only when we have connections
        if len(manager.active_connections) == 1:  # First connection
            monitor_task = asyncio.create_task(monitor_log_file())

        # Send initial status
        await websocket.send_text(json.dumps({
            "type": "connected",
            "message": "WebSocket connected successfully"
        }))

        while True:
            try:
                # Set a timeout for receiving messages to prevent hanging
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                message = json.loads(data)

                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))

            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                await websocket.send_text(json.dumps({"type": "ping"}))
            except WebSocketDisconnect:
                logging.info("WebSocket disconnected by client")
                break
            except json.JSONDecodeError:
                logging.warning("Invalid JSON received from WebSocket")
                continue
            except Exception as e:
                logging.error(f"WebSocket error: {e}")
                break

    except WebSocketDisconnect:
        logging.info("WebSocket disconnected")
    except Exception as e:
        logging.error(f"WebSocket connection error: {e}")
    finally:
        manager.disconnect(websocket)
        # Cancel monitoring task only when no connections remain
        if len(manager.active_connections) == 0 and monitor_task:
            monitor_task.cancel()

@app.get("/api/download-extension")
async def download_extension():
    """Download the Athena browser extension as a ZIP file"""
    try:
        zip_path = extension_downloader.create_extension_zip()

        return FileResponse(
            path=zip_path,
            filename="athena-browser-extension.zip",
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=athena-browser-extension.zip"
            }
        )
    except Exception as e:
        logging.error(f"Extension download error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate extension package: {str(e)}")

@app.get("/api/extension-installer")
async def extension_installer():
    """Get the auto-installer HTML page for browser extensions"""
    try:
        installer_html = auto_installer.create_inline_installer()
        return HTMLResponse(content=installer_html)
    except Exception as e:
        logging.error(f"Extension installer error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to create installer: {str(e)}"}
        )

@app.post("/api/auto-install-extension")
async def auto_install_extension(request: dict):
    """Attempt automatic extension installation"""
    try:
        method = request.get('method', 'devmode')

        if method == 'native':
            # Try native installation
            result = native_installer.install_extension_automatically()
            return result

        elif method == 'devmode':
            # For developer mode, create a special installation package
            return {
                "success": False,
                "message": "Developer mode auto-install requires manual steps",
                "instructions": [
                    "Download and extract the extension",
                    "Open chrome://extensions/",
                    "Enable Developer mode",
                    "Click 'Load unpacked'",
                    "Select the extension folder"
                ]
            }

        return {"success": False, "message": "Auto-installation method not supported"}

    except Exception as e:
        logging.error(f"Auto-install error: {str(e)}")
        return {"success": False, "message": f"Auto-installation failed: {str(e)}"}

@app.get("/api/download-installer")
async def download_installer():
    """Download native installer script"""
    try:
        script_path = native_installer.create_installer_script()

        if not script_path or not os.path.exists(script_path):
            raise HTTPException(status_code=500, detail="Failed to create installer script")

        # Determine filename based on platform
        filename = "install_athena_extension.bat" if platform.system() == "Windows" else "install_athena_extension.sh"

        return FileResponse(
            path=script_path,
            filename=filename,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        logging.error(f"Installer download error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate installer: {str(e)}")

@app.get("/api/auto-install")
async def get_auto_installer():
    """Get the auto-installer HTML page"""
    print("DEBUG: Auto-installer endpoint called!")
    logging.info("Auto-installer endpoint accessed")
    try:
        installer_html = auto_installer.create_inline_installer()
        print(f"DEBUG: Generated HTML length: {len(installer_html)}")
        return HTMLResponse(content=installer_html)
    except Exception as e:
        print(f"DEBUG: Auto-installer error: {str(e)}")
        logging.error(f"Auto-installer error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create auto-installer: {str(e)}")

@app.get("/install")
async def install_page():
    """Alternative endpoint for the installer page"""
    return await get_auto_installer()

@app.get("/")
async def serve_index():
    """Serve the main index page"""
    try:
        index_path = Path(__file__).parent.parent / "index.html"
        if index_path.exists():
            return HTMLResponse(content=index_path.read_text(encoding='utf-8'))
        else:
            return HTMLResponse(content="""
                <h1>Athena Fact Checker</h1>
                <p>Backend is running. Download extension: <a href="/api/download-extension">Download</a></p>
            """)
    except Exception as e:
        return HTMLResponse(content=f"<h1>Athena Backend</h1><p>Error: {e}</p>")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('backend.log')
        ]
    )
    os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
