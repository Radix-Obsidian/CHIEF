# Deploying CHIEF to Railway

Two-service monorepo deployment: **backend** (FastAPI) + **frontend** (Next.js).

---

## Prerequisites

- Railway account at [railway.com](https://railway.com)
- GitHub repo pushed (Railway deploys from Git)
- Supabase project already running (external — not on Railway)
- Google Cloud project with OAuth + Pub/Sub configured
- API keys: Anthropic, OpenAI, Google AI (Gemini)

---

## Step 1: Create Railway Project

1. Go to [railway.com/new](https://railway.com/new)
2. Click **"Deploy from GitHub Repo"**
3. Select the `CHIEF` repository
4. Railway creates your first service — this will be the **backend**

---

## Step 2: Configure Backend Service

The backend auto-detects `railway.toml` at the repo root, which sets:
- Builder: Dockerfile (`Dockerfile.backend`)
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health check: `/health`
- Watch paths: `backend/**`

### Backend Settings (verify in dashboard)

| Setting | Value |
|---------|-------|
| Root Directory | `/` (leave default) |
| Builder | Dockerfile |
| Dockerfile Path | `Dockerfile.backend` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT --log-level info` |

### Generate a Public Domain

1. Go to **Settings → Networking → Public Networking**
2. Click **"Generate Domain"** or add a custom domain
3. Note the domain (e.g., `chief-backend-production.up.railway.app`)

---

## Step 3: Create Frontend Service

1. In the same Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select the same `CHIEF` repository again
3. This creates a second service from the same repo

### Frontend Settings (configure in dashboard)

| Setting | Value |
|---------|-------|
| Root Directory | `/` (leave default) |
| Builder | Dockerfile |
| Dockerfile Path | `Dockerfile.frontend` |
| Start Command | `node server.js` |

To set the Dockerfile path, add this **service variable**:
```
RAILWAY_DOCKERFILE_PATH=Dockerfile.frontend
```

### Configure Watch Paths

In **Settings → Build → Watch Paths**, add:
```
frontend/**
Dockerfile.frontend
```

### Generate a Public Domain

1. Go to **Settings → Networking → Public Networking**
2. Click **"Generate Domain"** or add a custom domain
3. Note the domain (e.g., `chief-frontend-production.up.railway.app`)

---

## Step 4: Environment Variables

### Shared Variables (Project Settings → Shared Variables)

These are used by both services:

```env
SUPABASE_URL=https://opmxjutanslefvambmjy.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_DB_URL=<your-postgres-connection-string>
SUPABASE_JWT_SECRET=<your-jwt-secret>
```

### Backend Variables

Add these to the **backend service** → Variables tab:

```env
# LLM Keys
ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
GOOGLE_API_KEY=<your-gemini-key>

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://<FRONTEND_DOMAIN>/api/auth/callback

# Gmail Pub/Sub
GMAIL_PUBSUB_TOPIC=projects/<project>/topics/<topic>
GMAIL_PUBSUB_SUBSCRIPTION=projects/<project>/subscriptions/<sub>
PUBSUB_AUDIENCE=https://<BACKEND_DOMAIN>/api/webhooks/gmail

# Pinecone
PINECONE_API_KEY=<your-key>
PINECONE_INDEX=chief-emails

# Frontend URL (for CORS)
FRONTEND_URL=https://<FRONTEND_DOMAIN>

# LangSmith (optional)
LANGCHAIN_API_KEY=<your-key>
LANGCHAIN_PROJECT=chief-email

# Admin
ADMIN_SECRET=<generate-a-strong-secret>
```

### Frontend Variables

Add these to the **frontend service** → Variables tab:

```env
# Backend URL — use Railway private networking for server-side API calls
BACKEND_URL=http://backend.railway.internal:<PORT>

# Supabase (NEXT_PUBLIC_ vars are inlined at build time)
NEXT_PUBLIC_SUPABASE_URL=https://opmxjutanslefvambmjy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Frontend's own URL (used by some callbacks)
FRONTEND_URL=https://<FRONTEND_DOMAIN>
```

> **Important**: `NEXT_PUBLIC_*` variables must be available at **build time**.
> Railway automatically makes service variables available during both build and runtime.

> **Private Networking**: `BACKEND_URL` uses Railway's internal DNS
> (`http://<service-name>.railway.internal:<port>`) so frontend→backend calls
> never leave Railway's network. Replace `<PORT>` with the backend's internal
> port (Railway sets this — check backend service logs for the actual port,
> or use `${{backend.PORT}}`).

---

## Step 5: Reference Variables Between Services

Railway supports cross-service variable references. In the **frontend** service:

```
BACKEND_URL=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:${{backend.PORT}}
```

This automatically resolves to the backend's private networking address.

---

## Step 6: Configure Google OAuth Redirect

After deployment, update your Google Cloud Console:

1. Go to **APIs & Services → Credentials → OAuth 2.0 Client**
2. Add to **Authorized redirect URIs**:
   ```
   https://<FRONTEND_DOMAIN>/api/auth/callback
   ```
3. Add to **Authorized JavaScript origins**:
   ```
   https://<FRONTEND_DOMAIN>
   ```

---

## Step 7: Configure Gmail Pub/Sub Webhook

Update the Pub/Sub push subscription to point to your Railway backend:

```bash
gcloud pubsub subscriptions modify-push-config <SUBSCRIPTION_NAME> \
  --push-endpoint="https://<BACKEND_DOMAIN>/api/webhooks/gmail"
```

---

## Step 8: Run Database Migrations

If you haven't already run migrations on your Supabase instance, execute the SQL files in order:

```
backend/migrations/001_users.sql
backend/migrations/002_emails.sql
backend/migrations/003_drafts.sql
backend/migrations/004_gmail_tokens.sql
backend/migrations/005_rls_policies.sql
backend/migrations/006_vault_functions.sql
backend/migrations/007_referrals.sql
```

Run these in the **Supabase Dashboard → SQL Editor**.

---

## Architecture on Railway

```
┌─────────────────────────────────────────────┐
│              Railway Project                 │
│                                              │
│  ┌──────────────┐    ┌──────────────────┐   │
│  │   backend     │    │    frontend       │   │
│  │  (FastAPI)    │◄───│   (Next.js)      │   │
│  │  Port: $PORT  │    │   Port: $PORT    │   │
│  │               │    │                  │   │
│  │  Dockerfile.  │    │  Dockerfile.     │   │
│  │  backend      │    │  frontend        │   │
│  └──────┬───────┘    └────────┬─────────┘   │
│         │ private network      │ public       │
│         │ (internal only)      │ domain       │
│         │                      │              │
└─────────┼──────────────────────┼──────────────┘
          │                      │
    ┌─────▼─────┐          ┌────▼────┐
    │ Supabase  │          │  Users  │
    │ (ext DB)  │          │ (HTTPS) │
    │ Pinecone  │          └─────────┘
    │ Gmail API │
    └───────────┘
```

**Traffic flow:**
1. Users hit the frontend's public domain (HTTPS)
2. Frontend SSR/API routes call backend via **private networking** (no public internet)
3. Backend calls external services (Supabase, Pinecone, Gmail, LLMs)
4. Gmail Pub/Sub webhooks hit the backend's public domain directly

---

## Verify Deployment

1. **Backend health**: `curl https://<BACKEND_DOMAIN>/health`
   - Expected: `{"status":"ok","service":"chief-backend"}`

2. **Frontend**: Visit `https://<FRONTEND_DOMAIN>`
   - Should show login/landing page

3. **OAuth flow**: Click "Sign in with Google"
   - Should redirect through Google and back to the app

4. **Webhook**: Check backend logs for incoming Gmail push notifications

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Frontend can't reach backend | Check `BACKEND_URL` uses private networking format |
| CORS errors | Ensure `FRONTEND_URL` env var matches the actual frontend domain |
| OAuth redirect fails | Update `GOOGLE_REDIRECT_URI` and Google Console redirect URIs |
| Build fails on NEXT_PUBLIC vars | These must be set before build — check they're in service variables |
| Health check failing | Backend needs `/health` endpoint responding within 300s of deploy |
| Gmail webhooks not arriving | Update Pub/Sub push endpoint to backend's public domain |

---

## Custom Domains

To use your own domain instead of `*.up.railway.app`:

1. Go to service **Settings → Networking → Custom Domain**
2. Add your domain (e.g., `app.chiefmail.com` for frontend, `api.chiefmail.com` for backend)
3. Add the CNAME record Railway provides to your DNS
4. Update all environment variables referencing the domain
5. Update Google OAuth redirect URIs
