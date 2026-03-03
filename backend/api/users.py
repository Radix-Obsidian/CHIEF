"""User profile and settings endpoints.

Endpoints:
  GET  /api/users/{id}          → Get user profile
  PUT  /api/users/{id}/settings → Update settings
"""

import logging

from fastapi import Depends, FastAPI, HTTPException

from api.models import UserSettings
from core.auth import get_current_user_id
from core.cors import add_cors
from core.supabase_client import get_supabase
from services.voice_profiler import build_profile

log = logging.getLogger("chief.api.users")

app = FastAPI(title="CHIEF Users")
add_cors(app)


@app.get("/api/users/{user_id}")
async def get_user(user_id: str, auth_user_id: str = Depends(get_current_user_id)):
    """Get user profile including settings and voice profile."""
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="Cannot access another user's profile")
    supabase = get_supabase()

    result = supabase.table("users").select(
        "id, email, full_name, settings, voice_profile, created_at"
    ).eq("id", user_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data


@app.put("/api/users/{user_id}/settings")
async def update_settings(user_id: str, settings: UserSettings, auth_user_id: str = Depends(get_current_user_id)):
    """Update user settings (importance threshold, auto_draft, etc.)."""
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="Cannot modify another user's settings")
    supabase = get_supabase()

    result = supabase.table("users").update({
        "settings": settings.model_dump(),
    }).eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0]


@app.post("/api/users/{user_id}/voice-profile/rebuild")
async def rebuild_voice_profile(
    user_id: str,
    auth_user_id: str = Depends(get_current_user_id),
):
    """Rebuild voice profile by re-analyzing sent emails."""
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="Cannot rebuild another user's profile")

    supabase = get_supabase()

    # Get Gmail tokens from Vault
    access_name = f"gmail_access_{user_id}"
    refresh_name = f"gmail_refresh_{user_id}"

    access_result = supabase.rpc("vault_read_secret", {"secret_name": access_name}).execute()
    if not access_result.data:
        raise HTTPException(status_code=400, detail="No Gmail tokens found — connect Gmail first")

    refresh_result = supabase.rpc("vault_read_secret", {"secret_name": refresh_name}).execute()

    profile = await build_profile(
        user_id=user_id,
        access_token=access_result.data,
        refresh_token=refresh_result.data if refresh_result.data else None,
    )

    return {"voice_profile": profile}
