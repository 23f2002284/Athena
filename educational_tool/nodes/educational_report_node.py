
from educational_tool.schemas import EducationalToolReport
from utils import get_llm, call_llm_with_structured_output
from educational_tool.prompts import (
    DECEPTION_ANALYSIS_SYSTEM_PROMPT,
    DECEPTION_ANALYSIS_HUMAN_PROMPT,
    THREAT_ANALYSIS_SYSTEM_PROMPT,
    THREAT_ANALYSIS_HUMAN_PROMPT,
    COUNTERMEASURE_ANALYSIS_SYSTEM_PROMPT,
    COUNTERMEASURE_ANALYSIS_HUMAN_PROMPT,
    HOAX_IMPROVEMENT_SYSTEM_PROMPT,
    HOAX_IMPROVEMENT_HUMAN_PROMPT,
    FULL_REPORT_SYSTEM_PROMPT,
    FULL_REPORT_HUMAN_PROMPT,
    STRUCTURED_OUTPUT_HOAX_ARCHITECT_PROMPT,
    get_current_timestamp
)
from typing import Dict,Any
from datetime import datetime
import logging
from educational_tool.schemas import State
logger = logging.getLogger(__name__)


async def education_full_report_node(state: State)-> Dict[str, Any]:
    """
    Process the inputs and generate the educational report

    Args:
        inputs: Dictionary with the inputs

    Returns:
        Dict[str, Any]: The educational report
    """
    try:
        raw_text = state.raw_text
        validated_claims = state.validated_claims
        timestamp_of_report = state.timestamp
        llm = get_llm(model_name="gemini-2.5-flash")
        system_prompt = STRUCTURED_OUTPUT_HOAX_ARCHITECT_PROMPT.format(
            current_time = get_current_timestamp()
        )
        human_prompt = FULL_REPORT_HUMAN_PROMPT.format(
            answer_text = raw_text,
            verified_claims = validated_claims,
            timestamp = timestamp_of_report
        )
        messages = [
            ("system", system_prompt),
            (
                "human", human_prompt

            )
        ]
        response = await call_llm_with_structured_output(
            llm = llm,
            output_class = EducationalToolReport,
            messages =messages,
            context_desc="EducationalToolReportGeneration"
        )
        logger.info("Full report generated successfully")
        return {
            "education_report": response
        }
    except Exception as e:
        logger.error(f"Full report generation failed: {e}")
        return {
            "education_report": None
        }

import re
from typing import Dict, Any, List
from pydantic import BaseModel, Field

# Assume all necessary imports like logger, Verdict, LLM, etc., are present

# --- 1. Define Mini Pydantic Models for Each Step ---
# These ensure that each sequential call returns a predictable, structured output.

class PatternAnalysis(BaseModel):
    """Output schema for the deception analysis step."""
    pattern_of_misinformation: str = Field(
        description="Analysis of common patterns or techniques used in the misinformation"
    )

class ThreatAnalysis(BaseModel):
    """Output schema for the threat analysis step."""
    potential_of_spread: str = Field(
        description="Assessment of how likely this misinformation is to spread, including virality factors"
    )
    severity_of_misinformation: str = Field(
        description="Evaluation of the potential harm or impact, including a numeric score like 'X/10'"
    )

class CountermeasureAnalysis(BaseModel):
    """Output schema for the countermeasure analysis step."""
    recommended_steps: str = Field(
        description="Recommended fact-checking steps to verify information and avoid deception."
    )

class ImprovementAnalysis(BaseModel):
    """Output schema for the hoax improvement step."""
    funny_improvements_in_misinformation: str = Field(
        description="Humorous or creative ways the misinformation could be made more effective"
    )

# --- 2. The Refactored Sequential Node ---

async def education_sequential_report_node(state: State) -> Dict[str, Any]:
    """
    Generates the educational report by calling the LLM sequentially for each section.
    """
    try:
        # --- Initialization ---
        raw_text = state.raw_text
        validated_claims = state.validated_claims
        llm = get_llm(model_name="gemini-2.0-flash")
        current_time = get_current_timestamp()
        
        # This dictionary will hold the generated content from each step
        report_data = {}

        # --- STEP 1: Deception Pattern Analysis ---
        logger.info("Step 1: Analyzing deception patterns...")
        deception_response = await call_llm_with_structured_output(
            llm=llm,
            output_class=PatternAnalysis,
            messages=[
                ("system", DECEPTION_ANALYSIS_SYSTEM_PROMPT.format(current_time=current_time)),
                ("human", DECEPTION_ANALYSIS_HUMAN_PROMPT.format(report_data=raw_text,verified_claims=str(validated_claims)))
            ],
            context_desc="DeceptionAnalysis"
        )
        logger.info(f"Deception analysis response: {deception_response}")
        report_data.update(deception_response.model_dump() if deception_response else {"pattern_of_misinformation": "Analysis failed."})

        # --- STEP 2: Threat & Severity Analysis ---
        logger.info("Step 2: Analyzing threats and severity...")
        threat_response = await call_llm_with_structured_output(
            llm=llm,
            output_class=ThreatAnalysis,
            messages=[
                ("system", THREAT_ANALYSIS_SYSTEM_PROMPT.format(
                    current_time=current_time
                )),
                ("human", THREAT_ANALYSIS_HUMAN_PROMPT.format(
                    claim_text=raw_text,
                    verified_claims_summary=str(validated_claims)
                ))
            ],
            context_desc="ThreatAnalysis"
        )
        report_data.update(threat_response.model_dump() if threat_response else {
            "potential_of_spread": "Analysis failed.",
            "severity_of_misinformation": "Analysis failed. Score: 0/10"
        })

        # --- STEP 2': Counter measure analysis
        logger.info("Step 3: Analyzing countermeasures...")
        countermeasure_response = await call_llm_with_structured_output(
            llm=llm,
            output_class=CountermeasureAnalysis,
            messages=[
                ("system", COUNTERMEASURE_ANALYSIS_SYSTEM_PROMPT.format(
                    current_time=current_time,
                    previous_analysis_output=str(report_data['pattern_of_misinformation']+report_data['potential_of_spread'])
                )),
                ("human", COUNTERMEASURE_ANALYSIS_HUMAN_PROMPT.format(
                    claim_text=raw_text,
                    verified_claims_summary=str(validated_claims)
                ))
            ],
            context_desc="CountermeasureAnalysis"
        )
        report_data.update(countermeasure_response.model_dump() if countermeasure_response else {"recommended_steps": "Analysis failed."})

        # --- STEP 3: Hoax Improvement Analysis ---
        logger.info("Step 3: Generating hoax improvements...")
        improvement_response = await call_llm_with_structured_output(
            llm=llm,
            output_class=ImprovementAnalysis,
            messages=[
                ("system", HOAX_IMPROVEMENT_SYSTEM_PROMPT.format(
                    current_time=current_time,
                    countermeasure_analysis_output=str(report_data['recommended_steps'])
                )),
                ("human", HOAX_IMPROVEMENT_HUMAN_PROMPT.format(
                    report_data=raw_text,
                    verified_claims_summary=str(validated_claims)
                ))
            ],
            context_desc="ImprovementAnalysis"
        )
        report_data.update(improvement_response.model_dump() if improvement_response else {"funny_improvements_in_misinformation": "Analysis failed."})
        
        # --- STEP 4: Derive 'should_report' Logically ---
        # This step doesn't require an LLM call. We derive it from the severity text.
        logger.info("Step 4: Deriving 'should_report' flag...")
        severity_text = report_data.get("severity_of_misinformation", "")
        score_match = re.search(r'(\d+)/10', severity_text)
        should_report = int(score_match.group(1)) >= 6 if score_match else False
        
        # --- Final Assembly ---
        logger.info("Sequential report generated successfully")
        return {
            "education_report": EducationalToolReport(
            answer=raw_text,
            pattern_of_misinformation=report_data.get("pattern_of_misinformation"),
            potential_of_spread=report_data.get("potential_of_spread"),
            severity_of_misinformation=report_data.get("severity_of_misinformation"),
            recommended_steps=report_data.get("recommended_steps"),
            should_report=should_report,
            funny_improvements_in_misinformation=report_data.get("funny_improvements_in_misinformation")
        )
        }

    except Exception as e:
        logger.error(f"Sequential report generation failed: {e}")
        # Return a partial or empty report structure on failure
        return {
            "education_report": None
        }

# i can implment truncate evidence for token limit 
# Prioritize Newest (Fill from the End): If your validated_claims are ordered chronologically, you might want to include the most recent ones. You can achieve this by simply changing your loop to for claim in reversed(validated_claims): and then reversing the final selected_claims list to restore chronological order.

# Prioritize by Relevance: If your claims have a relevance score (e.g., from a vector search), sort them by that score first, and then add the most relevant ones until you run out of space.

# The "Summarization Sandwich": For long documents, a great technique is to keep the beginning and the end, as they often contain the most important information (introduction and conclusion). You would take the first N claims and the last M claims that fit within the context window.