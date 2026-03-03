"""Gmail watch management endpoints.

Endpoints:
  POST /api/gmail/watch/start  → Start watching inbox
  POST /api/gmail/watch/stop   → Stop watching
  GET  /api/gmail/watch/status → Check watch status
  POST /api/gmail/sync         → Trigger manual full sync
"""

import logging

from fastapi import Depends, FastAPI, HTTPException

from api.models import WatchStatusResponse
from core.auth import get_current_user_id
from core.cors import add_cors
from services.gmail_watch import start_watch, stop_watch, get_watch_status
from services.gmail_sync import full_sync
from api.webhooks import _get_user_tokens
from core.supabase_client import get_supabase

log = logging.getLogger("chief.api.gmail")

app = FastAPI(title="CHIEF Gmail")
add_cors(app)


@app.post("/api/gmail/watch/start")
async def start_inbox_watch(user_id: str = Depends(get_current_user_id)):
    """Start Gmail Pub/Sub watch for the user's inbox."""
    supabase = get_supabase()
    tokens = await _get_user_tokens(supabase, user_id)
    if not tokens:
        raise HTTPException(status_code=400, detail="No tokens found. Complete OAuth first.")

    result = await start_watch(
        user_id=user_id,
        access_token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
    )
    return result


@app.post("/api/gmail/watch/stop")
async def stop_inbox_watch(user_id: str = Depends(get_current_user_id)):
    """Stop Gmail watch for the user."""
    supabase = get_supabase()
    tokens = await _get_user_tokens(supabase, user_id)
    if not tokens:
        raise HTTPException(status_code=400, detail="No tokens found")

    await stop_watch(
        user_id=user_id,
        access_token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
    )
    return {"status": "stopped"}


@app.get("/api/gmail/watch/status")
async def inbox_watch_status(user_id: str = Depends(get_current_user_id)):
    """Check the current watch status."""
    status = await get_watch_status(user_id)
    return status


@app.post("/api/gmail/sync")
async def trigger_full_sync(user_id: str = Depends(get_current_user_id), max_emails: int = 100):
    """Trigger a manual full sync of the user's inbox."""
    supabase = get_supabase()
    tokens = await _get_user_tokens(supabase, user_id)
    if not tokens:
        raise HTTPException(status_code=400, detail="No tokens found")

    result = await full_sync(
        user_id=user_id,
        access_token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
        max_emails=max_emails,
    )
    return result
