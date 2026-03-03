# Quickstart

Get CHIEF running locally in 5 minutes.

## Prerequisites

- Python 3.12+
- Node.js 20+ / pnpm
- Docker (optional, for one-command start)
- Accounts: Supabase, Anthropic, Google Cloud, Pinecone

## 1. Clone and Configure

```bash
git clone https://github.com/your-org/chief.git
cd chief
cp .env.example .env
```

Fill in your `.env` — see [env-vars reference](reference/env-vars.md) for where to find each value.

## 2. Set Up Supabase

See [Supabase Setup Guide](guides/supabase-setup.md) for detailed steps. Quick version:

```sql
-- Run each migration in Supabase Dashboard → SQL Editor
-- backend/migrations/001_users.sql through 005_rls_policies.sql
```

Enable Realtime replication for `emails` and `drafts` tables:
**Dashboard → Database → Replication → Enable for `emails`, `drafts`**

Copy your JWT secret:
**Dashboard → Settings → API → JWT Secret → copy to `SUPABASE_JWT_SECRET` in `.env`**

## 3. Set Up Gmail API

See [Gmail Setup Guide](guides/gmail-setup.md). Quick version:

1. Create a Google Cloud project
2. Enable Gmail API
3. Create OAuth 2.0 credentials (Web application)
4. Set redirect URI to `http://localhost:3000/api/auth/callback`
5. Copy Client ID and Client Secret to `.env`

## 4. Start with Docker

```bash
docker compose up
```

Or start manually:

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend
cd frontend
pnpm install
pnpm dev
```

## 5. Connect Your Gmail

1. Open http://localhost:3000
2. Click "Connect Gmail" — redirects to Google OAuth consent
3. Authorize CHIEF to read/send email
4. You're redirected back with your account connected

## 6. Test the Pipeline

1. Send yourself a test email from another account
2. Start the Gmail watch: the frontend triggers `POST /api/gmail/watch/start`
3. Watch the pipeline process it in real-time (SSE progress events)
4. If the email scores above your importance threshold, a draft appears
5. Swipe right to send, left to archive

## What Happens Under the Hood

```
Your test email arrives in Gmail
  → Google Pub/Sub fires webhook to your backend
  → Backend syncs the new email via Gmail API
  → Gatekeeper sanitizes PII, scores importance
  → Oracle queries Pinecone for relevant past emails
  → Scribe drafts a reply in your voice (Claude Sonnet 4)
  → Graph pauses (interrupt) — draft appears in your feed
  → You swipe right — graph resumes
  → Operator sends the reply via Gmail API
```

## Next Steps

- [Configure your importance threshold](reference/api.md#put-apiusersuseridettings) (default: 5)
- [Calibrate your voice profile](guides/voice-calibration.md) for more accurate drafts
- [Deploy to production](guides/deployment.md) on Railway
