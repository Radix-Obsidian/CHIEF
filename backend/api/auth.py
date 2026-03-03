"""Google OAuth flow for Gmail access with viral referral gating.

Endpoints:
  GET  /api/auth/google     → Redirect to Google consent screen
  POST /api/auth/callback   → Exchange code for tokens, validate referral, store in Vault
  POST /api/auth/refresh    → Refresh access token
  POST /api/auth/seed-codes → Generate seed referral codes (admin only)
"""

import asyncio
import logging
import secrets
import string
from datetime import datetime, timedelta, timezone

import jwt as pyjwt
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from pydantic import BaseModel

from api.models import OAuthCallbackRequest, TokenResponse
from core.auth import get_current_user_id
from core.cors import add_cors
from core.config import (
    ADMIN_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    JWT_SECRET,
)
from core.supabase_client import get_supabase
from services.voice_profiler import build_profile

log = logging.getLogger("chief.auth")

app = FastAPI(title="CHIEF Auth")
add_cors(app)

# In-memory store for PKCE code verifiers + referral codes keyed by OAuth state.
# Each entry is consumed on callback, so this stays small.
_pkce_store: dict[str, dict] = {}

# Characters for referral codes (no ambiguous: 0/O, 1/I/L)
_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def _generate_code(length: int = 8) -> str:
    """Generate a unique referral code (uppercase, no ambiguous chars)."""
    return "".join(secrets.choice(_CODE_CHARS) for _ in range(length))

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
async def google_login(ref: str | None = Query(default=None)):
    """Redirect user to Google OAuth consent screen."""
    flow = _create_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    # Persist PKCE code_verifier and referral code so the callback can use them
    _pkce_store[state] = {
        "verifier": flow.code_verifier,
        "ref": ref,
    }
    return RedirectResponse(url=auth_url)


@app.post("/api/auth/callback")
async def google_callback(req: OAuthCallbackRequest):
    """Exchange authorization code for tokens, validate referral, create/update user."""
    flow = _create_flow()

    # Restore PKCE code_verifier and referral code from the login step
    stored = _pkce_store.pop(req.state, {}) if req.state else {}
    if stored.get("verifier"):
        flow.code_verifier = stored["verifier"]
    ref_code = stored.get("ref")

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

    # Check if this is a returning user (already has an account)
    existing = supabase.table("users").select("id, referral_code").eq("google_sub", google_sub).execute()
    is_new_user = not existing.data

    # Validate referral code for new users
    referrer_id = None
    if is_new_user:
        if not ref_code:
            raise HTTPException(status_code=403, detail="Valid referral code required")

        # Check if code belongs to an existing user
        referrer = supabase.table("users").select("id").eq("referral_code", ref_code).execute()
        if referrer.data:
            referrer_id = referrer.data[0]["id"]
        else:
            # Check seed codes
            seed = supabase.table("seed_codes").select("code, used_by").eq("code", ref_code).execute()
            if not seed.data or seed.data[0].get("used_by"):
                raise HTTPException(status_code=403, detail="Invalid or expired referral code")

    # Generate referral code for new user
    new_referral_code = None
    if is_new_user:
        new_referral_code = _generate_code()

    # Upsert user
    upsert_data = {
        "google_sub": google_sub,
        "email": email,
        "full_name": full_name,
    }
    if is_new_user:
        upsert_data["referral_code"] = new_referral_code
        if referrer_id:
            upsert_data["referred_by"] = referrer_id

    user_result = supabase.table("users").upsert(
        upsert_data,
        on_conflict="google_sub",
    ).execute()

    user_id = user_result.data[0]["id"]
    user_referral_code = user_result.data[0].get("referral_code") or new_referral_code

    # Track the referral
    if is_new_user:
        if referrer_id:
            supabase.table("referrals").insert({
                "referrer_id": referrer_id,
                "referred_id": user_id,
                "code_used": ref_code,
            }).execute()
        else:
            # Mark seed code as used
            supabase.table("seed_codes").update({"used_by": user_id}).eq("code", ref_code).execute()

    # Store tokens in Vault
    _store_tokens(supabase, user_id, credentials)

    # Build voice profile in background (non-blocking)
    asyncio.create_task(build_profile(
        user_id=user_id,
        access_token=credentials.token,
        refresh_token=credentials.refresh_token,
    ))

    log.info("OAuth complete for user %s (%s), referral_code=%s", user_id, email, user_referral_code)

    # Mint an app JWT for the frontend to use on subsequent API calls
    token_expiry = datetime.now(timezone.utc) + timedelta(days=7)
    app_token = pyjwt.encode(
        {"sub": user_id, "email": email, "exp": token_expiry},
        JWT_SECRET,
        algorithm="HS256",
    )

    return TokenResponse(
        access_token=app_token,
        user_id=user_id,
        expires_at=token_expiry,
        referral_code=user_referral_code,
    )


@app.post("/api/auth/refresh")
async def refresh_token(user_id: str = Depends(get_current_user_id)):
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


class SeedCodesRequest(BaseModel):
    count: int = 5
    admin_secret: str


@app.post("/api/auth/seed-codes")
async def create_seed_codes(req: SeedCodesRequest):
    """Generate seed referral codes for initial invites. Admin only."""
    if req.admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    supabase = get_supabase()
    codes = [_generate_code() for _ in range(req.count)]

    for code in codes:
        supabase.table("seed_codes").insert({"code": code}).execute()

    log.info("Generated %d seed codes", len(codes))
    return {"codes": codes}


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
