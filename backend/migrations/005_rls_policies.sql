-- 005: Row-Level Security policies for all tables
-- Users can only access their own data via the anon/authenticated client.
-- Backend uses service_role key which bypasses RLS.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY users_select_own ON users
    FOR SELECT USING (id = auth.uid());
CREATE POLICY users_update_own ON users
    FOR UPDATE USING (id = auth.uid());

-- Emails
CREATE POLICY emails_select_own ON emails
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY emails_insert_own ON emails
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Drafts
CREATE POLICY drafts_select_own ON drafts
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY drafts_update_own ON drafts
    FOR UPDATE USING (user_id = auth.uid());

-- Gmail tokens
CREATE POLICY tokens_select_own ON gmail_tokens
    FOR SELECT USING (user_id = auth.uid());
