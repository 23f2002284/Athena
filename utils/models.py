"""Unified LLM model instances and factory functions.

Provides access to configured language model instances for all modules.
"""

from langchain_core.language_models.chat_models import BaseChatModel

from utils.settings import settings
import os


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

    # Prefer Gemini if available
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI  # lazy import
        if settings.gemini_api_key:
            return ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                temperature=temperature,
                api_key=settings.gemini_api_key,
            )
    except Exception:
        pass

    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    has_vertex_env = bool(settings.gcp_project and settings.gcp_location and credentials_path and os.path.isfile(credentials_path))
    if has_vertex_env:
        try:
            from langchain_google_vertexai import ChatVertexAI  # lazy import
            return ChatVertexAI(
                model_name=model_name,
                temperature=temperature,
                project=settings.gcp_project,
                location=settings.gcp_location,
            )
        except Exception:
            pass

    # If neither available, raise clear error
    raise ValueError(
        "No LLM configured. Set GCP_PROJECT/GCP_LOCATION for Vertex AI or GOOGLE_API_KEY for Gemini."
    )


def get_default_llm() -> BaseChatModel:
    """Get default LLM instance."""
    return get_llm()