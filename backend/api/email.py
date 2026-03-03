"""Email feed endpoints.

Endpoints:
  GET /api/email/feed     → Paginated feed sorted by importance
  GET /api/email/pending  → Drafts awaiting human approval (interrupted graphs)
  GET /api/email/{id}     → Single email detail
"""

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.models import EmailSummary, EmailFeedResponse, PendingDraft
from core.supabase_client import get_supabase

log = logging.getLogger("chief.api.email")

app = FastAPI(title="CHIEF Email")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/email/feed")
async def email_feed(
    user_id: str,
    page: int = 1,
    per_page: int = 20,
):
    """Paginated email feed sorted by importance (highest first)."""
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
async def get_pending_drafts(user_id: str):
    """Fetch all threads with paused graphs (drafts awaiting human swipe).

    Checks LangGraph checkpoint states for interrupted threads.
    """
    try:
        from agents.graph import get_chief_graph

        graph = get_chief_graph()
        supabase = get_supabase()

        # Get threads that have drafts
        threads = supabase.table("emails").select(
            "thread_id, id, from_address, subject, body_preview, importance_score"
        ).eq("user_id", user_id).eq("has_draft", True).execute()

        pending: list[dict] = []
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

        return pending

    except Exception as e:
        log.error("Error fetching pending drafts: %s", e)
        return []


@app.get("/api/email/{email_id}")
async def get_email(email_id: str, user_id: str):
    """Get a single email with full sanitized body."""
    supabase = get_supabase()

    result = supabase.table("emails").select("*").eq(
        "id", email_id
    ).eq("user_id", user_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Email not found")

    return result.data
