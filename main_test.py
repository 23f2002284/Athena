import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from Claim_Handle.agent import create_graph as claim_handle_graph
from Claim_Verification.agent import create_graph as claim_verification_graph
from fact_checker.agent import create_graph as fact_checker_graph
from educational_tool.agent import create_graph as educational_tool_graph
import asyncio
import logging
import logging.handlers

# Define logs directory path
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
log_file = os.path.join(log_dir, 'main_test.log')

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

# Get logger for this module
logger = logging.getLogger(__name__)
logger.info(f'Logging to file: {log_file}')

result_dict = {'raw_text': 'Breaking News: The Reserve Bank of India (RBI) has just announced that starting next week, all ₹500 banknotes without the new silver security thread will no longer be considered legal tender. Citizens are advised to exchange them at their nearest bank branch immediately to avoid losses.',
 'validated_claims': [{'claim': 'The Reserve Bank of India (RBI) has announced that starting next week, all ₹500 banknotes without the new silver security thread will no longer be considered legal tender',
   'result': 'Refuted'},
  {'claim': 'Citizens are advised to immediately exchange all ₹500 banknotes without the new silver security thread at their nearest bank branch',
   'result': 'Refuted'},
  {'claim': 'Citizens are advised to exchange all ₹500 banknotes without the new silver security thread at their nearest bank branch to avoid losses',
   'result': 'Refuted'}],
 'timestamp': '2025-09-08 14:18:52'}
# graph = fact_checker_graph()
async def check_facts():
    # result = await graph.ainvoke({"answer": input_data["answer"]})
    # logger.info("--------Fact Checking completed here is the result: ------")
    # logger.info(result)

    # return result
    graph = educational_tool_graph()
    result = await graph.ainvoke(
        {
            "raw_text": 'Breaking News: The Reserve Bank of India (RBI) has just announced that starting next week, all ₹500 banknotes without the new silver security thread will no longer be considered legal tender. Citizens are advised to exchange them at their nearest bank branch immediately to avoid losses.'
        }
    )
    logger.info("--------Fact Checking completed here is the result: ------")
    logger.info(result)

    return result

if __name__ == "__main__":
    asyncio.run(check_facts())
