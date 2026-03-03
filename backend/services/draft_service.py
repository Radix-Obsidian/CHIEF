"""Draft CRUD service — Supabase persistence for generated drafts.

Used by the Operator node and the API layer for draft management.
"""

import logging
from datetime import datetime, timezone

from core.supabase_client import get_supabase

log = logging.getLogger("chief.drafts")


async def create_draft(
    user_id: str,
    email_id: str,
    thread_id: str,
    subject: str,
    body: str,
    tone: str = "professional",
    confidence: float | None = None,
) -> dict:
    """Create a new draft in Supabase."""
    supabase = get_supabase()

    result = supabase.table("drafts").insert({
        "user_id": user_id,
        "email_id": email_id,
        "thread_id": thread_id,
        "subject": subject,
        "body": body,
        "tone": tone,
        "confidence": confidence,
        "status": "pending",
    }).execute()

    return result.data[0] if result.data else {}


async def approve_draft(draft_id: str, user_id: str) -> dict:
    """Mark a draft as approved."""
    supabase = get_supabase()

    result = supabase.table("drafts").update({
        "status": "approved",
        "approved_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", draft_id).eq("user_id", user_id).execute()

    return result.data[0] if result.data else {}


async def reject_draft(draft_id: str, user_id: str) -> dict:
    """Mark a draft as rejected."""
    supabase = get_supabase()

    result = supabase.table("drafts").update({
        "status": "rejected",
    }).eq("id", draft_id).eq("user_id", user_id).execute()

    return result.data[0] if result.data else {}


async def mark_sent(draft_id: str, user_id: str) -> dict:
    """Mark a draft as sent."""
    supabase = get_supabase()

    result = supabase.table("drafts").update({
        "status": "sent",
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", draft_id).eq("user_id", user_id).execute()

    return result.data[0] if result.data else {}


async def list_pending(user_id: str) -> list[dict]:
    """List all pending drafts for a user."""
    supabase = get_supabase()

    result = supabase.table("drafts").select("*").eq(
        "user_id", user_id
    ).eq("status", "pending").order("created_at", desc=True).execute()

    return result.data
