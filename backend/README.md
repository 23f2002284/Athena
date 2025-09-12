# Athena Real-time Fact Checker Backend

This FastAPI backend provides real-time WebSocket streaming of fact-checking and educational pipeline data directly from the main_test.py execution to your React.js frontend.

## Features

- **Real-time WebSocket streaming** - Live updates as the pipeline processes
- **Progress tracking** - Step-by-step progress with percentage completion
- **Claims processing** - Real-time updates during split, disambiguation, and selection phases
- **Results streaming** - Final verdict (TRUE/FALSE/REFUTED) with confidence scores
- **Educational content** - Live educational mode content delivery
- **Source blocks** - Referenced URLs with credibility scores
- **Error handling** - Comprehensive error reporting and status updates

## Architecture

Instead of parsing log files, this system integrates directly with your existing pipeline:

1. **WebSocket Broadcaster** (`websocket_broadcaster.py`) - Singleton class managing all WebSocket connections
2. **Enhanced main_test.py** - Modified to send live data to frontend via WebSocket
3. **Real-time API** (`realtime_api.py`) - FastAPI server with WebSocket endpoints
4. **Models** (`models.py`) - Pydantic models for type safety

## API Endpoints

### HTTP Endpoints
- `POST /api/start-analysis` - Start fact-checking or educational analysis
- `GET /api/status` - Get current process status
- `POST /api/stop` - Stop current analysis
- `GET /api/health` - Health check with connection info
- `GET /` - API documentation

### WebSocket Endpoint
- `WS /ws` - Real-time updates stream

## WebSocket Events

The WebSocket sends JSON messages with the following event types:

### 1. Progress Updates
```json
{
  "type": "progress",
  "data": {
    "current_step": 3,
    "total_steps": 10,
    "progress_percentage": 30.0,
    "stage": "claim_extraction",
    "description": "Extracting and splitting claims"
  },
  "timestamp": "2025-09-11T17:28:36"
}
```

### 2. Claims Processing
```json
{
  "type": "claims",
  "data": {
    "claims": [
      {
        "claim_text": "RBI announced new banknote policy",
        "status": "processing",
        "confidence": null
      }
    ],
    "processing_stage": "splitting",
    "count": 1
  },
  "timestamp": "2025-09-11T17:28:36"
}
```

### 3. Final Results
```json
{
  "type": "result",
  "data": {
    "verdict": "REFUTED",
    "confidence": 0.85,
    "reasoning": "No official RBI announcement found",
    "claims_breakdown": [...]
  },
  "timestamp": "2025-09-11T17:28:36"
}
```

### 4. Educational Content
```json
{
  "type": "educational",
  "data": {
    "section_title": "How to Verify Financial News",
    "content": "Always check official RBI website...",
    "tips": ["Check official sources", "Look for verification"],
    "related_concepts": ["Media literacy", "Source verification"]
  },
  "timestamp": "2025-09-11T17:28:36"
}
```

### 5. Source Blocks
```json
{
  "type": "sources",
  "data": {
    "sources": [
      {
        "url": "https://rbi.org.in/official-announcement",
        "title": "RBI Official Website",
        "credibility_score": 0.95,
        "source_type": "official"
      }
    ],
    "count": 1
  },
  "timestamp": "2025-09-11T17:28:36"
}
```

### 6. Status Updates
```json
{
  "type": "status",
  "data": {
    "status": "running",
    "pipeline": "fact",
    "progress_percentage": 45.0,
    "current_step": "evidence_gathering"
  },
  "timestamp": "2025-09-11T17:28:36"
}
```

### 7. Error Messages
```json
{
  "type": "error",
  "data": {
    "message": "Failed to connect to external API",
    "error_type": "api_error",
    "pipeline": "fact"
  },
  "timestamp": "2025-09-11T17:28:36"
}
```

## Installation & Usage

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Start the server:**
```bash
python realtime_api.py
```

3. **Connect from frontend:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data.type, data.data);
};
```

4. **Start analysis:**
```javascript
fetch('http://localhost:8000/api/start-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Your text to analyze",
    pipeline: "fact"  // or "educational"
  })
});
```

## Integration with Existing Pipeline

The system wraps your existing LangGraph pipelines without modifying their core logic. The `WebSocketGraphWrapper` class intercepts the execution flow and sends updates at key stages:

- **Input processing** - Text preprocessing
- **Claim extraction** - Splitting text into verifiable claims
- **Disambiguation** - Clarifying ambiguous claims
- **Selection** - Choosing final claims to verify
- **Evidence gathering** - Collecting sources and evidence
- **Analysis** - Fact-checking process
- **Verification** - Final verdict determination
- **Results** - Formatted output with confidence scores

## Frontend Integration Example

```javascript
class FactCheckClient {
  constructor() {
    this.ws = new WebSocket('ws://localhost:8000/ws');
    this.setupWebSocket();
  }
  
  setupWebSocket() {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch(message.type) {
        case 'progress':
          this.updateProgressBar(message.data);
          break;
        case 'claims':
          this.displayClaims(message.data.claims);
          break;
        case 'result':
          this.showFinalResult(message.data);
          break;
        case 'educational':
          this.displayEducationalContent(message.data);
          break;
        case 'sources':
          this.showSources(message.data.sources);
          break;
      }
    };
  }
  
  async startAnalysis(text, pipeline = 'fact') {
    const response = await fetch('/api/start-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, pipeline })
    });
    return response.json();
  }
}
```

## Configuration

- **Host**: `0.0.0.0` (configurable)
- **Port**: `8000` (configurable)
- **CORS**: Enabled for all origins (configure for production)
- **WebSocket connections**: Unlimited (add rate limiting for production)

## Production Considerations

1. **Security**: Configure CORS origins properly
2. **Rate Limiting**: Add WebSocket connection limits
3. **Authentication**: Implement user authentication if needed
4. **Monitoring**: Add logging and metrics collection
5. **Scaling**: Consider Redis for multi-instance WebSocket management
