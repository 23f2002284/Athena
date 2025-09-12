import asyncio
import os
import sys

from dotenv import load_dotenv

# Add project root to path to allow imports from utils
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from langgraph.graph import StateGraph
from langgraph.graph.state import CompiledStateGraph

from Claim_Handle.nodes import (
    sentence_splitter_node,
    selection_node,
    disambiguation_node,
    decomposition_node,
    validation_node,
)

from Claim_Handle.schemas import State

load_dotenv()

def create_graph() -> CompiledStateGraph:
    """Set up the claim extraction workflow graph.

    The pipeline follows these steps:
    1. Split text into contextual sentences 
    2. Filter for sentences with factual content
    3. Resolve ambiguities like pronouns
    4. Extract specific atomic claims
    5. Validate claims are properly formed
    """
    workflow = StateGraph(State)

    # Add nodes
    workflow.add_node("sentence_splitter", sentence_splitter_node)
    workflow.add_node("selection", selection_node)
    workflow.add_node("disambiguation", disambiguation_node)
    workflow.add_node("decomposition", decomposition_node)
    workflow.add_node("validation", validation_node)

    # Add edges
    workflow.add_edge("sentence_splitter", "selection")
    workflow.add_edge("selection", "disambiguation")
    workflow.add_edge("disambiguation", "decomposition")
    workflow.add_edge("decomposition", "validation")

    # Set entry point
    workflow.set_entry_point("sentence_splitter")

    # Set finish point
    workflow.set_finish_point("validation")

    return workflow.compile()


graph = create_graph()
