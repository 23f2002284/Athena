from educational_tool.schemas import State
from educational_tool.nodes import education_full_report_node, education_sequential_report_node
from educational_tool.nodes import extract_fact_checking_report_node
from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph
from dotenv import load_dotenv
load_dotenv()

def create_graph() -> CompiledStateGraph:
    workflow = StateGraph(State)
    workflow.add_node("extract_fact_check_report", extract_fact_checking_report_node)
    # workflow.add_node("educational_report_node", education_full_report_node)
    workflow.add_node("educational_report_node", education_sequential_report_node)
    workflow.set_entry_point("extract_fact_check_report")
    workflow.add_edge("extract_fact_check_report", "educational_report_node")
    workflow.set_finish_point("educational_report_node")
    return workflow.compile()

graph = create_graph()