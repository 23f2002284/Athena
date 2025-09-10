# Node settings
QUERY_GENERATION_CONFIG = {
    "temperature": 0.0,  # Zero temp for consistent results
}

EVIDENCE_RETRIEVAL_CONFIG = {
    "results_per_query": 3,  # Number of search results to fetch per query
    "search_provider": "google",  # Search provider: "google" (default), "exa", or "tavily"
}

EVIDENCE_EVALUATION_CONFIG = {
    "temperature": 0.0,  # Zero temp for consistent results
}

ITERATIVE_SEARCH_CONFIG = {
    "max_iterations": 5,
}