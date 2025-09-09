# from educational_tool.schemas import State
from fact_checker.agent import graph as generate_report_graph
from typing import Dict, Any
from educational_tool.schemas import State
import logging
logger = logging.getLogger(__name__)
async def extract_fact_checking_report_node(state: State)-> Dict[str, Any]:
    """ Extract report from the answer text thorugh fact checking graph
    Args:
        state: Current Workflow containing text to extract claims and generate report 

    Returns:
        Dictionary with required fields
    """
    try:
        report_genaration_payload= {"answer": state.raw_text}
        extractor_report = await generate_report_graph.ainvoke(report_genaration_payload)
        raw_text = extractor_report.get("answer")
        validated_claims = [{"claim": extractor_report.get("verification_results")[i].claim_text, "result": extractor_report.get('verification_results')[0].model_dump()['result'].value} for i in range(len(extractor_report.get("verification_results")))]
        timestamp = extractor_report.get("final_report").timestamp.strftime("%Y-%m-%d %H:%M:%S")

        logger.info("Report generated successfully")
        return {
            "raw_text": raw_text,
            "extracted_claims": extractor_report.get("extracted_claims"),
            "verification_results": extractor_report.get("verification_results"),
            "final_report": extractor_report.get("final_report"),
            "validated_claims": validated_claims, 
            "timestamp": timestamp
        }
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        return {
            "raw_text": report_genaration_payload.get("answer"),
            "extracted_claims": [],
            "verification_results": [],
            "final_report": None,
            "validated_claims": [],
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }