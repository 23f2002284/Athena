from datetime import datetime
from typing import Annotated, List, Optional, Any, Dict

from operator import add
from pydantic import BaseModel, Field

from Claim_Verification.schemas import Verdict
from Claim_Handle.schemas import ValidatedClaim
from fact_checker.schemas import FactCheckReport

# class similar_claims_in_past(BaseModel):
#     claim: str = Field(description="The claim")
#     verdict: Verdict = Field(description="The verdict")
#     source: str = Field(description="The source of the claim")

# let's have this for v3 of athena

class EducationalToolReport(BaseModel):
    answer: str = Field(description="The original text or statement that was analyzed for fact-checking")
    # verified_claims: list[dict] = Field(
    #     description="it is the verified claims with verdicts"
    # )
    # similar_claims_in_past: List[similar_claims_in_past] = Field(
    #     description="Historical instances of similar claims that have been fact-checked before"
    # )
    pattern_of_misinformation: str = Field(
        description="Analysis of common patterns or techniques used in the misinformation"
    )
    potential_of_spread: str = Field(
        description="Assessment of how likely this misinformation is to spread, including virality factors"
    )
    severity_of_misinformation: str = Field(
        description="Evaluation of the potential harm or impact of the misinformation"
    )
    recommended_steps: str = Field(
        description="Recommended fact-checking steps to verify information and avoid deception."
    )
    should_report: bool = Field(
        description="Recommendation on whether this should be reported to fact-checking authorities"
    )
    funny_improvements_in_misinformation: str = Field(
        description="Humorous or creative ways the misinformation could be made more effective (for educational purposes)"
    )

class State(BaseModel):
    """The state for the main fact checker workflow."""

    raw_text: str = Field(description="The text to extract claims from")
    extracted_claims: List[ValidatedClaim] = Field(
        default_factory=list, description="Claims extracted from the text"
    )
    verification_results: Annotated[List[Verdict], add] = Field(
        default_factory=list, description="Verification results for each claim"
    )
    final_report: Optional[FactCheckReport] = Field(
        default=None, description="The final fact-checking report"
    )
    validated_claims: List[dict] = Field(
        default_factory=list, description="Claims extracted from the text"
    )
    timestamp: str = Field(
        default_factory=list, description="Timestamp of the report"
    )
    education_report: Optional[EducationalToolReport] = Field(
        default=None, description="The final educational report"
    )
