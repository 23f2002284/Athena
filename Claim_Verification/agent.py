import logging
import logging.handlers
import os
import sys

from dotenv import load_dotenv
from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph

# Add project root to path to allow imports from utils
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from Claim_Verification.nodes import (
    evaluate_evidence_node,
    generate_search_query_node,
    retrieve_evidence_node,
    search_decision_node,
)
from Claim_Verification.schemas import ClaimVerifierState

load_dotenv()

# Create logs directory if it doesn't exist
os.makedirs('logs', exist_ok=True)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.propagate = True


def create_graph() -> CompiledStateGraph:
    """Set up the iterative claim verification workflow.

    The pipeline follows these steps:
    1. Generate search query for a claim
    2. Retrieve evidence from web search
    3. Decide whether to continue searching or evaluate
    4. Either generate new query or make final evaluation
    """
    workflow = StateGraph(ClaimVerifierState)

    workflow.add_node("generate_search_query", generate_search_query_node)
    workflow.add_node("retrieve_evidence", retrieve_evidence_node)
    workflow.add_node("search_decision", search_decision_node)
    workflow.add_node("evaluate_evidence", evaluate_evidence_node)

    workflow.set_entry_point("generate_search_query")

    workflow.add_edge("generate_search_query", "retrieve_evidence")
    workflow.add_edge("retrieve_evidence", "search_decision")
    workflow.add_edge("search_decision", "evaluate_evidence")
    workflow.add_edge("evaluate_evidence", END)

    return workflow.compile()


graph = create_graph()

