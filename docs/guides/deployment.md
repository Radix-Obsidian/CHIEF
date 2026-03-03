# Deployment Guide

Deploy CHIEF to production using Docker and Railway.

## Docker

### Build and Run

```bash
docker compose up --build
```

The `docker-compose.yml` runs both services:
- **Backend:** Python 3.12 + uvicorn on port 8000
- **Frontend:** Next.js on port 3000

### Environment Variables

All env vars from `.env.example` must be set. In production, use your deployment platform's secrets management instead of a `.env` file.

Key production changes:
- `FRONTEND_URL` — Your production frontend URL (for CORS)
- `GOOGLE_REDIRECT_URI` — Your production callback URL
- `PUBSUB_VERIFY_TOKENS=true` — Enable Pub/Sub OIDC verification
- `PUBSUB_AUDIENCE` — Your production webhook URL

## Railway

Railway is the recommended deployment platform. Both services can run on a single Railway project.

### 1. Create Railway Project

```bash
railway init
```

### 2. Deploy Backend

```bash
cd backend
railway up
```

Set environment variables in Railway dashboard. Railway auto-detects the Python project and runs uvicorn.

The `RAILWAY_PUBLIC_DOMAIN` env var is auto-set by Railway. The CORS config reads this to allow requests from the Railway frontend domain.

### 3. Deploy Frontend

```bash
cd frontend
railway up
```

Set `BACKEND_URL` to the backend's Railway URL.

### 4. Configure Pub/Sub

Update your Google Cloud Pub/Sub subscription to push to the Railway backend URL:

```bash
gcloud pubsub subscriptions update chief-gmail-push-sub \
  --push-endpoint=https://your-backend.up.railway.app/api/webhooks/gmail
```

Update `PUBSUB_AUDIENCE` to match.

### 5. Update OAuth Redirect

Add your production redirect URI in Google Cloud Console:
- `https://your-frontend.up.railway.app/api/auth/callback`

## Production Checklist

- [ ] All env vars set (see [env-vars reference](../reference/env-vars.md))
- [ ] Supabase migrations applied
- [ ] Supabase Realtime enabled for `emails` and `drafts`
- [ ] Supabase Vault RPC functions created
- [ ] Gmail OAuth redirect URI updated for production
- [ ] Pub/Sub subscription pointing to production webhook URL
- [ ] `PUBSUB_VERIFY_TOKENS=true`
- [ ] CORS allows production frontend URL
- [ ] `SUPABASE_JWT_SECRET` is set for JWT validation
