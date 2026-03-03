"""CHIEF Backend — Unified ASGI entry point.

Dispatches requests to the correct sub-application based on URL path prefix.
All services run on a single port (Railway exposes one port per service).

    uvicorn main:app --host 0.0.0.0 --port 8000

Sub-apps are lazy-loaded on first request to their prefix so that the
process starts quickly and the /health probe responds immediately.
"""

import importlib
import logging
import os

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
)
log = logging.getLogger("chief")

log.info("CHIEF Backend starting — sub-apps will lazy-load on first request")


# ---------------------------------------------------------------------------
# Lazy sub-app loader
# ---------------------------------------------------------------------------
_app_cache: dict[str, object] = {}


def _load_app(module_path: str) -> object:
    """Import a sub-app module and return its ``app`` attribute."""
    if module_path not in _app_cache:
        log.info("Lazy-loading %s …", module_path)
        mod = importlib.import_module(module_path)
        sub = getattr(mod, "app")
        _patch_cors(sub)
        _app_cache[module_path] = sub
    return _app_cache[module_path]


# ---------------------------------------------------------------------------
# CORS patch (applied once per sub-app on first load)
# ---------------------------------------------------------------------------
_FRONTEND_URL = os.getenv("FRONTEND_URL", "")
_RAILWAY_URL = os.getenv("RAILWAY_PUBLIC_DOMAIN", "")

_extra_origins: list[str] = []
if _FRONTEND_URL:
    _extra_origins.append(_FRONTEND_URL.rstrip("/"))
if _RAILWAY_URL:
    _extra_origins.append(f"https://{_RAILWAY_URL}")


def _patch_cors(sub_app):
    """Append production origins to an already-configured CORSMiddleware."""
    if not _extra_origins:
        return
    for mw in getattr(sub_app, "user_middleware", []):
        if getattr(mw.cls, "__name__", "") == "CORSMiddleware":
            existing = list(mw.kwargs.get("allow_origins", []))
            mw.kwargs["allow_origins"] = existing + _extra_origins
            break


# ---------------------------------------------------------------------------
# Prefix → module path map (sub-app loaded lazily)
# ---------------------------------------------------------------------------
_PREFIX_MAP = [
    ("/api/auth", "api.auth"),
    ("/api/gmail", "api.gmail"),
    ("/api/webhooks", "api.webhooks"),
    ("/api/email", "api.email"),
    ("/api/drafts", "api.drafts"),
    ("/api/users", "api.users"),
]


# ---------------------------------------------------------------------------
# ASGI callable
# ---------------------------------------------------------------------------
async def _health_response(scope, receive, send):
    """Minimal JSON health response — no sub-app dependency."""
    await send({
        "type": "http.response.start",
        "status": 200,
        "headers": [[b"content-type", b"application/json"]],
    })
    await send({
        "type": "http.response.body",
        "body": b'{"status":"ok","service":"chief-backend"}',
    })


async def app(scope, receive, send):
    """ASGI 3.0 dispatcher with lazy sub-app loading."""
    if scope["type"] in ("http", "websocket"):
        path: str = scope.get("path", "")

        # Fast-path health probe
        if path == "/health":
            await _health_response(scope, receive, send)
            return

        for prefix, module_path in _PREFIX_MAP:
            if path.startswith(prefix):
                sub = _load_app(module_path)
                await sub(scope, receive, send)
                return

        # 404 for unmatched paths
        await send({
            "type": "http.response.start",
            "status": 404,
            "headers": [[b"content-type", b"application/json"]],
        })
        await send({
            "type": "http.response.body",
            "body": b'{"error":"not_found"}',
        })

    elif scope["type"] == "lifespan":
        while True:
            message = await receive()
            if message["type"] == "lifespan.startup":
                log.info("ASGI lifespan startup complete (no-op)")
                await send({"type": "lifespan.startup.complete"})
            elif message["type"] == "lifespan.shutdown":
                log.info("ASGI lifespan shutdown complete")
                await send({"type": "lifespan.shutdown.complete"})
                return
