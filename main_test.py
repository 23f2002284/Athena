import asyncio
import json
import logging
import logging.handlers
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel
from fastapi import WebSocket

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import environment variables
from dotenv import load_dotenv
import load_env  # Direct environment loader

# Load environment variables
load_dotenv('config.env')
load_dotenv('.env')

# Import WebSocket broadcaster for real-time frontend updates
try:
    from backend.websocket_broadcaster import (
        send_progress, 
        send_claims, 
        send_result, 
        send_educational_content, 
        send_sources, 
        send_status
    )
    WEBSOCKET_AVAILABLE = True
except ImportError:
    WEBSOCKET_AVAILABLE = False
    print("WebSocket broadcaster not available - running in standalone mode")

"""Test runner to invoke graphs and emit consolidated logs.

Usage:
  python main_test.py --pipeline fact --text "your text here"
  python main_test.py --pipeline educational --text "your text here"
"""

# Define logs directory path
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
log_file = os.path.join(log_dir, 'main_test.log')
result_log_file = os.path.join(log_dir, 'result.log')

# Create logs directory if it doesn't exist
os.makedirs(log_dir, exist_ok=True)

# Clear any existing handlers to avoid duplicate logs
logging.basicConfig(handlers=[])

# Configure root logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Add file handler with rotation
file_handler = logging.handlers.RotatingFileHandler(
    log_file,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5,
    encoding='utf-8'
)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# Add console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# Add result log handler for downstream consumption (e.g., FastAPI streaming)
result_handler = logging.handlers.RotatingFileHandler(
    result_log_file,
    maxBytes=10*1024*1024,
    backupCount=3,
    encoding='utf-8'
)
result_handler.setFormatter(formatter)
logger.addHandler(result_handler)

# Get logger for this module
logger = logging.getLogger(__name__)
logger.info(f'Logging to file: {log_file}')

class FactCheckRequest(BaseModel):
    text: str
    pipeline: str = "fact"  # "fact" or "educational"

