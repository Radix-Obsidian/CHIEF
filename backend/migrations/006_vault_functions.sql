-- 006: Vault wrapper functions for Gmail token storage
-- These wrap Supabase Vault operations so they can be called via PostgREST RPC.
-- Prerequisite: vault extension enabled (Supabase Dashboard → Extensions → vault)

-- Enable vault extension (idempotent)
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Read a secret by name (returns decrypted value or NULL)
CREATE OR REPLACE FUNCTION public.vault_read_secret(secret_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result TEXT;
BEGIN
    SELECT decrypted_secret INTO result
    FROM vault.decrypted_secrets
    WHERE name = secret_name
    LIMIT 1;
    RETURN result;
END;
$$;

-- Create or update a secret by name (delegates to vault.create_secret / vault.update_secret)
CREATE OR REPLACE FUNCTION public.vault_create_or_update(secret_name TEXT, secret_value TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    existing_id UUID;
    new_id UUID;
BEGIN
    SELECT id INTO existing_id
    FROM vault.secrets
    WHERE name = secret_name
    LIMIT 1;

    IF existing_id IS NOT NULL THEN
        PERFORM vault.update_secret(existing_id, secret_value);
        RETURN existing_id;
    ELSE
        new_id := vault.create_secret(secret_value, secret_name);
        RETURN new_id;
    END IF;
END;
$$;

-- Alias used by auth refresh endpoint
CREATE OR REPLACE FUNCTION public.vault_decrypt(secret_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN public.vault_read_secret(secret_name);
END;
$$;

-- Alias used in some code paths
CREATE OR REPLACE FUNCTION public.vault_update_or_create(secret_name TEXT, secret_value TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN public.vault_create_or_update(secret_name, secret_value);
END;
$$;

-- Seed test user (local development only)
INSERT INTO public.users (id, email, full_name, google_sub, settings)
VALUES (
    '5bb5a66e-ea2f-4303-ad04-90690f552c0c',
    'test@chief.app',
    'Test User',
    'test_google_sub_000',
    '{"auto_draft": true, "importance_threshold": 5}'
)
ON CONFLICT (id) DO NOTHING;
