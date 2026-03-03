# Contributing

Thank you for your interest in contributing to CHIEF.

## Getting Started

1. Fork the repo and clone your fork
2. Follow the [Quickstart](quickstart.md) to get running locally
3. Create a branch: `git checkout -b feat/your-feature`
4. Make your changes
5. Open a PR against `main`

## Code Style

### Python (Backend)

- Formatter: `ruff format`
- Linter: `ruff check`
- Type hints on all function signatures
- Docstrings on all public functions (Google style)

### TypeScript (Frontend)

- Formatter: `prettier`
- Strict TypeScript — no `any` unless absolutely necessary
- React hooks follow `use-` prefix convention

## File Placement

Follow the file placement rules in [CLAUDE.md](../CLAUDE.md):

### Backend

| Type | Path |
|------|------|
| FastAPI routes | `backend/api/<module>.py` |
| Pydantic models | `backend/api/models.py` |
| LangGraph nodes | `backend/agents/<node>.py` |
| Agent state | `backend/agents/state.py` |
| Graph assembly | `backend/agents/graph.py` |
| Prompt templates | `backend/agents/prompts.py` |
| Shared infra | `backend/core/<module>.py` |
| Business logic | `backend/services/<service>.py` |
| SQL migrations | `backend/migrations/<NNN>_<name>.sql` |
| Tests | `backend/tests/test_<module>.py` |

### Frontend

| Type | Path |
|------|------|
| Pages | `frontend/app/<route>/page.tsx` |
| API routes | `frontend/app/api/<route>/route.ts` |
| Components | `frontend/components/<name>.tsx` |
| shadcn/ui | `frontend/components/ui/<name>.tsx` |
| Hooks | `frontend/hooks/use-<name>.ts` |
| Utilities | `frontend/lib/<name>.ts` |

## Testing

```bash
cd backend && pytest
```

Write tests for:
- New API endpoints
- New LangGraph nodes
- Service functions with business logic
- Edge cases in PII sanitization

## Security Considerations

CHIEF handles sensitive email data. Please keep these principles in mind:

1. **PII sanitization** — All email bodies must pass through `services/pii_sanitizer.py` before any LLM call or database storage
2. **No auto-send** — Every email requires explicit human approval. Never bypass the interrupt mechanism
3. **JWT auth** — All API endpoints must use `Depends(get_current_user_id)`. Never trust user_id from query params
4. **Vault for tokens** — Store OAuth tokens in Supabase Vault, not in plain database columns
5. **RLS** — All new tables need RLS policies
6. **Input validation** — Use Pydantic models with appropriate field constraints

## PR Process

1. **One concern per PR** — Don't mix features with refactoring
2. **Update docs** — If your change affects API, state, or configuration, update the relevant docs
3. **Add migrations** — New tables need a numbered migration file
4. **Test locally** — Verify the full pipeline works (webhook → pipeline → swipe → send)
5. **No secrets** — Never commit `.env` files or real API keys
