# Supabase Setup Guide

CHIEF uses Supabase for Postgres database, Vault (encrypted token storage), Row-Level Security, and Realtime subscriptions.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note the project URL and keys from **Settings → API**

Add to your `.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...  # anon/public key
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # service_role key (backend only)
SUPABASE_DB_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
SUPABASE_JWT_SECRET=your-jwt-secret  # Settings → API → JWT Secret

# Frontend env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 2. Run Migrations

Run each SQL file in order via **SQL Editor** in the Supabase Dashboard:

```
backend/migrations/001_users.sql      — Users table + updated_at trigger
backend/migrations/002_emails.sql     — Emails table + indexes
backend/migrations/003_drafts.sql     — Drafts table + status check constraint
backend/migrations/004_gmail_tokens.sql — Gmail token references (Vault-encrypted)
backend/migrations/005_rls_policies.sql — RLS policies for all tables
```

## 3. Enable Vault

Supabase Vault encrypts sensitive data at rest. CHIEF stores Gmail OAuth tokens in Vault.

1. Go to **Dashboard → Database → Extensions**
2. Enable the `vault` extension (should be enabled by default on new projects)

Create the helper RPC functions CHIEF uses:

```sql
-- Read a secret by name
CREATE OR REPLACE FUNCTION vault_read_secret(secret_name TEXT)
RETURNS TEXT AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Create or update a secret
CREATE OR REPLACE FUNCTION vault_create_or_update(secret_name TEXT, secret_value TEXT)
RETURNS UUID AS $$
DECLARE
  existing_id UUID;
BEGIN
  SELECT id INTO existing_id FROM vault.secrets WHERE name = secret_name;
  IF existing_id IS NOT NULL THEN
    PERFORM vault.update_secret(existing_id, secret_value);
    RETURN existing_id;
  ELSE
    RETURN vault.create_secret(secret_value, secret_name);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 4. Enable Realtime

Enable Postgres Changes replication for the `emails` and `drafts` tables:

1. Go to **Dashboard → Database → Replication**
2. Under "Supabase Realtime", toggle ON for:
   - `emails`
   - `drafts`

This allows the frontend to subscribe to INSERT/UPDATE events on these tables.

## 5. Row-Level Security

Migration `005_rls_policies.sql` creates RLS policies so users can only access their own data via the `anon`/`authenticated` client.

The backend uses the `service_role` key which **bypasses RLS**. Authorization is enforced at the API layer via JWT middleware (`core/auth.py`).

### Policies Created

| Table | Operation | Policy |
|-------|-----------|--------|
| `users` | SELECT | `id = auth.uid()` |
| `users` | UPDATE | `id = auth.uid()` |
| `emails` | SELECT | `user_id = auth.uid()` |
| `emails` | INSERT | `user_id = auth.uid()` |
| `drafts` | SELECT | `user_id = auth.uid()` |
| `drafts` | UPDATE | `user_id = auth.uid()` |
| `gmail_tokens` | SELECT | `user_id = auth.uid()` |

## 6. Frontend Client

The frontend uses `@supabase/supabase-js` with the anon key for Realtime subscriptions:

```typescript
// frontend/lib/supabase-browser.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Realtime events are automatically filtered by RLS — each user only receives events for rows they own.
