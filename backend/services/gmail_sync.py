"""Gmail sync service.

Provides two sync modes:
  - full_sync: Fetch last N emails on first connect (onboarding)
  - incremental_sync: Fetch only new messages since last historyId (Pub/Sub webhook)

Both modes sanitize PII before storing in Supabase.
"""

import logging
from datetime import datetime, timezone

from core.gmail_client import get_messages, get_message_detail, get_history
from core.supabase_client import get_supabase
from services.pii_sanitizer import sanitize

log = logging.getLogger("chief.gmail_sync")


async def full_sync(
    user_id: str,
    access_token: str,
    refresh_token: str | None = None,
    max_emails: int = 100,
) -> dict:
    """Fetch the last N emails from inbox on first connect.

    Args:
        user_id: Supabase user UUID
        access_token: Gmail OAuth access token
        refresh_token: Gmail OAuth refresh token
        max_emails: Maximum number of emails to fetch

    Returns:
        Summary with counts.
    """
    log.info("Starting full sync for user %s (max %d)", user_id, max_emails)

    messages = await get_messages(
        access_token, refresh_token, max_results=max_emails, label_ids=["INBOX"]
    )

    processed = 0
    skipped = 0
    latest_history_id = None

    supabase = get_supabase()

    for msg_ref in messages:
        try:
            detail = await get_message_detail(access_token, msg_ref["id"], refresh_token)
            stored = await _store_email(supabase, user_id, detail)
            if stored:
                processed += 1
            else:
                skipped += 1

            if detail.get("historyId"):
                latest_history_id = detail["historyId"]

        except Exception as e:
            log.warning("Failed to process message %s: %s", msg_ref["id"], e)
            skipped += 1

    # Update historyId for incremental sync
    if latest_history_id:
        supabase.table("gmail_tokens").update({
            "history_id": latest_history_id,
        }).eq("user_id", user_id).execute()

    log.info("Full sync complete: %d processed, %d skipped", processed, skipped)
    return {"processed": processed, "skipped": skipped}


async def incremental_sync(
    user_id: str,
    access_token: str,
    refresh_token: str | None = None,
) -> list[str]:
    """Fetch new messages since the last historyId.

    Called by the Pub/Sub webhook handler when Gmail pushes a notification.

    Args:
        user_id: Supabase user UUID
        access_token: Gmail OAuth access token
        refresh_token: Gmail OAuth refresh token

    Returns:
        List of newly stored email IDs (Supabase UUIDs).
    """
    supabase = get_supabase()

    # Get the last known historyId
    token_row = supabase.table("gmail_tokens").select(
        "history_id"
    ).eq("user_id", user_id).single().execute()

    history_id = token_row.data.get("history_id") if token_row.data else None
    if not history_id:
        log.warning("No historyId for user %s, falling back to full sync", user_id)
        result = await full_sync(user_id, access_token, refresh_token, max_emails=20)
        return []

    log.info("Incremental sync for user %s from historyId %s", user_id, history_id)

    history_result = await get_history(access_token, history_id, refresh_token)

    new_email_ids: list[str] = []
    new_message_ids: set[str] = set()

    for record in history_result.get("history", []):
        for msg_added in record.get("messagesAdded", []):
            msg = msg_added.get("message", {})
            msg_id = msg.get("id")
            if msg_id and "INBOX" in msg.get("labelIds", []):
                new_message_ids.add(msg_id)

    for msg_id in new_message_ids:
        try:
            detail = await get_message_detail(access_token, msg_id, refresh_token)
            stored = await _store_email(supabase, user_id, detail)
            if stored:
                new_email_ids.append(stored)
        except Exception as e:
            log.warning("Failed to process message %s: %s", msg_id, e)

    # Update historyId
    new_history_id = history_result.get("historyId", history_id)
    supabase.table("gmail_tokens").update({
        "history_id": new_history_id,
    }).eq("user_id", user_id).execute()

    log.info("Incremental sync: %d new emails", len(new_email_ids))
    return new_email_ids


async def _store_email(supabase, user_id: str, detail: dict) -> str | None:
    """Sanitize and store an email in Supabase.

    Returns the email UUID if stored, None if skipped (duplicate).
    """
    gmail_id = detail["id"]

    # Check for duplicate
    existing = supabase.table("emails").select("id").eq(
        "user_id", user_id
    ).eq("gmail_id", gmail_id).execute()

    if existing.data:
        return None

    # Sanitize body
    body_result = sanitize(detail.get("body", ""))

    # Generate preview (first 200 chars of sanitized body)
    preview = body_result.clean_text[:200] if body_result.clean_text else ""

    # Parse received_at
    received_at = detail.get("received_at", "")
    try:
        from email.utils import parsedate_to_datetime
        received_dt = parsedate_to_datetime(received_at).isoformat()
    except Exception:
        received_dt = datetime.now(timezone.utc).isoformat()

    # Parse to addresses
    to_raw = detail.get("to", "")
    to_addresses = [addr.strip() for addr in to_raw.split(",") if addr.strip()]

    result = supabase.table("emails").insert({
        "user_id": user_id,
        "gmail_id": gmail_id,
        "thread_id": detail.get("threadId", ""),
        "from_address": detail.get("from", ""),
        "to_addresses": to_addresses,
        "subject": detail.get("subject", ""),
        "body_sanitized": body_result.clean_text,
        "body_preview": preview,
        "labels": detail.get("labels", []),
        "received_at": received_dt,
    }).execute()

    return result.data[0]["id"] if result.data else None
