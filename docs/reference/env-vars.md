# Environment Variables

All environment variables used by CHIEF, organized by service.

## Anthropic (Deliverable Tier)

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `ANTHROPIC_API_KEY` | Yes | Claude Sonnet 4 for draft generation | [Anthropic Console](https://console.anthropic.com) → API Keys |

## OpenAI (Embeddings)

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `OPENAI_API_KEY` | Yes | text-embedding-3-small for Pinecone | [OpenAI Dashboard](https://platform.openai.com) → API Keys |

## Google (Operational Tier)

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `GOOGLE_API_KEY` | Yes | Gemini Flash for scoring/synthesis | [Google AI Studio](https://aistudio.google.com) → API Key |

## Gmail API

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 client ID | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 client secret | Google Cloud Console → Credentials |
| `GOOGLE_REDIRECT_URI` | Yes | OAuth callback URL | Default: `http://localhost:3000/api/auth/callback` |
| `GMAIL_PUBSUB_TOPIC` | Yes | Pub/Sub topic for push notifications | `projects/{project}/topics/{topic}` |
| `GMAIL_PUBSUB_SUBSCRIPTION` | Yes | Pub/Sub subscription | `projects/{project}/subscriptions/{sub}` |
| `PUBSUB_VERIFY_TOKENS` | No | Verify OIDC tokens on webhook | Default: `true`. Set `false` for local dev |
| `PUBSUB_AUDIENCE` | No | Expected audience in OIDC token | Your webhook URL |

## Supabase

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `SUPABASE_URL` | Yes | Project URL | Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Yes | Anonymous/public key | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (backend only) | Dashboard → Settings → API |
| `SUPABASE_DB_URL` | Yes | Postgres connection string | Dashboard → Settings → Database → Connection string (URI) |
| `SUPABASE_JWT_SECRET` | Yes | JWT signing secret for auth | Dashboard → Settings → API → JWT Secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL (frontend) | Same as `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon key (frontend) | Same as `SUPABASE_ANON_KEY` |

## Pinecone

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `PINECONE_API_KEY` | Yes | API key | [Pinecone Console](https://app.pinecone.io) → API Keys |
| `PINECONE_INDEX` | No | Index name | Default: `chief-emails` |

## LangSmith (Optional)

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `LANGCHAIN_API_KEY` | No | Enables LangSmith tracing | [LangSmith](https://smith.langchain.com) → Settings |
| `LANGCHAIN_PROJECT` | No | Project name for traces | Default: `chief-email` |
| `LANGCHAIN_TRACING_V2` | No | Enable v2 tracing | Set `true` if using LangSmith |

## PII

| Variable | Required | Description |
|----------|----------|-------------|
| `PII_SCAN_ENABLED` | No | Enable PII scanning. Default: `true` |
| `PII_PRESIDIO_ENABLED` | No | Use Presidio analyzer. Default: `false` (regex fallback) |

## Web Push (VAPID)

| Variable | Required | Description |
|----------|----------|-------------|
| `VAPID_PUBLIC_KEY` | No | VAPID public key for push notifications |
| `VAPID_PRIVATE_KEY` | No | VAPID private key |
| `VAPID_SUBJECT` | No | VAPID subject (mailto: URL) |

## URLs

| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_URL` | No | Backend URL for frontend proxy. Default: `http://localhost:8000` |
| `FRONTEND_URL` | No | Frontend URL for CORS. Default: `http://localhost:3000` |
| `RAILWAY_PUBLIC_DOMAIN` | No | Auto-set by Railway. Added to CORS origins |
