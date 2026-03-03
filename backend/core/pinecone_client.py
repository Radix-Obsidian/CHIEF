"""Pinecone client singleton.

Index: chief-emails (dimension 1536, text-embedding-3-small)
Namespace pattern: user_{uuid} for multi-tenant isolation.
"""

from functools import lru_cache
from pinecone import Pinecone
from core.config import PINECONE_API_KEY, PINECONE_INDEX


@lru_cache(maxsize=1)
def get_pinecone() -> Pinecone:
    """Get the Pinecone client instance."""
    if not PINECONE_API_KEY:
        raise RuntimeError("PINECONE_API_KEY is required")
    return Pinecone(api_key=PINECONE_API_KEY)


@lru_cache(maxsize=1)
def get_index():
    """Get the chief-emails Pinecone index."""
    pc = get_pinecone()
    return pc.Index(PINECONE_INDEX)


def user_namespace(user_id: str) -> str:
    """Generate the Pinecone namespace for a user."""
    return f"user_{user_id}"