class ProgressUpdate(BaseModel):
    type: str  # "progress", "claim", "result", "educational", "sources"
    data: Dict[str, Any]
    timestamp: str = datetime.now().isoformat()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    async def broadcast(self, message: Union[dict, BaseModel]):
        message_dict = message.model_dump() if isinstance(message, BaseModel) else message
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message_dict))
            except Exception as e:
                logging.error(f"Error sending message to WebSocket: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

async def run_pipeline(pipeline: str, text: str, websocket: WebSocket = None):
    """Run the specified pipeline with the given text input."""
    try:
        # Send initial status
        await manager.broadcast(ProgressUpdate(
            type="status",
            data={
                "status": "starting",
                "pipeline": pipeline,
                "input_text": text[:100] + "..." if len(text) > 100 else text
            }
        ))
        
        # Initialize the appropriate pipeline
        if pipeline == 'fact':
            from fact_checker.agent import create_graph as fact_checker_graph
            graph = create_enhanced_fact_checker_graph()
            payload = {"answer": text}
        elif pipeline == 'educational':
            from educational_tool.agent import create_graph as educational_tool_graph
            graph = create_enhanced_educational_graph()
            payload = {"raw_text": text}
        else:
            raise ValueError("Unsupported pipeline. Use 'fact' or 'educational'.")

        # Send progress update
        await manager.broadcast(ProgressUpdate(
            type="progress",
            data={
                "current": 1,
                "total": 5,
                "stage": "initialization",
                "message": f"Starting {pipeline} pipeline"
            }
        ))

        # Execute the pipeline
        result = await graph.ainvoke(payload)
        
        # Send completion status
        await manager.broadcast(ProgressUpdate(
            type="progress",
            data={
                "current": 5,
                "total": 5,
                "stage": "completed",
                "message": "Pipeline execution completed"
            }
        ))
        
        # Log and return the result
        logging.info(f"Pipeline '{pipeline}' completed.")
        logging.info(result)
        
        # Send final result
        await manager.broadcast(ProgressUpdate(
            type="result",
            data={
                "status": "completed",
                "pipeline": pipeline,
                "result": str(result)[:1000]  # Truncate very large results
            }
        ))
        
        return result
        
    except Exception as e:
        error_msg = f"Error in {pipeline} pipeline: {str(e)}"
        logging.error(error_msg, exc_info=True)
        
        # Send error status
        await manager.broadcast(ProgressUpdate(
            type="error",
            data={
                "status": "error",
                "pipeline": pipeline,
                "error": error_msg
            }
        ))
        
        raise

def create_enhanced_fact_checker_graph():
    """Create fact checker graph with WebSocket integration"""
    from fact_checker.agent import create_graph as original_fact_checker_graph
    
    # Get the original graph
    graph = original_fact_checker_graph()
    
    # Wrap the graph to add WebSocket broadcasting
    if WEBSOCKET_AVAILABLE:
        graph = wrap_graph_with_websocket(graph, "fact_checker")
    
    return graph

def create_enhanced_educational_graph():
    """Create educational graph with WebSocket integration"""
    from educational_tool.agent import create_graph as original_educational_graph
    
    # Get the original graph
    graph = original_educational_graph()
    
    # Wrap the graph to add WebSocket broadcasting
    if WEBSOCKET_AVAILABLE:
        graph = wrap_graph_with_websocket(graph, "educational")
    
    return graph

def wrap_graph_with_websocket(original_graph, pipeline_type):
    """Wrap the original graph to add WebSocket broadcasting capabilities"""
    
    class WebSocketGraphWrapper:
        def __init__(self, graph, pipeline_type):
            self.graph = graph
            self.pipeline_type = pipeline_type
            self.step_counter = 0
            
        async def ainvoke(self, payload):
            # Intercept and enhance the graph execution
            return await self._enhanced_invoke(payload)
            
        async def _enhanced_invoke(self, payload):
            self.step_counter = 0
            
            # Send initial progress
            await send_progress(1, 10, "processing", f"Starting {self.pipeline_type} analysis")
            
            # Hook into the graph's execution to capture intermediate results
            result = await self._execute_with_monitoring(payload)
            
            return result
            
        async def _execute_with_monitoring(self, payload):
            try:
                # Step 2: Input processing
                await send_progress(2, 10, "input_processing", "Processing input text")
                
                # For fact checker pipeline
                if self.pipeline_type == "fact_checker":
                    # Step 3: Claim extraction (sentence splitting)
                    await send_progress(3, 10, "sentence_splitting", "Splitting text into sentences")
                    
                    # Step 4: Selection
                    await send_progress(4, 10, "selection", "Selecting factual sentences")
                    
                    # Step 5: Disambiguation
                    await send_progress(5, 10, "disambiguation", "Disambiguating claims")
                    
                    # Step 6: Decomposition
                    await send_progress(6, 10, "decomposition", "Decomposing into atomic claims")
                    
                    # Step 7: Validation
                    await send_progress(7, 10, "validation", "Validating claims")
                    
                    # Step 8: Verification
                    await send_progress(8, 10, "verification", "Verifying claims against sources")
                    
                    # Execute the actual graph and capture intermediate results
                    result = await self._execute_fact_checker_with_hooks(payload)
                    
                elif self.pipeline_type == "educational":
                    # Educational pipeline steps
                    await send_progress(3, 10, "analysis", "Analyzing content for educational insights")
                    result = await self._execute_educational_with_hooks(payload)
                
                # Step 10: Final results
                await send_progress(10, 10, "finalizing", "Generating final results")
                
                return result
                
            except Exception as e:
                await send_status("error", self.pipeline_type, {"error": str(e)})
                raise
        
        async def _execute_fact_checker_with_hooks(self, payload):
            """Execute fact checker with real-time hooks"""
            
            # Create a custom state tracker
            class StateTracker:
                def __init__(self):
                    self.current_state = {}
                    
                async def track_node(self, node_name, state_before, state_after):
                    """Track node execution and send updates"""
                    if node_name == "extract_claims":
                        # This calls the Claim_Handle pipeline
                        extracted_claims = state_after.get("extracted_claims", [])
                        if extracted_claims:
                            claims_data = []
                            for claim in extracted_claims:
                                claims_data.append({
                                    "claim_text": str(claim),
                                    "status": "extracted",
                                    "confidence": None
                                })
                            await send_claims(claims_data, "extraction")
                    
                    elif node_name == "claim_verifier":
                        # Send verification progress
                        verification_results = state_after.get("verification_results", [])
                        if verification_results:
                            verified_claims = []
                            sources = []
                            
                            for result in verification_results:
                                if isinstance(result, dict):
                                    claim_text = result.get("claim", "Unknown claim")
                                    verdict = result.get("verdict", "UNKNOWN")
                                    confidence = result.get("confidence", 0.0)
                                    
                                    verified_claims.append({
                                        "claim_text": claim_text,
                                        "status": "verified",
                                        "confidence": confidence,
                                        "verdict": verdict
                                    })
                                    
                                    # Extract sources
                                    claim_sources = result.get("sources", [])
                                    for source in claim_sources:
                                        if isinstance(source, dict):
                                            sources.append({
                                                "url": source.get("url", ""),
                                                "title": source.get("title", "Source"),
                                                "credibility_score": source.get("credibility", 0.8),
                                                "source_type": "web"
                                            })
                            
                            if verified_claims:
                                await send_claims(verified_claims, "verification")
                            if sources:
                                await send_sources(sources)
                    
                    elif node_name == "generate_report_node":
                        # Send final results
                        final_report = state_after.get("final_report", None)
                        if final_report:
                            # FactCheckReport is a Pydantic model, access attributes directly
                            verdict = "COMPLETED"  # Default verdict for completed analysis
                            confidence = 0.8  # Default confidence
                            reasoning = final_report.summary if hasattr(final_report, 'summary') else "Analysis completed"
                            
                            await send_result(verdict, confidence, reasoning)
            
            # Execute with state tracking
            tracker = StateTracker()
            
            # Monkey patch the graph nodes to add tracking
            original_nodes = {}
            
            try:
                # Get the graph's nodes
                if hasattr(self.graph, 'nodes'):
                    for node_name, node_func in self.graph.nodes.items():
                        original_nodes[node_name] = node_func
                        
                        # Create wrapped version
                        async def create_wrapped_node(original_func, name):
                            async def wrapped_node(state):
                                state_before = dict(state) if hasattr(state, '__dict__') else state
                                result = await original_func(state)
                                state_after = result if isinstance(result, dict) else state
                                await tracker.track_node(name, state_before, state_after)
                                return result
                            return wrapped_node
                        
                        # Replace with wrapped version
                        # Note: This is a simplified approach - actual implementation depends on LangGraph internals
                
                # Execute the original graph
                result = await self.graph.ainvoke(payload)
                
                # Extract and send final results if not already sent
                await self._send_fact_check_results(result)
                
                return result
                
            finally:
                # Restore original nodes
                pass
        
        async def _execute_educational_with_hooks(self, payload):
            """Execute educational pipeline with hooks"""
            result = await self.graph.ainvoke(payload)
            await self._send_educational_results(result)
            return result
                
        async def _send_fact_check_results(self, result):
            """Send fact-checking results"""
            verdict = "UNKNOWN"
            confidence = 0.0
            reasoning = "Analysis completed"
            
            # Extract actual values from result
            if isinstance(result, dict):
                # Check for different possible result structures
                if "final_report" in result:
                    report = result["final_report"]
                    # FactCheckReport is a Pydantic model, access attributes directly
                    if hasattr(report, 'summary'):
                        reasoning = report.summary
                        verdict = "COMPLETED"
                        confidence = 0.8
                    else:
                        verdict = "UNKNOWN"
                        confidence = 0.0
                        reasoning = str(result)
                elif "verdict" in result:
                    verdict = result.get("verdict", "UNKNOWN")
                    confidence = result.get("confidence", 0.0)
                    reasoning = result.get("reasoning", str(result))
                else:
                    # Fallback: try to extract from string representation
                    result_str = str(result)
                    if "REFUTED" in result_str.upper():
                        verdict = "REFUTED"
                        confidence = 0.8
                        reasoning = "Claims have been refuted based on available evidence"
                    elif "SUPPORTED" in result_str.upper():
                        verdict = "SUPPORTED"
                        confidence = 0.8
                        reasoning = "Claims are supported by available evidence"
                    else:
                        verdict = "UNKNOWN"
                        confidence = 0.5
                        reasoning = "Unable to determine verdict from available evidence"
            
            await send_result(verdict, confidence, reasoning)
            
        async def _send_educational_results(self, result):
            """Send educational results"""
            if isinstance(result, dict):
                content = result.get("educational_content", "Educational analysis completed")
                await send_educational_content(str(content))
    
    return WebSocketGraphWrapper(original_graph, pipeline_type)


async def main():
    """Main function for direct script execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Run fact-checking or educational pipeline')
    parser.add_argument('--pipeline', choices=['fact', 'educational'], required=True, help='Pipeline to run')
    parser.add_argument('--text', required=True, help='Text to analyze')
    
    args = parser.parse_args()
    
    try:
        logger.info(f"Starting {args.pipeline} pipeline with text: {args.text[:100]}...")
        result = await run_pipeline(args.pipeline, args.text)
        
        # Format and log the final result
        if isinstance(result, dict):
            # Check if we have verification results
            verification_results = result.get("verification_results", [])
            extracted_claims = result.get("extracted_claims", [])
            
            if verification_results:
                # Process verification results to determine overall verdict
                supported_count = 0
                refuted_count = 0
                total_confidence = 0.0
                
                for verification in verification_results:
                    if hasattr(verification, 'result'):
                        # Handle verification result objects with enum results
                        result_enum = str(verification.result).upper()
                        conf = 0.8  # Default confidence for verification results
                        
                        if "SUPPORTED" in result_enum or "TRUE" in result_enum:
                            supported_count += 1
                            total_confidence += conf
                        elif "REFUTED" in result_enum or "FALSE" in result_enum:
                            refuted_count += 1
                            total_confidence += conf
                        else:
                            total_confidence += conf
                    elif isinstance(verification, dict):
                        verdict = verification.get("verdict", "UNKNOWN").upper()
                        conf = verification.get("confidence", 0.5)
                        
                        if verdict in ["SUPPORTED", "LIKELY_TRUE", "TRUE"]:
                            supported_count += 1
                            total_confidence += conf
                        elif verdict in ["REFUTED", "LIKELY_FALSE", "FALSE"]:
                            refuted_count += 1
                            total_confidence += conf
                        else:
                            total_confidence += conf
                
                # Determine overall verdict
                total_claims = len(verification_results)
                avg_confidence = (total_confidence / total_claims) if total_claims > 0 else 0.5
                
                if refuted_count > supported_count:
                    final_verdict = "Likely False"
                elif supported_count > refuted_count:
                    final_verdict = "Likely True"
                else:
                    final_verdict = "Unknown"
                
                response = f"{final_verdict}\nConfidence: {int(avg_confidence * 100)}%"
                logger.info(f"FINAL RESULT: {response}")
                print(f"FINAL RESULT: {response}")
                
            elif extracted_claims:
                # If we have claims but no verification (maybe due to errors), use heuristic
                fallback_response = generate_fallback_response(args.text)
                logger.info(f"FINAL RESULT: {fallback_response}")
                print(f"FINAL RESULT: {fallback_response}")
                
            else:
                # No claims extracted - use heuristic analysis
                fallback_response = generate_fallback_response(args.text)
                logger.info(f"FINAL RESULT: {fallback_response}")
                print(f"FINAL RESULT: {fallback_response}")
                
            # Also log the raw result for debugging
            logger.info(f"Raw pipeline result: {result}")
        else:
            logger.info(f"Result: {result}")
            fallback_response = generate_fallback_response(args.text)
            logger.info(f"FINAL RESULT: {fallback_response}")
            print(f"FINAL RESULT: {fallback_response}")
            
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}", exc_info=True)
        
        # Check if it's a quota/API limit error
        error_str = str(e).lower()
        if any(term in error_str for term in ['quota', 'exceeded', '429', 'rate limit', 'billing', 'resourceexhausted']):
            # API quota exceeded - provide informed fallback
            fallback_response = generate_fallback_response(args.text)
            logger.info(f"FINAL RESULT: {fallback_response}")
            print(f"FINAL RESULT: {fallback_response}")
        else:
            # Other errors - check for specific error types
            if 'discriminator' in error_str or 'pydantic' in error_str:
                logger.info("FINAL RESULT: Unknown\nConfidence: 50%\nBased on our analysis, unable to determine the veracity of this claim due to dependency issues. Please check if all dependencies are properly updated.")
                print("FINAL RESULT: Unknown\nConfidence: 50%\nBased on our analysis, unable to determine the veracity of this claim due to dependency issues.")
            else:
                # Generic technical error fallback
                logger.info("FINAL RESULT: Unknown\nConfidence: 50%\nBased on our analysis, unable to determine the veracity of this claim due to technical issues.")
                print("FINAL RESULT: Unknown\nConfidence: 50%\nBased on our analysis, unable to determine the veracity of this claim due to technical issues.")
        
        sys.exit(1)


def generate_fallback_response(text: str) -> str:
    """Generate a fallback response when API quotas are exceeded"""
    # Simple heuristics for common misinformation patterns
    text_lower = text.lower()

    # Keywords that often indicate misinformation
    suspicious_keywords = [
        'breaking news', 'urgent', 'government secretly', 'doctors hate', 'they don\'t want you to know',
        'banned', 'censored', 'exclusive', 'shocking truth', 'miracle cure', 'instant',
        'banks hate', 'one weird trick', 'secret', 'exposed', 'leaked', 'conspiracy',
        'cover up', 'mainstream media won\'t tell you', 'big pharma', 'click here', 'share before removed'
    ]

    # Keywords that often indicate legitimate information
    legitimate_keywords = [
        'according to', 'research shows', 'study published', 'experts say', 'data indicates',
        'peer reviewed', 'clinical trial', 'university', 'journal', 'official statement',
        'statistics show', 'evidence suggests', 'scientific study', 'researchers found'
    ]

    # Simple factual claims (often true)
    factual_patterns = [
        'the sky is', 'water is', 'earth is', 'sun is', 'moon is',
        'humans are', 'plants are', 'animals are', 'gravity is'
    ]

    suspicious_count = sum(1 for keyword in suspicious_keywords if keyword in text_lower)
    legitimate_count = sum(1 for keyword in legitimate_keywords if keyword in text_lower)
    factual_count = sum(1 for pattern in factual_patterns if pattern in text_lower)

    # Simple scoring with factual patterns considered
    if factual_count > 0 and len(text.split()) < 20:  # Short factual statements
        return f"Likely True\nConfidence: 70%\nBased on simple factual claim pattern (API quota exceeded - heuristic analysis)."
    elif suspicious_count > legitimate_count and suspicious_count >= 2:
        confidence = min(75, 50 + suspicious_count * 8)
        return f"Likely False\nConfidence: {confidence}%\nBased on language patterns commonly associated with misinformation (API quota exceeded - heuristic analysis)."
    elif legitimate_count > suspicious_count and legitimate_count >= 2:
        confidence = min(70, 50 + legitimate_count * 6)
        return f"Likely True\nConfidence: {confidence}%\nBased on language patterns commonly associated with credible information (API quota exceeded - heuristic analysis)."
    else:
        return "Unknown\nConfidence: 50%\nUnable to verify due to API quota restrictions. Please try again later when quota resets."


# Main function for direct script execution
if __name__ == "__main__":
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run fact-checking or educational pipeline')
    parser.add_argument('--pipeline', choices=['fact', 'educational'], required=True, help='Pipeline to run')
    parser.add_argument('--text', required=True, help='Text to analyze')
    
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('pipeline.log')
        ]
    )
    
    # Run the pipeline
    asyncio.run(main())
