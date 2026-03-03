"""Centralized CORS configuration.

All sub-apps should use ``add_cors(app)`` instead of manually adding
CORSMiddleware with hardcoded origins.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
_RAILWAY_URL = os.getenv("RAILWAY_PUBLIC_DOMAIN", "")

ALLOWED_ORIGINS: list[str] = [_FRONTEND_URL.rstrip("/")]
if _RAILWAY_URL:
    ALLOWED_ORIGINS.append(f"https://{_RAILWAY_URL}")


def add_cors(app: FastAPI) -> None:
    """Attach CORSMiddleware with the shared origin list."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
    )
