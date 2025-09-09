"""Unified LLM model instances and factory functions.

Provides access to configured language model instances for all modules.
"""

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_google_vertexai import ChatVertexAI

from utils.settings import settings


def get_llm(
    model_name: str = "gemini-2.0-flash",
    temperature: float = 0.0,
    completions: int = 1,
) -> BaseChatModel:
    """Get LLM with specified configuration.

    Args:
        model_name: The model to use
        temperature: Temperature for generation
        completions: How many completions we need (affects temperature for diversity)

    Returns:
        Configured LLM instance
    """
    # Use higher temp when doing multiple completions for diversity
    if completions > 1 and temperature == 0.0:
        temperature = 0.2

    if not settings.gcp_project or not settings.gcp_location:
        raise ValueError("GCP_PROJECT and GCP_LOCATION must be set in environment variables for Vertex AI")

    return ChatVertexAI(
        model_name=model_name,
        temperature=temperature,
        project=settings.gcp_project,
        location=settings.gcp_location,
    )


def get_default_llm() -> BaseChatModel:
    """Get default LLM instance."""
    return get_llm()