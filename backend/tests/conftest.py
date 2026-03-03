"""Shared test fixtures."""

import os
import pytest

# Set test environment variables before importing any app modules
os.environ["PII_SCAN_ENABLED"] = "true"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "test-anon-key"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-role-key"
os.environ["PINECONE_API_KEY"] = "test-pinecone-key"
os.environ["PINECONE_INDEX"] = "test-index"
os.environ["ANTHROPIC_API_KEY"] = "test-anthropic-key"
os.environ["OPENAI_API_KEY"] = "test-openai-key"
