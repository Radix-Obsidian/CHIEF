# CHIEF – AI Executive Email Proxy

## Architecture
- **Backend:** Python 3.12 + FastAPI + LangGraph + Pinecone + Supabase
- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind + shadcn/ui + Framer Motion
- **LLM Tiers:** Claude Sonnet 4 (deliverable) · Gemini Flash (operational)

## File Placement Rules

### Backend (`backend/`)
- FastAPI routes: `backend/api/<module>.py`
- Pydantic models: `backend/api/models.py`
- LangGraph agents: `backend/agents/<node>.py`
- Agent state: `backend/agents/state.py`
- Graph assembly: `backend/agents/graph.py`
- Prompt templates: `backend/agents/prompts.py`
- Shared infrastructure: `backend/core/<module>.py`
- Business logic: `backend/services/<service>.py`
- SQL migrations: `backend/migrations/<NNN>_<name>.sql`
- Tests: `backend/tests/test_<module>.py`

### Frontend (`frontend/`)
- Pages: `frontend/app/<route>/page.tsx`
- Layouts: `frontend/app/<route>/layout.tsx`
- API proxy routes: `frontend/app/api/<route>/route.ts`
- Components: `frontend/components/<name>.tsx`
- shadcn/ui primitives: `frontend/components/ui/<name>.tsx`
- Custom hooks: `frontend/hooks/use-<name>.ts`
- Utilities: `frontend/lib/<name>.ts`

## Development Commands
```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend && pnpm install
pnpm dev

# Docker (both)
docker compose up

# Tests
cd backend && pytest
```

## Key Conventions
- All email bodies are PII-sanitized before any LLM call or Supabase storage
- Supabase RLS enforces user-scoped data access on all tables
- Pinecone namespaces use `user_{uuid}` pattern for multi-tenant isolation
- LangGraph graph uses `interrupt_after=["scribe"]` for human-in-the-loop approval
- Graph resumes via `Command(resume=...)` on swipe approve/reject
- No auto-send: every email requires explicit human approval via swipe
