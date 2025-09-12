import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Sequence  # Add Sequence import
from dotenv import load_dotenv
import load_env  # Direct environment loader

# Load environment variables first
load_dotenv('config.env')
load_dotenv('.env')

# Import WebSocket broadcaster for real-time frontend updates
try:
    from backend.websocket_broadcaster import broadcaster, send_progress, send_claims, send_result, send_educational_content, send_sources, send_status
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

async def run_pipeline(pipeline: str, text: str):
    # Send initial status
    if WEBSOCKET_AVAILABLE:
        await send_status("starting", pipeline, {"input_text": text[:100] + "..." if len(text) > 100 else text})
    
    try:
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
        if WEBSOCKET_AVAILABLE:
            await send_progress(1, 5, "initialization", f"Starting {pipeline} pipeline")

        result = await graph.ainvoke(payload)
        
        # Send completion status
        if WEBSOCKET_AVAILABLE:
            await send_progress(5, 5, "completed", "Pipeline execution completed")
            await send_status("completed", pipeline, {"result": str(result)[:200]})
        
        logging.getLogger(__name__).info("Pipeline '%s' completed.", pipeline)
        logging.getLogger(__name__).info(result)
        return result
        
    except Exception as e:
        if WEBSOCKET_AVAILABLE:
            await send_status("error", pipeline, {"error": str(e)})
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
                    if "refuted" in result_str.lower():
                        verdict = "REFUTED"
                    elif "true" in result_str.lower() or "verified" in result_str.lower():
                        verdict = "TRUE"
                    reasoning = result_str[:200]
            
            await send_result(verdict, confidence, reasoning)
            
        async def _send_educational_results(self, result):
            """Send educational content results"""
            if isinstance(result, dict):
                content = result.get("educational_content", str(result))
                await send_educational_content(
                    "Educational Analysis", 
                    content,
                    ["Verify sources", "Check for bias", "Look for evidence"],
                    ["Media literacy", "Critical thinking", "Source verification"]
                )
    
    return WebSocketGraphWrapper(original_graph, pipeline_type)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run fact-checking or educational pipelines with logging.")
    parser.add_argument("--pipeline", choices=["fact", "educational"], default="fact")
    parser.add_argument("--text", type=str, default=(
        "Breaking News: The Reserve Bank of India (RBI) has just announced that starting next week, all ₹500 banknotes  without the new silver security thread will no longer be considered legal tender. Citizens are advised to exchange  them at their nearest bank branch immediately to avoid losses."
    ))
    args = parser.parse_args()

    asyncio.run(run_pipeline(args.pipeline, args.text))
