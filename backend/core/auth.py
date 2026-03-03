"""JWT authentication middleware for API endpoints.

Validates Supabase JWTs from the Authorization header and extracts
the authenticated user_id (``sub`` claim).

Usage in FastAPI routes:
    from core.auth import get_current_user_id

    @app.get("/api/something")
    async def endpoint(user_id: str = Depends(get_current_user_id)):
        ...
"""

import logging

import jwt
from fastapi import HTTPException, Request

from core.config import JWT_SECRET

log = logging.getLogger("chief.auth")


async def get_current_user_id(request: Request) -> str:
    """FastAPI dependency — extract and validate user_id from JWT.

    Expects: ``Authorization: Bearer <jwt>``
    Returns the ``sub`` claim (user UUID).
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header",
        )

    token = auth_header[7:]  # Strip "Bearer "

    if not JWT_SECRET:
        log.error("JWT_SECRET not configured — cannot validate JWTs")
        raise HTTPException(status_code=500, detail="Auth not configured")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        log.warning("JWT validation failed: %s", e)
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing sub claim")

    return user_id
