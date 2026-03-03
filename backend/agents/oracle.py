"""Oracle node — RAG context retrieval + sender analysis.

Second node in the pipeline. Responsibilities:
1. Query Pinecone for relevant past emails (top-5)
2. Build sender history (frequency, relationship, last topic)
3. Synthesize context into a briefing via LLM
4. Determine suggested tone for the draft
"""

import json
import logging

from agents.state import EmailState
from agents.prompts import CONTEXT_SYNTHESIS_PROMPT
from core.llm import get_llm
from services.rag_service import query_context

log = logging.getLogger("chief.oracle")


async def oracle_node(state: EmailState) -> dict:
    """RAG context retrieval + sender analysis."""
    user_id = state["user_id"]
    sanitized_body = state.get("sanitized_body", "")
    raw = state["raw_email"]

    log.info("Oracle retrieving context for email %s", state["email_id"])

    # 1. Query Pinecone for relevant past emails
    rag_results = await query_context(
        user_id=user_id,
        query_text=sanitized_body[:1000],
        top_k=5,
    )

    # Format RAG results for the LLM
    rag_formatted = []
    for i, result in enumerate(rag_results, 1):
        rag_formatted.append(
            f"[{i}] From: {result.get('from', 'unknown')} | "
            f"Subject: {result.get('subject', 'N/A')} | "
            f"Date: {result.get('received_at', 'N/A')}\n"
            f"    {result.get('text', '')[:300]}"
        )
    rag_str = "\n\n".join(rag_formatted) if rag_formatted else "No prior interactions found."

    # 2. Synthesize context via operational LLM
    llm = get_llm(tier="operational")
    prompt = CONTEXT_SYNTHESIS_PROMPT.format(
        rag_results=rag_str,
        from_address=raw.get("from", ""),
        subject=raw.get("subject", ""),
        body=sanitized_body[:2000],
    )

    try:
        response = await llm.ainvoke(prompt)
        context_data = json.loads(response.content)
        sender_history = context_data.get("sender_history", {})
        suggested_tone = context_data.get("suggested_tone", "professional")
    except Exception as e:
        log.warning("Context synthesis failed, using defaults: %s", e)
        sender_history = {
            "frequency": "unknown",
            "relationship": "unknown",
            "last_topic": "unknown",
            "total_interactions": len(rag_results),
        }
        suggested_tone = "professional"

    log.info("Oracle: %d context docs, tone=%s, relationship=%s",
             len(rag_results), suggested_tone, sender_history.get("relationship"))

    return {
        "rag_context": rag_results,
        "sender_history": sender_history,
        "suggested_tone": suggested_tone,
    }
