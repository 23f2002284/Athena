"""Retrieve evidence node - fetches evidence for claims using web search providers.

Supports Google Programmable Search via LangChain GoogleSearchAPIWrapper, Exa, and Tavily.
"""

import logging
from typing import Any, Dict, List

"""Note: we import Google wrapper lazily inside the method to avoid heavy imports
when claim verification is not being run, and to reduce pydantic compatibility
risks in environments where versions differ.
"""

from Claim_Verification.Config.nodes import EVIDENCE_RETRIEVAL_CONFIG
from Claim_Verification.schemas import ClaimVerifierState, Evidence
from utils.settings import settings
import json
from pathlib import Path

logger = logging.getLogger(__name__)

# Retrieval settings
RESULTS_PER_QUERY = EVIDENCE_RETRIEVAL_CONFIG["results_per_query"]
SEARCH_PROVIDER = EVIDENCE_RETRIEVAL_CONFIG["search_provider"]


class SearchProviders:
    @staticmethod
    def _load_reliable_sources() -> Dict[str, List[str]]:
        try:
            path = Path("reliable_sources.json")
            if not path.exists():
                return {}
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return {}

    @staticmethod
    def _build_biased_query(query: str) -> str:
        reliable = SearchProviders._load_reliable_sources()
        if not reliable:
            return query
        domains: List[str] = []
        for group in reliable.values():
            for d in group:
                if d not in domains:
                    domains.append(d)
        # Limit the size to avoid overly long queries
        domains = domains[:10]
        sites_clause = " OR ".join([f"site:{d}" for d in domains])
        if not sites_clause:
            return query
        # Soft bias: keep original query OR a clause limited to reliable sites
        return f"{query} OR ({sites_clause})"
    """@staticmethod
    async def exa(query: str) -> List[Evidence]:
        logger.info(f"Searching with Exa: '{query}'")

        try:
            retriever = ExaSearchRetriever(
                k=RESULTS_PER_QUERY,
                text_contents_options={"max_characters": 2000},
                type="neural",
            )

            results = await retriever.ainvoke(query)

            evidence = [
                Evidence(
                    url=doc.metadata.get("url", ""),
                    text=doc.page_content[:2000],
                    title=doc.metadata.get("title"),
                )
                for doc in results
            ]

            return evidence

        except Exception as e:
            logger.error(f"Exa search failed for '{query}': {e}")
            return []

    @staticmethod
    async def tavily(query: str) -> List[Evidence]:
        logger.info(f"Searching with Tavily: '{query}'")

        try:
            search = TavilySearch(
                max_results=RESULTS_PER_QUERY,
                topic="general",
                include_raw_content="markdown",
            )

            results = await search.ainvoke(query)
            evidence = SearchProviders._parse_tavily_results(results)

            return evidence

        except Exception as e:
            logger.error(f"Tavily search failed for '{query}': {e}")
            return []

    @staticmethod
    def _parse_tavily_results(results: Any) -> List[Evidence]:
        match results:
            case {"results": search_results} if isinstance(search_results, list):
                return [
                    Evidence(
                        url=result.get("url", ""),
                        text=result.get("raw_content") or result.get("content", ""),
                        title=result.get("title", ""),
                    )
                    for result in search_results
                    if isinstance(result, dict)
                ]
            case str():
                return [Evidence(url="", text=results, title="Tavily Search Result")]
            case _:
                return []"""

    @staticmethod
    async def google(query: str) -> List[Evidence]:
        try:
            from langchain_google_community.search import GoogleSearchAPIWrapper
            api_key = settings.google_search_api_key if settings.google_search_api_key else None
            cse_id = settings.google_cse_id
            wrapper = GoogleSearchAPIWrapper(
                google_api_key=api_key,
                google_cse_id=cse_id,
                k=RESULTS_PER_QUERY,
            )
            # Wrapper.run returns a string, results returns list of dicts
            biased_query = SearchProviders._build_biased_query(query)
            raw_results = wrapper.results(query=biased_query, num_results=RESULTS_PER_QUERY)
            evidence: List[Evidence] = []
            for r in raw_results:
                url = r.get("link", "")
                title = r.get("title")
                snippet = r.get("snippet") or ""
                evidence.append(Evidence(url=url, title=title, text=snippet))
            return evidence
        except Exception as e:
            logger.error(f"Google search failed for '{query}': {e}")
            return []


async def _search_query(query: str) -> List[Evidence]:
    match SEARCH_PROVIDER.lower():
        case "google":
            return await SearchProviders.google(query)
        case "tavily":
            return await SearchProviders.tavily(query)
        case _:
            return await SearchProviders.exa(query)


async def retrieve_evidence_node(
    state: ClaimVerifierState,
) -> Dict[str, List[Evidence]]:
    if not state.query:
        logger.warning("No search query to process")
        return {"evidence": []}

    evidence = await _search_query(state.query)
    sources = ", ".join([item.url for item in evidence if item.url])
    logger.info(f"Retrieved {len(evidence)} evidence snippets. Sources: {sources}")

    return {"evidence": [item.model_dump() for item in evidence]}
