"""Email feed endpoints.

Endpoints:
  GET  /api/email/feed            → Paginated feed sorted by importance
  GET  /api/email/pending         → Drafts awaiting human approval (interrupted graphs)
  GET  /api/email/{id}            → Single email detail
  GET  /api/email/{id}/stream     → SSE stream of pipeline progress for an email
"""

import json
import logging

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import StreamingResponse

from api.models import EmailSummary, EmailFeedResponse, PendingDraft
from core.auth import get_current_user_id
from core.cors import add_cors
from core.supabase_client import get_supabase

log = logging.getLogger("chief.api.email")

app = FastAPI(title="CHIEF Email")
add_cors(app)


@app.get("/api/email/feed")
async def email_feed(
    user_id: str = Depends(get_current_user_id),
    page: int = 1,
    per_page: int = 20,
):
    """Paginated email feed sorted by importance (highest first)."""
    page = max(1, min(page, 1000))
    per_page = max(1, min(per_page, 100))
    supabase = get_supabase()

    offset = (page - 1) * per_page

    # Get total count
    count_result = supabase.table("emails").select(
        "id", count="exact"
    ).eq("user_id", user_id).execute()
    total = count_result.count or 0

    # Get page of emails
    result = supabase.table("emails").select("*").eq(
        "user_id", user_id
    ).order(
        "importance_score", desc=True
    ).range(offset, offset + per_page - 1).execute()

    emails = [
        EmailSummary(
            id=row["id"],
            gmail_id=row["gmail_id"],
            thread_id=row.get("thread_id", ""),
            from_address=row["from_address"],
            subject=row.get("subject", ""),
            body_preview=row.get("body_preview", ""),
            importance_score=row.get("importance_score", 5),
            importance_reason=row.get("importance_reason"),
            has_draft=row.get("has_draft", False),
            received_at=row["received_at"],
        )
        for row in result.data
    ]

    return EmailFeedResponse(
        emails=emails,
        total=total,
        page=page,
        per_page=per_page,
    )


@app.get("/api/email/pending")
async def get_pending_drafts(user_id: str = Depends(get_current_user_id)):
    """Fetch all threads with paused graphs (drafts awaiting human swipe).

    Checks LangGraph checkpoint states first, then falls back to direct
    DB query for pending drafts (supports seeded/demo data).
    """
    supabase = get_supabase()
    pending: list[dict] = []

    # ── Try LangGraph checkpoints first ──
    try:
        from agents.graph import get_chief_graph

        graph = get_chief_graph()

        threads = supabase.table("emails").select(
            "thread_id, id, from_address, subject, body_preview, importance_score"
        ).eq("user_id", user_id).eq("has_draft", True).execute()

        for row in threads.data:
            thread_id = row.get("thread_id")
            if not thread_id:
                continue

            config = {"configurable": {"thread_id": thread_id}}
            state = graph.get_state(config)

            if state and state.tasks and any(t.interrupts for t in state.tasks):
                pending.append({
                    "thread_id": thread_id,
                    "email_id": row["id"],
                    "draft_subject": state.values.get("draft_subject", ""),
                    "draft_body": state.values.get("draft_body", ""),
                    "importance_score": state.values.get("importance_score", row.get("importance_score", 5)),
                    "confidence": state.values.get("confidence"),
                    "original_email": {
                        "from": row["from_address"],
                        "subject": row.get("subject", ""),
                        "preview": row.get("body_preview", ""),
                    },
                })

    except Exception as e:
        log.warning("LangGraph unavailable, using DB fallback: %s", e)

    # ── DB fallback: pending drafts without graph checkpoints ──
    if not pending:
        try:
            fallback = supabase.table("drafts").select(
                "thread_id, email_id, subject, body, confidence, "
                "emails(from_address, subject, body_preview, importance_score)"
            ).eq("user_id", user_id).eq("status", "pending").execute()

            for row in fallback.data:
                email = row.get("emails", {}) or {}
                pending.append({
                    "thread_id": row["thread_id"],
                    "email_id": row["email_id"],
                    "draft_subject": row["subject"],
                    "draft_body": row["body"],
                    "importance_score": email.get("importance_score", 5),
                    "confidence": row.get("confidence"),
                    "original_email": {
                        "from": email.get("from_address", ""),
                        "subject": email.get("subject", ""),
                        "preview": email.get("body_preview", ""),
                    },
                })
        except Exception as e:
            log.error("DB fallback for pending drafts failed: %s", e)

    return pending


@app.get("/api/email/{email_id}")
async def get_email(email_id: str, user_id: str = Depends(get_current_user_id)):
    """Get a single email with full sanitized body."""
    supabase = get_supabase()

    result = supabase.table("emails").select("*").eq(
        "id", email_id
    ).eq("user_id", user_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Email not found")

    return result.data


@app.get("/api/email/{email_id}/stream")
async def stream_pipeline(email_id: str, user_id: str = Depends(get_current_user_id)):
    """SSE stream of pipeline progress for a specific email.

    Invokes the LangGraph pipeline and streams custom events from each
    node's get_stream_writer() calls.  The stream ends when the pipeline
    pauses (interrupt) or completes.

    Frontend connects via EventSource and receives events like:
      data: {"node":"gatekeeper","status":"sanitizing_pii"}
      data: {"node":"scribe","status":"generating_draft"}
      data: {"node":"scribe","status":"waiting_approval","confidence":0.82}
    """
    supabase = get_supabase()

    email_row = supabase.table("emails").select("*").eq(
        "id", email_id
    ).eq("user_id", user_id).single().execute()

    if not email_row.data:
        raise HTTPException(status_code=404, detail="Email not found")

    email_data = email_row.data

    async def event_stream():
        from agents.graph import get_chief_graph

        graph = get_chief_graph()
        thread_id = email_data.get("thread_id", email_id)
        config = {"configurable": {"thread_id": thread_id}}

        try:
            async for chunk in graph.astream(
                {
                    "email_id": email_id,
                    "user_id": user_id,
                    "raw_email": {
                        "from": email_data["from_address"],
                        "to": email_data.get("to_addresses", []),
                        "subject": email_data.get("subject", ""),
                        "body": email_data.get("body_sanitized", ""),
                        "thread_id": email_data.get("thread_id", ""),
                        "received_at": email_data.get("received_at", ""),
                    },
                },
                config=config,
                stream_mode=["custom", "updates"],
            ):
                # custom events are tuples ("custom", payload)
                # updates are tuples ("updates", {node_name: state_delta})
                if isinstance(chunk, tuple) and len(chunk) == 2:
                    mode, payload = chunk
                    if mode == "custom":
                        yield f"data: {json.dumps(payload)}\n\n"
                    elif mode == "updates":
                        # Emit a lightweight node-completed event
                        for node_name in payload:
                            yield f"data: {json.dumps({'node': node_name, 'status': 'node_complete'})}\n\n"

            yield f"data: {json.dumps({'status': 'stream_end'})}\n\n"

        except Exception as e:
            log.error("SSE stream error for email %s: %s", email_id, e)
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
