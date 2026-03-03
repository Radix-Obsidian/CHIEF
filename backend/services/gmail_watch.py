"""Gmail watch lifecycle management.

Manages Pub/Sub push notifications for real-time inbox monitoring.
Watch subscriptions expire after 7 days and must be renewed.
"""

import logging
from datetime import datetime, timedelta, timezone

from core.config import GMAIL_PUBSUB_TOPIC
from core.gmail_client import _build_service
from core.supabase_client import get_supabase

log = logging.getLogger("chief.gmail_watch")


async def start_watch(user_id: str, access_token: str, refresh_token: str | None = None) -> dict:
    """Start watching user's inbox via Gmail Pub/Sub.

    Args:
        user_id: Supabase user UUID
        access_token: Gmail OAuth access token
        refresh_token: Gmail OAuth refresh token

    Returns:
        Watch response with historyId and expiration.
    """
    service = _build_service(access_token, refresh_token)

    request_body = {
        "topicName": GMAIL_PUBSUB_TOPIC,
        "labelIds": ["INBOX"],
        "labelFilterBehavior": "INCLUDE",
    }

    result = service.users().watch(userId="me", body=request_body).execute()

    # Store watch metadata
    supabase = get_supabase()
    expiration_ms = int(result.get("expiration", 0))
    expiry = datetime.fromtimestamp(expiration_ms / 1000, tz=timezone.utc) if expiration_ms else None

    supabase.table("gmail_tokens").update({
        "watch_expiry": expiry.isoformat() if expiry else None,
        "history_id": result.get("historyId", ""),
    }).eq("user_id", user_id).execute()

    log.info("Watch started for user %s, expiry: %s, historyId: %s",
             user_id, expiry, result.get("historyId"))

    return {
        "historyId": result.get("historyId"),
        "expiration": expiry,
    }


async def stop_watch(user_id: str, access_token: str, refresh_token: str | None = None) -> None:
    """Stop watching user's inbox."""
    service = _build_service(access_token, refresh_token)
    service.users().stop(userId="me").execute()

    supabase = get_supabase()
    supabase.table("gmail_tokens").update({
        "watch_expiry": None,
    }).eq("user_id", user_id).execute()

    log.info("Watch stopped for user %s", user_id)


async def renew_watch(user_id: str, access_token: str, refresh_token: str | None = None) -> dict:
    """Renew the watch subscription (call before 7-day expiry)."""
    return await start_watch(user_id, access_token, refresh_token)


async def get_watch_status(user_id: str) -> dict:
    """Check the current watch status for a user."""
    supabase = get_supabase()
    result = supabase.table("gmail_tokens").select(
        "watch_expiry, history_id"
    ).eq("user_id", user_id).single().execute()

    if not result.data:
        return {"active": False}

    watch_expiry = result.data.get("watch_expiry")
    if not watch_expiry:
        return {"active": False}

    expiry = datetime.fromisoformat(watch_expiry)
    is_active = expiry > datetime.now(timezone.utc)

    return {
        "active": is_active,
        "expiry": watch_expiry,
        "history_id": result.data.get("history_id"),
        "needs_renewal": is_active and expiry < datetime.now(timezone.utc) + timedelta(hours=12),
    }
