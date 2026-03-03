# CHIEF — AI Executive Email Proxy

> Your inbox, handled. AI-generated email drafts with human-in-the-loop approval.

CHIEF watches your Gmail inbox, scores every email by importance, drafts replies in your voice, and waits for you to swipe right (send) or left (archive). No email is ever sent without your explicit approval.

```
Gmail Inbox ──► Webhook ──► Gatekeeper ──► Oracle ──► Scribe ──► [You Swipe] ──► Operator ──► Gmail Sent
                              │ PII scan       │ RAG         │ Draft          │ Approve       │ Send
                              │ Score 1-10     │ Context     │ Your voice     │ or reject     │ or archive
```

## How It Works

1. **Email arrives** — Gmail Pub/Sub webhook fires, triggering an incremental sync
2. **Gatekeeper** sanitizes PII + scores importance (1-10) using sender history from Pinecone
3. **Oracle** retrieves context from past interactions via RAG + synthesizes a briefing
4. **Scribe** drafts a reply in your voice using Claude Sonnet 4, then pauses for approval
5. **You swipe** right to send, left to archive — no auto-send, ever
6. **Operator** executes your decision via Gmail API

## Quickstart

```bash
# 1. Clone
git clone https://github.com/your-org/chief.git && cd chief

# 2. Configure
cp .env.example .env
# Fill in: Supabase, Anthropic, Google, Pinecone keys

# 3. Run database migrations
# Apply 001-005 SQL files in backend/migrations/ via Supabase Dashboard → SQL Editor

# 4. Start
docker compose up

# 5. Open
open http://localhost:3000

# 6. Connect Gmail via OAuth, send yourself a test email, watch the pipeline process it
```

See [docs/quickstart.md](docs/quickstart.md) for the full 5-minute setup guide.

## Stack

| Layer       | Tech                                                    |
|-------------|---------------------------------------------------------|
| Backend     | Python 3.12 · FastAPI · LangGraph 0.4                  |
| Frontend    | Next.js 16 · React 19 · TypeScript · Tailwind · shadcn |
| LLM         | Claude Sonnet 4 (drafts) · Gemini Flash (scoring)      |
| Database    | Supabase (Postgres + Vault + Realtime + RLS)            |
| Vector DB   | Pinecone (per-user namespaces)                          |
| Deploy      | Docker · Railway                                        |

## Architecture

```
┌─────────────┐     Pub/Sub      ┌──────────────────────────────────────────────┐
│  Gmail API  │ ──────────────►  │  FastAPI Backend (single port)               │
└─────────────┘                  │                                              │
                                 │  Webhook ──► LangGraph Pipeline              │
┌─────────────┐   Realtime       │    ├─ Gatekeeper (PII + score)               │
│  Supabase   │ ◄──────────────  │    ├─ Oracle (RAG context)                   │
│  Postgres   │ ──────────────►  │    ├─ Scribe (draft + interrupt)             │
│  + Vault    │   Service Role   │    └─ Operator (send/archive)                │
│  + RLS      │                  │                                              │
└─────────────┘                  │  PostgresSaver checkpointer (durable state)  │
                                 └──────────────────────────────────────────────┘
┌─────────────┐                         │
│  Pinecone   │ ◄───────────────────────┘ Embeddings (user_{uuid} namespace)
└─────────────┘

┌──────────────────────────────────────────────┐
│  Next.js Frontend                            │
│  ├─ Supabase Realtime (live email/draft feed)│
│  ├─ SSE streaming (pipeline progress)        │
│  └─ Swipe UX (approve/reject drafts)         │
└──────────────────────────────────────────────┘
```

## Key Design Decisions

- **No auto-send** — Every email requires explicit human approval via swipe
- **PII sanitization** — All email bodies are sanitized before any LLM call or database storage
- **Two LLM tiers** — Operational (Gemini Flash, fast/cheap for scoring) and Deliverable (Claude Sonnet 4, high-quality for drafts)
- **Dynamic interrupts** — Scribe self-interrupts via `interrupt()`, not graph-level `interrupt_after`
- **Per-user isolation** — Supabase RLS, Pinecone namespaces (`user_{uuid}`), Vault-encrypted tokens
- **Supabase Realtime** — Frontend subscribes to Postgres Changes, no polling

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](docs/architecture.md) | System design, data flow, security model |
| [Quickstart](docs/quickstart.md) | 5-minute local setup guide |
| [Pipeline Guide](docs/guides/pipeline.md) | The 4-node LangGraph pipeline explained |
| [Human-in-the-Loop](docs/guides/human-in-the-loop.md) | Interrupt/resume + swipe UX |
| [Realtime](docs/guides/realtime.md) | Supabase Realtime + SSE streaming |
| [Gmail Setup](docs/guides/gmail-setup.md) | OAuth + Pub/Sub configuration |
| [Supabase Setup](docs/guides/supabase-setup.md) | Tables, RLS, Vault, Replication |
| [Deployment](docs/guides/deployment.md) | Railway / Docker production deploy |
| [API Reference](docs/reference/api.md) | All REST endpoints |
| [Database Reference](docs/reference/database.md) | Table schemas + RLS policies |
| [Env Vars](docs/reference/env-vars.md) | Every environment variable |
| [State Reference](docs/reference/state.md) | EmailState fields |
| [Contributing](docs/contributing.md) | Code style, PR process |

## License

MIT
