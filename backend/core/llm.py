"""Tiered LLM provider for CHIEF.

Two tiers:
  - deliverable: Claude Sonnet 4 (drafts, analysis) → OpenAI fallback
  - operational: Gemini Flash (scoring, classification) → OpenAI fallback
"""

import logging
from functools import lru_cache
from langchain_core.language_models import BaseChatModel
from core.config import ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY

log = logging.getLogger("chief.llm")

_TIER_CONFIG = {
    "deliverable": [
        {"provider": "anthropic", "model": "claude-sonnet-4-20250514", "key_var": ANTHROPIC_API_KEY},
        {"provider": "openai", "model": "gpt-4o", "key_var": OPENAI_API_KEY},
    ],
    "operational": [
        {"provider": "google", "model": "gemini-2.0-flash", "key_var": GOOGLE_API_KEY},
        {"provider": "openai", "model": "gpt-4o-mini", "key_var": OPENAI_API_KEY},
    ],
}


def _create_llm(provider: str, model: str, temperature: float = 0.3) -> BaseChatModel:
    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=model,
            api_key=ANTHROPIC_API_KEY,
            temperature=temperature,
            max_tokens=4096,
        )
    elif provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model,
            api_key=OPENAI_API_KEY,
            temperature=temperature,
            max_tokens=4096,
        )
    elif provider == "google":
        from langchain_openai import ChatOpenAI
        # Use OpenAI-compatible endpoint for Gemini via google-genai
        return ChatOpenAI(
            model=model,
            api_key=GOOGLE_API_KEY,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            temperature=temperature,
            max_tokens=4096,
        )
    raise ValueError(f"Unknown provider: {provider}")


@lru_cache(maxsize=4)
def get_llm(tier: str = "deliverable", temperature: float = 0.3) -> BaseChatModel:
    """Get an LLM instance for the given tier, with automatic fallback.

    Args:
        tier: "deliverable" (high quality) or "operational" (fast/cheap)
        temperature: LLM temperature (0.0-1.0)

    Returns:
        A LangChain chat model instance.
    """
    configs = _TIER_CONFIG.get(tier, _TIER_CONFIG["deliverable"])

    for cfg in configs:
        if not cfg["key_var"]:
            log.warning("Skipping %s/%s — no API key", cfg["provider"], cfg["model"])
            continue
        try:
            llm = _create_llm(cfg["provider"], cfg["model"], temperature)
            log.info("Using %s/%s for tier=%s", cfg["provider"], cfg["model"], tier)
            return llm
        except Exception as e:
            log.warning("Failed to init %s/%s: %s", cfg["provider"], cfg["model"], e)
            continue

    raise RuntimeError(f"No LLM available for tier={tier}. Check your API keys.")
