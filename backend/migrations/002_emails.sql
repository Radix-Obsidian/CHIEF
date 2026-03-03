-- 002: Emails table
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    gmail_id TEXT NOT NULL,
    thread_id TEXT,
    from_address TEXT NOT NULL,
    to_addresses TEXT[] DEFAULT '{}',
    subject TEXT,
    body_sanitized TEXT,
    body_preview TEXT,
    importance_score SMALLINT DEFAULT 5 CHECK (importance_score BETWEEN 1 AND 10),
    importance_reason TEXT,
    labels TEXT[] DEFAULT '{}',
    received_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT now(),
    has_draft BOOLEAN DEFAULT false,
    UNIQUE(user_id, gmail_id)
);

CREATE INDEX IF NOT EXISTS idx_emails_user_importance
    ON emails(user_id, importance_score DESC);

CREATE INDEX IF NOT EXISTS idx_emails_user_received
    ON emails(user_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_emails_thread
    ON emails(user_id, thread_id);
