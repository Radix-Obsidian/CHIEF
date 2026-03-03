"""Gmail Pub/Sub webhook handler.

Receives push notifications from Google Cloud Pub/Sub when new emails
arrive in a user's inbox. Triggers incremental sync → LangGraph pipeline.
"""

import base64
import json
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from api.models import PubSubPushRequest
from core.supabase_client import get_supabase
from services.gmail_sync import incremental_sync

log = logging.getLogger("chief.webhooks")

app = FastAPI(title="CHIEF Webhooks")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/webhooks/gmail")
async def gmail_webhook(request: Request):
    """Handle Gmail Pub/Sub push notification.

    Google sends:
    {
      "message": {
        "data": "<base64 encoded JSON>",
        "messageId": "...",
        "publishTime": "..."
      },
      "subscription": "projects/.../subscriptions/..."
    }

    Decoded data:
    {
      "emailAddress": "user@gmail.com",
      "historyId": "12345"
    }
    """
    try:
        body = await request.json()
        push_req = PubSubPushRequest(**body)
    except Exception as e:
        log.error("Invalid webhook payload: %s", e)
        raise HTTPException(status_code=400, detail="Invalid payload")

    # Decode Pub/Sub message data
    try:
        decoded = base64.urlsafe_b64decode(push_req.message.data).decode("utf-8")
        data = json.loads(decoded)
    except Exception as e:
        log.error("Failed to decode Pub/Sub message: %s", e)
        raise HTTPException(status_code=400, detail="Invalid message data")

    email_address = data.get("emailAddress", "")
    history_id = data.get("historyId", "")

    if not email_address:
        log.warning("Webhook missing emailAddress")
        return {"status": "ignored", "reason": "no email address"}

    log.info("Gmail webhook for %s, historyId: %s", email_address, history_id)

    # Look up user by email
    supabase = get_supabase()
    user_result = supabase.table("users").select("id").eq("email", email_address).single().execute()

    if not user_result.data:
        log.warning("No user found for email: %s", email_address)
        return {"status": "ignored", "reason": "unknown user"}

    user_id = user_result.data["id"]

    # Get user's tokens from Vault
    tokens = await _get_user_tokens(supabase, user_id)
    if not tokens:
        log.error("No tokens for user %s", user_id)
        return {"status": "error", "reason": "no tokens"}

    # Run incremental sync
    new_email_ids = await incremental_sync(
        user_id=user_id,
        access_token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
    )

    # Trigger LangGraph pipeline for each new email
    if new_email_ids:
        await _process_new_emails(user_id, new_email_ids)

    return {"status": "ok", "new_emails": len(new_email_ids)}


@app.post("/api/webhooks/gmail/test")
async def gmail_webhook_test(user_id: str, email_id: str | None = None):
    """Manual trigger for testing the webhook pipeline."""
    log.info("Manual webhook test for user %s", user_id)

    supabase = get_supabase()
    tokens = await _get_user_tokens(supabase, user_id)
    if not tokens:
        raise HTTPException(status_code=400, detail="No tokens for user")

    new_email_ids = await incremental_sync(
        user_id=user_id,
        access_token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
    )

    if new_email_ids:
        await _process_new_emails(user_id, new_email_ids)

    return {"status": "ok", "new_emails": len(new_email_ids)}


async def _get_user_tokens(supabase, user_id: str) -> dict | None:
    """Retrieve user's Gmail tokens from Supabase Vault."""
    access_name = f"gmail_access_{user_id}"
    refresh_name = f"gmail_refresh_{user_id}"

    try:
        # Read from Vault decrypted view
        access_result = supabase.rpc("vault_read_secret", {"secret_name": access_name}).execute()
        refresh_result = supabase.rpc("vault_read_secret", {"secret_name": refresh_name}).execute()

        if not access_result.data:
            return None

        return {
            "access_token": access_result.data,
            "refresh_token": refresh_result.data if refresh_result.data else None,
        }
    except Exception as e:
        log.error("Failed to read tokens from Vault: %s", e)
        return None


async def _process_new_emails(user_id: str, email_ids: list[str]) -> None:
    """Trigger the LangGraph pipeline for new emails.

    This is the bridge between Gmail sync and the 4-node graph.
    Imported lazily to avoid circular deps and speed up webhook response.
    """
    try:
        from agents.graph import get_chief_graph
        from core.supabase_client import get_supabase

        graph = get_chief_graph()
        supabase = get_supabase()

        for email_id in email_ids:
            # Fetch the stored email
            email_row = supabase.table("emails").select("*").eq("id", email_id).single().execute()
            if not email_row.data:
                continue

            email_data = email_row.data

            # Get user settings for importance threshold
            user_row = supabase.table("users").select("settings, voice_profile").eq("id", user_id).single().execute()
            settings = user_row.data.get("settings", {}) if user_row.data else {}

            # Invoke graph with thread_id for checkpointing
            config = {"configurable": {"thread_id": email_data.get("thread_id", email_id)}}

            await graph.ainvoke({
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
            }, config=config)

            log.info("Graph invoked for email %s (user %s)", email_id, user_id)

    except Exception as e:
        log.error("Failed to process emails through graph: %s", e)
