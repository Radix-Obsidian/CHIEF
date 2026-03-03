"""RAG service — Pinecone vector search with user-namespace isolation.

Provides:
  - upsert_email: embed + store in user namespace
  - query_context: top-K retrieval for draft context
  - get_sender_context: past interactions with a specific sender
  - delete_user_data: GDPR compliance (delete entire namespace)
"""

import logging
from typing import Any

from langchain_openai import OpenAIEmbeddings

from core.config import OPENAI_API_KEY
from core.pinecone_client import get_index, user_namespace

log = logging.getLogger("chief.rag")

_embeddings = None


def _get_embeddings() -> OpenAIEmbeddings:
    """Get the shared embedding model (text-embedding-3-small)."""
    global _embeddings
    if _embeddings is None:
        _embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=OPENAI_API_KEY,
        )
    return _embeddings


async def upsert_email(
    user_id: str,
    email_id: str,
    text: str,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Embed and upsert an email to the user's Pinecone namespace.

    Args:
        user_id: Supabase user UUID
        email_id: Supabase email UUID (used as vector ID)
        text: Sanitized email body text
        metadata: Additional metadata (from, subject, received_at, etc.)
    """
    if not text.strip():
        return

    try:
        embeddings = _get_embeddings()
        vector = await embeddings.aembed_query(text[:8000])  # Limit input

        ns = user_namespace(user_id)
        index = get_index()

        meta = metadata or {}
        meta["text"] = text[:1000]  # Store truncated text for retrieval display
        meta["email_id"] = email_id

        index.upsert(
            vectors=[{"id": email_id, "values": vector, "metadata": meta}],
            namespace=ns,
        )

        log.info("Upserted email %s to namespace %s", email_id, ns)

    except Exception as e:
        log.error("Failed to upsert email %s: %s", email_id, e)


async def query_context(
    user_id: str,
    query_text: str,
    top_k: int = 5,
) -> list[dict]:
    """Query Pinecone for relevant past emails.

    Args:
        user_id: Supabase user UUID
        query_text: Text to find similar emails for
        top_k: Number of results to return

    Returns:
        List of dicts with {text, from, subject, received_at, score}.
    """
    if not query_text.strip():
        return []

    try:
        embeddings = _get_embeddings()
        vector = await embeddings.aembed_query(query_text[:8000])

        ns = user_namespace(user_id)
        index = get_index()

        results = index.query(
            vector=vector,
            top_k=top_k,
            namespace=ns,
            include_metadata=True,
        )

        context = []
        for match in results.get("matches", []):
            meta = match.get("metadata", {})
            context.append({
                "email_id": meta.get("email_id", ""),
                "text": meta.get("text", ""),
                "from": meta.get("from", ""),
                "subject": meta.get("subject", ""),
                "received_at": meta.get("received_at", ""),
                "importance_score": meta.get("importance_score", 5),
                "similarity_score": match.get("score", 0),
            })

        return context

    except Exception as e:
        log.error("Pinecone query failed: %s", e)
        return []


async def get_sender_context(
    user_id: str,
    sender_email: str,
    limit: int = 10,
) -> dict:
    """Get context about past interactions with a specific sender.

    Returns summary dict for the Gatekeeper's scoring enrichment.
    """
    try:
        ns = user_namespace(user_id)
        index = get_index()

        # Query Pinecone with metadata filter for sender
        # Use a generic query vector (we want ALL from this sender)
        embeddings = _get_embeddings()
        vector = await embeddings.aembed_query(f"emails from {sender_email}")

        results = index.query(
            vector=vector,
            top_k=limit,
            namespace=ns,
            include_metadata=True,
            filter={"from": {"$eq": sender_email}},
        )

        matches = results.get("matches", [])
        if not matches:
            return {"total_interactions": 0, "known_sender": False}

        topics = [m.get("metadata", {}).get("subject", "") for m in matches]
        last_date = max(
            (m.get("metadata", {}).get("received_at", "") for m in matches),
            default="",
        )

        return {
            "total_interactions": len(matches),
            "known_sender": True,
            "recent_topics": topics[:3],
            "last_interaction": last_date,
        }

    except Exception as e:
        log.error("Sender context query failed: %s", e)
        return {"total_interactions": 0, "known_sender": False}


async def delete_user_data(user_id: str) -> None:
    """Delete all vectors for a user (GDPR compliance)."""
    try:
        ns = user_namespace(user_id)
        index = get_index()
        index.delete(delete_all=True, namespace=ns)
        log.info("Deleted all vectors for namespace %s", ns)
    except Exception as e:
        log.error("Failed to delete user data: %s", e)
