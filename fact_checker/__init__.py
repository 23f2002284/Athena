"""Fact Checker - Orchestration system for fact-checking pipelines.

Integrates claim extraction and verification into a complete workflow.
"""

from .agent import create_graph, graph
from .schemas import FactCheckReport, State

__all__ = [
    # Main functionality
    "create_graph",
    "graph",
    # Data models
    "State",
    "FactCheckReport",
]
