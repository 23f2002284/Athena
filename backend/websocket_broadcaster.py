import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import WebSocket

class WebSocketBroadcaster:
    """Singleton class to manage WebSocket connections and broadcast data"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WebSocketBroadcaster, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self.active_connections: List[WebSocket] = []
            self._initialized = True
    
    async def connect(self, websocket: WebSocket):
        """Add a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        logging.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logging.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def broadcast(self, message_type: str, data: Dict[str, Any]):
        """Broadcast a message to all connected clients"""
        message = {
            "type": message_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        
        # Always log the message for debugging
        logging.info(f"Broadcasting {message_type}: {json.dumps(data, indent=2)}")
        
        if not self.active_connections:
            logging.info(f"No active WebSocket connections. Message queued: {message_type}")
            return
        
        message_json = json.dumps(message)
        disconnected = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
                logging.info(f"Sent {message_type} to WebSocket client")
            except Exception as e:
                logging.error(f"Error sending message to WebSocket: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            self.disconnect(conn)
    
    async def send_progress(self, current_step: int, total_steps: int, stage: str, description: str = ""):
        """Send progress update"""
        progress_percentage = (current_step / total_steps) * 100 if total_steps > 0 else 0
        
        await self.broadcast("progress", {
            "current_step": current_step,
            "total_steps": total_steps,
            "progress_percentage": progress_percentage,
            "stage": stage,
            "description": description
        })
    
    async def send_claims(self, claims: List[Dict[str, Any]], processing_stage: str):
        """Send claims data"""
        await self.broadcast("claims", {
            "claims": claims,
            "processing_stage": processing_stage,
            "count": len(claims)
        })
    
    async def send_result(self, verdict: str, confidence: float, reasoning: str, claims_breakdown: List[Dict[str, Any]] = None):
        """Send final result"""
        await self.broadcast("result", {
            "verdict": verdict,
            "confidence": confidence,
            "reasoning": reasoning,
            "claims_breakdown": claims_breakdown or []
        })
    
    async def send_educational_content(self, section_title: str, content: str, tips: List[str] = None, concepts: List[str] = None):
        """Send educational content"""
        await self.broadcast("educational", {
            "section_title": section_title,
            "content": content,
            "tips": tips or [],
            "related_concepts": concepts or []
        })
    
    async def send_sources(self, sources: List[Dict[str, Any]]):
        """Send source blocks"""
        await self.broadcast("sources", {
            "sources": sources,
            "count": len(sources)
        })
    
    async def send_error(self, error_message: str, error_type: str = "general"):
        """Send error message"""
        await self.broadcast("error", {
            "message": error_message,
            "error_type": error_type
        })
    
    async def send_status(self, status: str, pipeline: str = None, additional_info: Dict[str, Any] = None):
        """Send status update"""
        data = {
            "status": status,
            "pipeline": pipeline
        }
        if additional_info:
            data.update(additional_info)
        
        await self.broadcast("status", data)

# Global broadcaster instance
broadcaster = WebSocketBroadcaster()

# Convenience functions for easy access
async def send_progress(current_step: int, total_steps: int, stage: str, description: str = ""):
    try:
        await broadcaster.send_progress(current_step, total_steps, stage, description)
    except Exception as e:
        logging.error(f"Failed to send progress: {e}")

async def send_claims(claims: List[Dict[str, Any]], processing_stage: str):
    try:
        await broadcaster.send_claims(claims, processing_stage)
    except Exception as e:
        logging.error(f"Failed to send claims: {e}")

async def send_result(verdict: str, confidence: float, reasoning: str, claims_breakdown: List[Dict[str, Any]] = None):
    try:
        await broadcaster.send_result(verdict, confidence, reasoning, claims_breakdown)
    except Exception as e:
        logging.error(f"Failed to send result: {e}")

async def send_educational_content(section_title: str, content: str, tips: List[str] = None, concepts: List[str] = None):
    try:
        await broadcaster.send_educational_content(section_title, content, tips, concepts)
    except Exception as e:
        logging.error(f"Failed to send educational content: {e}")

async def send_sources(sources: List[Dict[str, Any]]):
    try:
        await broadcaster.send_sources(sources)
    except Exception as e:
        logging.error(f"Failed to send sources: {e}")

async def send_error(error_message: str, error_type: str = "general"):
    try:
        await broadcaster.send_error(error_message, error_type)
    except Exception as e:
        logging.error(f"Failed to send error: {e}")

async def send_status(status: str, pipeline: str = None, additional_info: Dict[str, Any] = None):
    try:
        await broadcaster.send_status(status, pipeline, additional_info)
    except Exception as e:
        logging.error(f"Failed to send status: {e}")
