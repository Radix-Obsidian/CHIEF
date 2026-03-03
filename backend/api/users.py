"""User profile and settings endpoints.

Endpoints:
  GET  /api/users/{id}          → Get user profile
  PUT  /api/users/{id}/settings → Update settings
"""

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.models import UserSettings
from core.supabase_client import get_supabase

log = logging.getLogger("chief.api.users")

app = FastAPI(title="CHIEF Users")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    """Get user profile including settings and voice profile."""
    supabase = get_supabase()

    result = supabase.table("users").select(
        "id, email, full_name, settings, voice_profile, created_at"
    ).eq("id", user_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data


@app.put("/api/users/{user_id}/settings")
async def update_settings(user_id: str, settings: UserSettings):
    """Update user settings (importance threshold, auto_draft, etc.)."""
    supabase = get_supabase()

    result = supabase.table("users").update({
        "settings": settings.model_dump(),
    }).eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0]
