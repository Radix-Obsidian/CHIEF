# Database Reference

CHIEF uses Supabase Postgres with 4 tables, RLS policies, and Vault for encrypted token storage.

## Tables

### `users`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `email` | TEXT | — | Unique, Google account email |
| `full_name` | TEXT | — | From Google profile |
| `google_sub` | TEXT | — | Unique, Google OAuth subject ID |
| `voice_profile` | JSONB | `{}` | Calibrated writing style |
| `settings` | JSONB | `{"auto_draft": true, "importance_threshold": 5}` | User preferences |
| `created_at` | TIMESTAMPTZ | `now()` | — |
| `updated_at` | TIMESTAMPTZ | `now()` | Auto-updated via trigger |

**Indexes:** Primary key on `id`, unique on `email`, unique on `google_sub`

### `emails`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | — | FK → `users(id)` CASCADE |
| `gmail_id` | TEXT | — | Gmail message ID |
| `thread_id` | TEXT | — | Gmail thread ID |
| `from_address` | TEXT | — | Sender email |
| `to_addresses` | TEXT[] | `{}` | Recipients |
| `subject` | TEXT | — | Email subject |
| `body_sanitized` | TEXT | — | PII-sanitized body |
| `body_preview` | TEXT | — | First 200 chars |
| `importance_score` | SMALLINT | 5 | 1-10, CHECK constraint |
| `importance_reason` | TEXT | — | LLM explanation |
| `labels` | TEXT[] | `{}` | Gmail labels |
| `received_at` | TIMESTAMPTZ | — | When email was received |
| `processed_at` | TIMESTAMPTZ | `now()` | When pipeline ran |
| `has_draft` | BOOLEAN | `false` | Whether a draft exists |

**Indexes:**
- `idx_emails_user_importance` — `(user_id, importance_score DESC)`
- `idx_emails_user_received` — `(user_id, received_at DESC)`
- `idx_emails_thread` — `(user_id, thread_id)`
- Unique on `(user_id, gmail_id)`

### `drafts`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | — | FK → `users(id)` CASCADE |
| `email_id` | UUID | — | FK → `emails(id)` CASCADE |
| `thread_id` | TEXT | — | Gmail thread ID |
| `subject` | TEXT | — | Draft subject |
| `body` | TEXT | — | Draft body |
| `tone` | TEXT | `'professional'` | Tone used |
| `confidence` | FLOAT | — | Scribe's confidence score |
| `status` | TEXT | `'pending'` | CHECK: pending, approved, rejected, sent, edited_and_sent |
| `approved_at` | TIMESTAMPTZ | — | When user swiped |
| `sent_at` | TIMESTAMPTZ | — | When email was sent |
| `created_at` | TIMESTAMPTZ | `now()` | — |
| `updated_at` | TIMESTAMPTZ | `now()` | Auto-updated via trigger |

**Indexes:**
- `idx_drafts_user_status` — `(user_id, status)`

### `gmail_tokens`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `user_id` | UUID | — | PK, FK → `users(id)` CASCADE |
| `access_token_id` | UUID | — | Vault secret ID for access token |
| `refresh_token_id` | UUID | — | Vault secret ID for refresh token |
| `token_expiry` | TIMESTAMPTZ | — | Access token expiry |
| `watch_expiry` | TIMESTAMPTZ | — | Gmail Pub/Sub watch expiry |
| `history_id` | TEXT | — | Last synced Gmail history ID |
| `updated_at` | TIMESTAMPTZ | `now()` | Auto-updated via trigger |

Actual token values are stored in Supabase Vault (encrypted), referenced by secret name pattern: `gmail_access_{user_id}`, `gmail_refresh_{user_id}`.

## RLS Policies

All tables have RLS enabled. Policies use `auth.uid()` to scope data per user.

| Table | Operation | Condition |
|-------|-----------|-----------|
| `users` | SELECT | `id = auth.uid()` |
| `users` | UPDATE | `id = auth.uid()` |
| `emails` | SELECT | `user_id = auth.uid()` |
| `emails` | INSERT | `user_id = auth.uid()` |
| `drafts` | SELECT | `user_id = auth.uid()` |
| `drafts` | UPDATE | `user_id = auth.uid()` |
| `gmail_tokens` | SELECT | `user_id = auth.uid()` |

The backend uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS. API-level authorization is enforced via JWT middleware.

## Relationships

```
users (1) ──── (N) emails
users (1) ──── (N) drafts
users (1) ──── (1) gmail_tokens
emails (1) ──── (N) drafts
```

## Vault Functions

CHIEF uses two custom RPC functions for Vault access:

```sql
vault_read_secret(secret_name TEXT) → TEXT
vault_create_or_update(secret_name TEXT, secret_value TEXT) → UUID
```

Both are `SECURITY DEFINER` to access vault internals.
