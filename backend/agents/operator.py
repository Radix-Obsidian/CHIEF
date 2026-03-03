"""Operator node — Execute human decision (send/archive).

Fourth and final node. Runs ONLY after human resumes the graph
via Command(resume={approved, user_edits}).

Responsibilities:
1. Read human decision from resumed state
2. If approved: send email via Gmail API
3. If rejected: archive email via Gmail labels
4. Store draft record in Supabase
5. Send push notification confirming action
"""

import logging
from datetime import datetime, timezone

from agents.state import EmailState
from core.gmail_client import send_email, modify_labels
from core.supabase_client import get_supabase

log = logging.getLogger("chief.operator")


async def operator_node(state: EmailState) -> dict:
    """Execute the human decision — send or archive."""
    user_id = state["user_id"]
    email_id = state["email_id"]
    raw = state["raw_email"]

    # Get human decision from resume data
    approved = state.get("approved")
    user_edits = state.get("user_edits")

    log.info("Operator executing for email %s: approved=%s, has_edits=%s",
             email_id, approved, bool(user_edits))

    supabase = get_supabase()

    # Get user's Gmail tokens
    tokens = await _get_tokens(supabase, user_id)

    if approved:
        # Determine which body to send
        final_body = user_edits if user_edits else state.get("draft_body", "")
        final_subject = state.get("draft_subject", f"Re: {raw.get('subject', '')}")

        action = "edited_and_sent" if user_edits else "sent"

        # Send via Gmail
        if tokens:
            try:
                await send_email(
                    access_token=tokens["access_token"],
                    to=raw.get("from", ""),
                    subject=final_subject,
                    body=final_body,
                    thread_id=raw.get("thread_id"),
                    refresh_token=tokens.get("refresh_token"),
                )
                log.info("Email sent for thread %s", raw.get("thread_id"))
            except Exception as e:
                log.error("Failed to send email: %s", e)
                action = "send_failed"
        else:
            log.error("No tokens available, cannot send")
            action = "send_failed"

        # Store draft record
        draft_result = supabase.table("drafts").insert({
            "user_id": user_id,
            "email_id": email_id,
            "thread_id": raw.get("thread_id", ""),
            "subject": final_subject,
            "body": final_body,
            "tone": state.get("suggested_tone", "professional"),
            "confidence": state.get("confidence"),
            "status": action,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "sent_at": datetime.now(timezone.utc).isoformat() if "sent" in action else None,
        }).execute()

        draft_id = draft_result.data[0]["id"] if draft_result.data else None

    else:
        # Rejected — archive the email
        action = "archived"

        if tokens:
            try:
                # Get gmail_id from the email record
                email_row = supabase.table("emails").select("gmail_id").eq("id", email_id).single().execute()
                if email_row.data:
                    await modify_labels(
                        access_token=tokens["access_token"],
                        message_id=email_row.data["gmail_id"],
                        remove_labels=["INBOX"],
                        refresh_token=tokens.get("refresh_token"),
                    )
            except Exception as e:
                log.warning("Failed to archive email: %s", e)

        # Store rejection record
        draft_result = supabase.table("drafts").insert({
            "user_id": user_id,
            "email_id": email_id,
            "thread_id": raw.get("thread_id", ""),
            "subject": state.get("draft_subject", ""),
            "body": state.get("draft_body", ""),
            "status": "rejected",
            "confidence": state.get("confidence"),
        }).execute()

        draft_id = draft_result.data[0]["id"] if draft_result.data else None

    # Update email record
    supabase.table("emails").update({
        "has_draft": False,
    }).eq("id", email_id).execute()

    log.info("Operator complete: action=%s, draft_id=%s", action, draft_id)

    return {
        "draft_id": draft_id,
        "action_taken": action,
        "notification_sent": False,  # TODO: push notification in Week 4
    }


async def _get_tokens(supabase, user_id: str) -> dict | None:
    """Get user's Gmail tokens from Vault."""
    try:
        access_name = f"gmail_access_{user_id}"
        refresh_name = f"gmail_refresh_{user_id}"

        access_result = supabase.rpc("vault_read_secret", {"secret_name": access_name}).execute()
        refresh_result = supabase.rpc("vault_read_secret", {"secret_name": refresh_name}).execute()

        if not access_result.data:
            return None

        return {
            "access_token": access_result.data,
            "refresh_token": refresh_result.data if refresh_result.data else None,
        }
    except Exception as e:
        log.error("Failed to read tokens: %s", e)
        return None
