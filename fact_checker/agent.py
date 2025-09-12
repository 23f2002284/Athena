import logging

from dotenv import load_dotenv
from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph

# Load environment variables from both files
load_dotenv('config.env')
load_dotenv('.env')

# Import direct environment loader
try:
    import load_env  # This will auto-load config.env into os.environ
except ImportError:
    pass

from .nodes import (
    claim_verifier_node,
    dispatch_claims_for_verification,
    extract_claims,
    generate_report_node,
)
from .schemas import State

# Configure root logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')



def create_graph() -> CompiledStateGraph:
    """Set up the main fact checker workflow graph.

    The pipeline follows these steps:
    1. Extract claims from input text
    2. Distribute claims for parallel verification
    3. Generate final report
    """
    workflow = StateGraph(State)

    # Add nodes
    workflow.add_node("extract_claims", extract_claims)
    workflow.add_node("claim_verifier", claim_verifier_node)
    workflow.add_node("generate_report_node", generate_report_node)

    # Set entry point
    workflow.set_entry_point("extract_claims")

    # Connect the nodes in sequence
    workflow.add_conditional_edges(
        "extract_claims", dispatch_claims_for_verification, ["claim_verifier", END]
    )
    workflow.add_edge("claim_verifier", "generate_report_node")

    # Set finish point
    workflow.set_finish_point("generate_report_node")

    return workflow.compile()


graph = create_graph()
