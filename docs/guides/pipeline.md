# Pipeline Guide

CHIEF's core is a 4-node LangGraph pipeline that processes each email through sanitization, scoring, context retrieval, and draft generation.

```
START → Gatekeeper → [score >= threshold?] → Oracle → Scribe → Operator → END
                          └── No ──────────────────────────────────────────→ END
```

## Node 1: Gatekeeper

**File:** `backend/agents/gatekeeper.py`

Responsibilities:
1. Sanitize PII from the raw email body
2. Query Pinecone for sender history (past interactions)
3. Score importance 1-10 via operational LLM (Gemini Flash)
4. Update the email record in Supabase with score + sanitized body
5. Upsert the email embedding to Pinecone for future RAG
6. Decide `should_draft` based on user's importance threshold

```python
async def gatekeeper_node(state: EmailState, *, config) -> dict:
    writer = get_stream_writer(config)

    # 1. PII sanitization
    writer({"node": "gatekeeper", "status": "sanitizing_pii"})
    body_result = sanitize(raw.get("body", ""))

    # 2. Sender context from Pinecone
    sender_ctx = await get_sender_context(user_id, raw.get("from", ""))

    # 3. Importance scoring
    writer({"node": "gatekeeper", "status": "scoring_importance"})
    llm = get_llm(tier="operational")
    # ... LLM call returns {score, reason}

    # 4-5. Update Supabase + Pinecone
    # 6. should_draft = importance_score >= user's threshold

    return {
        "sanitized_body": body_result.clean_text,
        "pii_findings": body_result.pii_types_found,
        "importance_score": importance_score,
        "importance_reason": importance_reason,
        "should_draft": should_draft,
    }
```

**SSE events emitted:** `sanitizing_pii` → `scoring_importance` → `complete`

## Node 2: Oracle

**File:** `backend/agents/oracle.py`

Only runs if `should_draft=True`. Responsibilities:
1. Query Pinecone for the top-5 most relevant past emails
2. Synthesize a context briefing via operational LLM
3. Determine suggested tone for the draft

```python
async def oracle_node(state: EmailState, *, config) -> dict:
    writer = get_stream_writer(config)

    # 1. RAG query
    writer({"node": "oracle", "status": "querying_context"})
    rag_results = await query_context(user_id, sanitized_body[:1000], top_k=5)

    # 2. Context synthesis
    writer({"node": "oracle", "status": "synthesizing_context", "rag_docs": len(rag_results)})
    # ... LLM call returns {sender_history, suggested_tone}

    return {
        "rag_context": rag_results,
        "sender_history": sender_history,
        "suggested_tone": suggested_tone,
    }
```

**SSE events emitted:** `querying_context` → `synthesizing_context` → `complete`

## Node 3: Scribe

**File:** `backend/agents/scribe.py`

The core drafting node. Responsibilities:
1. Load user's voice profile from Supabase
2. Get few-shot examples from past sent emails
3. Generate draft via Claude Sonnet 4 (deliverable tier)
4. Auto-approve if confidence >= 0.9 and `auto_draft` is enabled
5. Otherwise, `interrupt()` to pause for human review

```python
async def scribe_node(state: EmailState, *, config) -> dict:
    writer = get_stream_writer(config)

    # Idempotency guard: skip LLM if draft already in state (re-execution after resume)
    if state.get("draft_body"):
        draft_subject, draft_body, confidence = state["draft_subject"], state["draft_body"], state["confidence"]
    else:
        writer({"node": "scribe", "status": "generating_draft"})
        draft_subject, draft_body, confidence = await _generate_draft(state)

    # Auto-approve path
    if confidence >= 0.9 and auto_draft:
        writer({"node": "scribe", "status": "auto_approved", "confidence": confidence})
        return {"draft_subject": ..., "draft_body": ..., "approved": True}

    # Human review path
    writer({"node": "scribe", "status": "waiting_approval", "confidence": confidence})
    human_decision = interrupt({
        "type": "review_draft",
        "draft_subject": draft_subject,
        "draft_body": draft_body,
        "confidence": confidence,
    })

    return {
        "draft_subject": draft_subject,
        "draft_body": human_decision.get("user_edits") or draft_body,
        "approved": human_decision.get("approved", False),
        "user_edits": human_decision.get("user_edits"),
    }
```

**SSE events emitted:** `generating_draft` → `auto_approved` | `waiting_approval`

See [Human-in-the-Loop Guide](human-in-the-loop.md) for the interrupt/resume pattern.

## Node 4: Operator

**File:** `backend/agents/operator.py`

Runs after human resume. Reads the decision from state and executes:

- **Approved:** Send email via Gmail API, store draft as "sent"
- **Rejected:** Archive email (remove INBOX label), store draft as "rejected"

```python
async def operator_node(state: EmailState, *, config) -> dict:
    writer = get_stream_writer(config)

    if state.get("approved"):
        writer({"node": "operator", "status": "sending_email"})
        # Send via Gmail API
        # Store draft record with status="sent"
    else:
        writer({"node": "operator", "status": "archiving_email"})
        # Remove INBOX label via Gmail API
        # Store draft record with status="rejected"

    return {"draft_id": ..., "action_taken": action, "notification_sent": False}
```

**SSE events emitted:** `sending_email` | `archiving_email` → `complete`

## Conditional Routing

The graph uses a conditional edge after Gatekeeper:

```python
def _should_draft_router(state: EmailState) -> str:
    if state.get("should_draft", False):
        return "oracle"
    return END
```

If `importance_score < threshold`, the email is stored in the feed but no draft is generated. The user can still see it and manually process it.

## Checkpointing

The graph uses `PostgresSaver` backed by Supabase Postgres. Every node's output is checkpointed, enabling:

- **Interrupt/resume** — Graph pauses at Scribe, resumes on human swipe
- **Idempotency** — Scribe skips the LLM call on re-execution after resume
- **Audit trail** — Full graph state history per email thread
