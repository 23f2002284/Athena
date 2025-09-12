"""Unified LLM model instances and factory functions.

Provides access to configured language model instances for all modules.
"""

from langchain_core.language_models.chat_models import BaseChatModel

import os
from dotenv import load_dotenv

# Load environment files BEFORE importing settings
load_dotenv('config.env')
load_dotenv('.env')

# Import direct environment loader
try:
    import load_env  # This will auto-load config.env into os.environ
except ImportError:
    pass

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

    # Prefer Gemini if available
    try:
        # Check both settings and environment directly
        api_key = settings.gemini_api_key or os.getenv('GOOGLE_API_KEY')
        
        print(f"DEBUG: Checking GOOGLE_API_KEY - settings: {bool(settings.gemini_api_key)}, env: {bool(os.getenv('GOOGLE_API_KEY'))}")
        
        if api_key:
            print(f"DEBUG: Creating Gemini LLM with API key (length: {len(api_key)})")            
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",  # Use stable model
                temperature=temperature,
                google_api_key=api_key, 
            )
        else:
            print("DEBUG: No GOOGLE_API_KEY found")
    except Exception as e:
        print(f"DEBUG: Gemini initialization failed: {e}")
        pass

    # Try Vertex AI if GCP credentials are available
    gcp_project = settings.gcp_project or os.getenv('GCP_PROJECT')
    gcp_location = settings.gcp_location or os.getenv('GCP_LOCATION') or 'us-central1'
    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    
    has_vertex_env = bool(gcp_project and credentials_path and os.path.isfile(credentials_path))
    if has_vertex_env:
        try:
            from langchain_google_vertexai import ChatVertexAI  # lazy import
            return ChatVertexAI(
                model_name=model_name,
                temperature=temperature,
                project=gcp_project,
                location=gcp_location,
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