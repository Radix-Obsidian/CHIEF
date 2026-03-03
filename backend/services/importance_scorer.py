"""Importance scoring service.

Uses operational tier LLM (Gemini Flash) for fast, cheap classification.
Enriches scoring with sender history from Pinecone RAG.

Scoring rubric:
  9-10: VIP sender, urgent action required
  7-8:  Important business, needs thoughtful response
  5-6:  Routine business, optional reply
  3-4:  Newsletters, automated, info-only
  1-2:  Marketing, spam, zero action
"""

import json
import logging

from agents.prompts import IMPORTANCE_SCORING_PROMPT
from core.llm import get_llm
from services.rag_service import get_sender_context

log = logging.getLogger("chief.scorer")


async def score(
    user_id: str,
    sanitized_body: str,
    from_address: str,
    subject: str,
) -> dict:
    """Score an email's importance from 1-10.

    Args:
        user_id: Supabase user UUID
        sanitized_body: PII-stripped email body
        from_address: Sender's email address
        subject: Email subject line

    Returns:
        {score: int, reason: str, suggested_action: str}
    """
    # Get sender context from Pinecone
    sender_ctx = await get_sender_context(user_id, from_address)
    sender_context_str = json.dumps(sender_ctx, indent=2) if sender_ctx else "No prior interactions."

    llm = get_llm(tier="operational")

    prompt = IMPORTANCE_SCORING_PROMPT.format(
        sender_context=sender_context_str,
        from_address=from_address,
        subject=subject,
        body=sanitized_body[:2000],
    )

    try:
        response = await llm.ainvoke(prompt)
        data = json.loads(response.content)

        return {
            "score": max(1, min(10, int(data.get("score", 5)))),
            "reason": data.get("reason", ""),
            "suggested_action": data.get("suggested_action", "reply"),
        }

    except Exception as e:
        log.warning("Scoring failed, defaulting to 5: %s", e)
        return {
            "score": 5,
            "reason": "Scoring unavailable",
            "suggested_action": "reply",
        }
