"""Gatekeeper node — PII sanitization + importance scoring.

First node in the pipeline. Responsibilities:
1. Sanitize PII from raw email body
2. Score importance (1-10) using operational tier LLM
3. Enrich score with sender history from Pinecone
4. Store email in Supabase (regardless of draft decision)
5. Upsert email embedding to Pinecone
6. Set should_draft based on user's threshold setting
"""

import json
import logging

from langgraph.config import get_stream_writer

from agents.state import EmailState
from agents.prompts import IMPORTANCE_SCORING_PROMPT
from core.llm import get_llm
from core.supabase_client import get_supabase
from services.pii_sanitizer import sanitize
from services.rag_service import upsert_email, get_sender_context

log = logging.getLogger("chief.gatekeeper")


async def gatekeeper_node(state: EmailState, *, config) -> dict:
    """PII sanitize + importance score + Pinecone upsert."""
    writer = get_stream_writer(config)
    user_id = state["user_id"]
    email_id = state["email_id"]
    raw = state["raw_email"]

    log.info("Gatekeeper processing email %s for user %s", email_id, user_id)

    # 1. PII sanitization
    writer({"node": "gatekeeper", "status": "sanitizing_pii"})
    body_result = sanitize(raw.get("body", ""))

    # 2. Get sender context from Pinecone (past interactions)
    sender_ctx = await get_sender_context(
        user_id=user_id,
        sender_email=raw.get("from", ""),
    )
    sender_context_str = json.dumps(sender_ctx, indent=2) if sender_ctx else "No prior interactions found."

    # 3. Importance scoring via operational LLM
    writer({"node": "gatekeeper", "status": "scoring_importance"})
    llm = get_llm(tier="operational")
    prompt = IMPORTANCE_SCORING_PROMPT.format(
        sender_context=sender_context_str,
        from_address=raw.get("from", ""),
        subject=raw.get("subject", ""),
        body=body_result.clean_text[:2000],  # Limit body length
    )

    try:
        response = await llm.ainvoke(prompt)
        score_data = json.loads(response.content)
        importance_score = max(1, min(10, int(score_data.get("score", 5))))
        importance_reason = score_data.get("reason", "")
    except Exception as e:
        log.warning("Scoring failed, defaulting to 5: %s", e)
        importance_score = 5
        importance_reason = "Scoring unavailable"

    # 4. Update email in Supabase with score
    supabase = get_supabase()
    supabase.table("emails").update({
        "importance_score": importance_score,
        "importance_reason": importance_reason,
        "body_sanitized": body_result.clean_text,
        "body_preview": body_result.clean_text[:200],
    }).eq("id", email_id).execute()

    # 5. Upsert to Pinecone for future RAG queries
    await upsert_email(
        user_id=user_id,
        email_id=email_id,
        text=body_result.clean_text,
        metadata={
            "from": raw.get("from", ""),
            "subject": raw.get("subject", ""),
            "received_at": raw.get("received_at", ""),
            "importance_score": importance_score,
        },
    )

    # 6. Determine if we should generate a draft
    user_row = supabase.table("users").select("settings").eq("id", user_id).single().execute()
    settings = user_row.data.get("settings", {}) if user_row.data else {}
    threshold = settings.get("importance_threshold", 5)
    should_draft = importance_score >= threshold

    if should_draft:
        supabase.table("emails").update({"has_draft": True}).eq("id", email_id).execute()

    writer({
        "node": "gatekeeper",
        "status": "complete",
        "importance_score": importance_score,
        "should_draft": should_draft,
    })

    log.info("Email %s scored %d (threshold=%d, should_draft=%s)",
             email_id, importance_score, threshold, should_draft)

    return {
        "sanitized_body": body_result.clean_text,
        "pii_findings": body_result.pii_types_found,
        "importance_score": importance_score,
        "importance_reason": importance_reason,
        "should_draft": should_draft,
    }
