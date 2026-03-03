-- 007: Referral system — viral growth through trusted executive networks
--
-- Every user gets a unique referral code on signup.
-- They share it → referral signs up → gets their own code → chain repeats.

-- Add referral columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);

-- Referral tracking (analytics: who referred whom)
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id),
    referred_id UUID NOT NULL REFERENCES users(id),
    code_used TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(referred_id)
);

-- Seed codes for bootstrapping (founder's initial invites)
CREATE TABLE IF NOT EXISTS seed_codes (
    code TEXT PRIMARY KEY,
    created_by TEXT DEFAULT 'founder',
    used_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_codes ENABLE ROW LEVEL SECURITY;

-- Users can see their own referrals
CREATE POLICY referrals_select_own ON referrals
    FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Seed codes: service_role only (no anon access)
CREATE POLICY seed_codes_service_only ON seed_codes
    FOR ALL USING (false);
