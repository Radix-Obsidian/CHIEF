"""Google OAuth flow for Gmail access.

Endpoints:
  GET  /api/auth/google   → Redirect to Google consent screen
  POST /api/auth/callback → Exchange code for tokens, store in Vault
  POST /api/auth/refresh  → Refresh access token
"""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow

from api.models import OAuthCallbackRequest, TokenResponse
from core.config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
)
from core.supabase_client import get_supabase

log = logging.getLogger("chief.auth")

app = FastAPI(title="CHIEF Auth")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
]

CLIENT_CONFIG = {
    "web": {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [GOOGLE_REDIRECT_URI],
    }
}


def _create_flow() -> Flow:
    flow = Flow.from_client_config(CLIENT_CONFIG, scopes=SCOPES)
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    return flow


@app.get("/api/auth/google")
async def google_login():
    """Redirect user to Google OAuth consent screen."""
    flow = _create_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return RedirectResponse(url=auth_url)


@app.post("/api/auth/callback")
async def google_callback(req: OAuthCallbackRequest):
    """Exchange authorization code for tokens, create/update user."""
    flow = _create_flow()

    try:
        flow.fetch_token(code=req.code)
    except Exception as e:
        log.error("Token exchange failed: %s", e)
        raise HTTPException(status_code=400, detail="Token exchange failed")

    credentials = flow.credentials
    supabase = get_supabase()

    # Get user info from Google
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {credentials.token}"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        user_info = resp.json()

    google_sub = user_info["id"]
    email = user_info["email"]
    full_name = user_info.get("name", "")

    # Upsert user
    user_result = supabase.table("users").upsert(
        {
            "google_sub": google_sub,
            "email": email,
            "full_name": full_name,
        },
        on_conflict="google_sub",
    ).execute()

    user_id = user_result.data[0]["id"]

    # Store tokens in Vault
    _store_tokens(supabase, user_id, credentials)

    log.info("OAuth complete for user %s (%s)", user_id, email)

    return TokenResponse(
        access_token=credentials.token,
        user_id=user_id,
        expires_at=credentials.expiry or datetime.now(timezone.utc) + timedelta(hours=1),
    )


@app.post("/api/auth/refresh")
async def refresh_token(user_id: str):
    """Refresh the user's Gmail access token."""
    supabase = get_supabase()

    # Get refresh token from Vault
    token_row = supabase.table("gmail_tokens").select("refresh_token_id").eq("user_id", user_id).single().execute()
    if not token_row.data:
        raise HTTPException(status_code=404, detail="No tokens found for user")

    secret_name = f"gmail_refresh_{user_id}"
    vault_result = supabase.rpc("vault_decrypt", {"secret_name": secret_name}).execute()
    if not vault_result.data:
        raise HTTPException(status_code=500, detail="Failed to decrypt refresh token")

    refresh_token_value = vault_result.data

    # Use google-auth to refresh
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request

    creds = Credentials(
        token=None,
        refresh_token=refresh_token_value,
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        token_uri="https://oauth2.googleapis.com/token",
    )
    creds.refresh(Request())

    # Update access token in Vault
    access_secret_name = f"gmail_access_{user_id}"
    supabase.rpc("vault_update_or_create", {
        "secret_name": access_secret_name,
        "secret_value": creds.token,
    }).execute()

    # Update expiry
    supabase.table("gmail_tokens").update({
        "token_expiry": creds.expiry.isoformat() if creds.expiry else None,
    }).eq("user_id", user_id).execute()

    return TokenResponse(
        access_token=creds.token,
        user_id=user_id,
        expires_at=creds.expiry or datetime.now(timezone.utc) + timedelta(hours=1),
    )


def _store_tokens(supabase, user_id: str, credentials) -> None:
    """Store OAuth tokens in Supabase Vault (encrypted)."""
    access_name = f"gmail_access_{user_id}"
    refresh_name = f"gmail_refresh_{user_id}"

    # Create or update secrets in Vault
    access_result = supabase.rpc("vault_create_or_update", {
        "secret_name": access_name,
        "secret_value": credentials.token,
    }).execute()

    refresh_result = None
    if credentials.refresh_token:
        refresh_result = supabase.rpc("vault_create_or_update", {
            "secret_name": refresh_name,
            "secret_value": credentials.refresh_token,
        }).execute()

    # Store references in gmail_tokens table
    supabase.table("gmail_tokens").upsert(
        {
            "user_id": user_id,
            "access_token_id": access_result.data if access_result else None,
            "refresh_token_id": refresh_result.data if refresh_result else None,
            "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
        },
        on_conflict="user_id",
    ).execute()
