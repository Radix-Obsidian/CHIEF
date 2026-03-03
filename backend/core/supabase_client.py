"""Supabase client singleton.

Provides two clients:
  - service_client: uses service role key, bypasses RLS (for backend operations)
  - anon_client: uses anon key, respects RLS (should not be used in backend)
"""

from functools import lru_cache
from supabase import create_client, Client
from core.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Get the Supabase service-role client (bypasses RLS for backend ops)."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


@lru_cache(maxsize=1)
def get_supabase_anon() -> Client:
    """Get the Supabase anon client (respects RLS)."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY are required")
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
