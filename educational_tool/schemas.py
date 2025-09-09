from datetime import datetime
from typing import Annotated, List, Optional, Any, Dict
from operator import add
from pydantic import BaseModel, Field
from enum import Enum

class VerificationResult(str, Enum):
    """Possible outcomes of a fact-checking verification."""

    SUPPORTED = "Supported"
    REFUTED = "Refuted"

from Claim_Verification.schemas import Verdict
from Claim_Handle.schemas import ValidatedClaim
from fact_checker.schemas import FactCheckReport

# class similar_claims_in_past(BaseModel):
#     claim: str = Field(description="The claim")
#     verdict: Verdict = Field(description="The verdict")
#     source: str = Field(description="The source of the claim")

# let's have this for v3 of athena

class DeceptionAnalysis(BaseModel):
    """Analysis of deceptive framing and structure in misinformation."""
    
    sentence_framing: str = Field(description="Analysis of how sentences were constructed to manipulate readers")
    strategic_placement: str = Field(description="Analysis of how claims were structured for maximum effect")
    overall_assessment: str = Field(description="Overall assessment of the deception techniques used")

class ThreatAnalysis(BaseModel):
    """Analysis of potential threats and severity of misinformation."""
    
    target_audience_impact: str = Field(description="Description of who the misinformation targets and potential consequences")
    severity_score: int = Field(description="Severity score from 1-10", ge=1, le=10)
    severity_rationale: str = Field(description="Justification for the severity score")

class CountermeasureAnalysis(BaseModel):
    """Analysis of countermeasures against misinformation."""
    
    critical_thinking_strategies: List[str] = Field(description="Strategies for critical evaluation of similar claims")
    verification_techniques: List[str] = Field(description="Techniques for verifying similar information")
    educational_resources: List[str] = Field(default_factory=list, description="Resources for further education on the topic")

class HoaxImprovement(BaseModel):
    """Satirical analysis of how the misinformation could have been more effective."""
    
    structural_improvements: List[str] = Field(description="How the structure could be improved for more effectiveness")
    credibility_enhancements: List[str] = Field(description="How credibility could be enhanced")
    emotional_manipulation_tactics: List[str] = Field(description="More effective emotional manipulation tactics")

class EducationalToolReport(BaseModel):
    """Complete educational report on misinformation."""
    
    answer: str = Field(description="The original text or statement that was analyzed for fact-checking")
    timestamp: datetime = Field(description="Timestamp when the report was generated")
    deception_analysis: DeceptionAnalysis = Field(description="Analysis of deceptive techniques")
    threat_analysis: ThreatAnalysis = Field(description="Analysis of potential threats")
    countermeasure_analysis: CountermeasureAnalysis = Field(description="Analysis of countermeasures")
    hoax_improvement: HoaxImprovement = Field(description="Satirical improvement suggestions")
    should_report: bool = Field(description="Recommendation on whether this should be reported to fact-checking authorities")

class State(BaseModel):
    """The state for the educational tool workflow."""

    raw_text: str = Field(default="", description="The text to extract claims from")
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
        default="", description="Timestamp of the report"
    )
    educational_report: Optional[EducationalToolReport] = Field(
        default=None, description="The final educational report"
    )
