import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging
import logging.handlers
import argparse

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
    if pipeline == 'fact':
        from fact_checker.agent import create_graph as fact_checker_graph
        graph = fact_checker_graph()
        payload = {"answer": text}
    elif pipeline == 'educational':
        from educational_tool.agent import create_graph as educational_tool_graph
        graph = educational_tool_graph()
        payload = {"raw_text": text}
    else:
        raise ValueError("Unsupported pipeline. Use 'fact' or 'educational'.")

    result = await graph.ainvoke(payload)
    logging.getLogger(__name__).info("Pipeline '%s' completed.", pipeline)
    logging.getLogger(__name__).info(result)
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run fact-checking or educational pipelines with logging.")
    parser.add_argument("--pipeline", choices=["fact", "educational"], default="fact")
    parser.add_argument("--text", type=str, default=(
        "Breaking News: The Reserve Bank of India (RBI) has just announced that starting next week, all ₹500 banknotes  without the new silver security thread will no longer be considered legal tender. Citizens are advised to exchange  them at their nearest bank branch immediately to avoid losses."
    ))
    args = parser.parse_args()

    asyncio.run(run_pipeline(args.pipeline, args.text))
