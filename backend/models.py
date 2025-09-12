from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from enum import Enum

class PipelineType(str, Enum):
    FACT = "fact"
    EDUCATIONAL = "educational"

class MessageType(str, Enum):
    PROGRESS = "progress"
    CLAIM = "claim"
    RESULT = "result"
    EDUCATIONAL = "educational"
    SOURCES = "sources"
    INFO = "info"
    ERROR = "error"

class FactCheckRequest(BaseModel):
    text: str
    pipeline: PipelineType = PipelineType.FACT

class ProgressUpdate(BaseModel):
    type: MessageType
    data: Dict[str, Any]
    timestamp: str
    progress_percentage: Optional[float] = None

class ClaimData(BaseModel):
    claim_text: str
    status: str  # "processing", "verified", "refuted", "pending"
    confidence: Optional[float] = None
    sources: List[Dict[str, str]] = []

class ClaimsUpdate(BaseModel):
    type: MessageType = MessageType.CLAIM
    claims: List[ClaimData]
    current_step: str
    timestamp: str

class SourceBlock(BaseModel):
    url: str
    title: str
    snippet: Optional[str] = None
    credibility_score: Optional[float] = None
    source_type: str = "web"  # "web", "academic", "news", etc.

class ResultData(BaseModel):
    overall_verdict: str  # "TRUE", "FALSE", "MIXED", "INSUFFICIENT_EVIDENCE"
    confidence_score: float
    claims_breakdown: List[ClaimData]
    sources_used: List[SourceBlock]
    reasoning: str

class EducationalContent(BaseModel):
    section_title: str
    content: str
    tips: List[str] = []
    related_concepts: List[str] = []

class ProcessStatus(BaseModel):
    status: str  # "idle", "running", "completed", "error"
    pipeline: Optional[PipelineType] = None
    progress_percentage: float = 0.0
    current_step: Optional[str] = None
    pid: Optional[int] = None
    return_code: Optional[int] = None
    error_message: Optional[str] = None

class LogEntry(BaseModel):
    timestamp: str
    logger: str
    level: str
    message: str
    type: MessageType
    parsed_data: Optional[Dict[str, Any]] = None

class WebSocketMessage(BaseModel):
    type: str
    data: Optional[Dict[str, Any]] = None
    timestamp: str = None
    
    def __init__(self, **data):
        if data.get('timestamp') is None:
            data['timestamp'] = datetime.now().isoformat()
        super().__init__(**data)

class HealthCheck(BaseModel):
    status: str
    timestamp: str
    version: str = "1.0.0"
    uptime: Optional[float] = None
