-- 004: Gmail OAuth tokens (Vault-encrypted)
CREATE TABLE IF NOT EXISTS gmail_tokens (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    access_token_id UUID,
    refresh_token_id UUID,
    token_expiry TIMESTAMPTZ,
    watch_expiry TIMESTAMPTZ,
    history_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Store tokens in Supabase Vault (encrypted at rest)
-- Usage:
--   INSERT: SELECT vault.create_secret('token_value', 'gmail_access_' || user_id);
--   READ:   SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'gmail_access_' || user_id;
--   UPDATE: SELECT vault.update_secret(secret_id, 'new_token_value');

CREATE TRIGGER gmail_tokens_updated_at
    BEFORE UPDATE ON gmail_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
