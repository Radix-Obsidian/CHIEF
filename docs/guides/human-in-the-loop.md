# Human-in-the-Loop Guide

CHIEF uses LangGraph's dynamic `interrupt()` to pause the pipeline at the Scribe node and wait for human approval before sending any email.

## How It Works

### 1. Scribe Calls `interrupt()`

When the Scribe node generates a draft, it calls `interrupt()` with the draft payload:

```python
from langgraph.types import interrupt

human_decision = interrupt({
    "type": "review_draft",
    "draft_subject": draft_subject,
    "draft_body": draft_body,
    "confidence": confidence,
    "original_email": {"from": raw["from"], "subject": raw["subject"]},
})
```

This pauses the entire graph. The state is checkpointed to Postgres. The `interrupt()` payload becomes visible to the caller as an "interrupt" on the graph's tasks.

### 2. Frontend Shows the Draft

The frontend detects paused graphs by:
- **Supabase Realtime:** Subscribes to `drafts` table INSERT events
- **GET /api/email/pending:** Checks for threads with interrupted tasks

The draft appears in the swipe feed with the original email context, draft preview, and confidence score.

### 3. Human Swipes

The user swipes right (approve) or left (reject). The frontend calls:

```bash
POST /api/drafts/{thread_id}/approve
Content-Type: application/json
Authorization: Bearer <supabase-jwt>

{
  "approved": true,
  "edits": null  // or edited draft body
}
```

### 4. Graph Resumes with `Command(resume=...)`

The API endpoint resumes the graph:

```python
from langgraph.types import Command

command = Command(resume={
    "approved": req.approved,
    "user_edits": req.edits,
})
result = await graph.ainvoke(command, config)
```

The `resume` value is returned from the `interrupt()` call in Scribe. Scribe reads the decision, writes it to state, and the graph continues to Operator.

### 5. Operator Executes

Operator reads `approved` and `user_edits` from state:
- **Approved:** Sends the email via Gmail API
- **Rejected:** Archives the email by removing the INBOX label

## Idempotency on Resume

When a graph resumes via `Command(resume=...)`, the interrupted node **re-executes from the top**. This means Scribe's LLM call would run again without a guard.

The idempotency pattern:

```python
async def scribe_node(state: EmailState, *, config) -> dict:
    # Guard: if we already generated a draft, reuse it
    if state.get("draft_body"):
        draft_subject = state["draft_subject"]
        draft_body = state["draft_body"]
        confidence = state.get("confidence", 0.7)
    else:
        # First execution — generate the draft
        draft_subject, draft_body, confidence = await _generate_draft(state)

    # interrupt() is below — on resume, we skip the LLM call above
    human_decision = interrupt({...})
    ...
```

On first execution: LLM runs → state gets `draft_body` → `interrupt()` pauses.
On resume: `state.get("draft_body")` is truthy → skip LLM → `interrupt()` returns the human decision.

## Auto-Approve

High-confidence drafts can skip human review:

```python
_AUTO_APPROVE_THRESHOLD = 0.9

if confidence >= _AUTO_APPROVE_THRESHOLD and auto_draft:
    return {"approved": True, ...}  # No interrupt()
```

The user controls `auto_draft` in their settings. Even auto-approved drafts go through Operator (which actually sends the email), maintaining the audit trail.

## Checking for Paused Graphs

The API endpoint checks if a graph is actually paused before allowing resume:

```python
state = graph.get_state(config)
if not state or not state.tasks or not any(t.interrupts for t in state.tasks):
    raise HTTPException(status_code=404, detail="No pending draft for this thread")
```

## Frontend Integration

The swipe UI uses these hooks:

| Hook | Purpose |
|------|---------|
| `useRealtimeDrafts` | Subscribe to new drafts via Supabase Realtime |
| `useAgentStream` | SSE progress events during pipeline execution |
| Swipe gesture | Calls `POST /api/drafts/{thread_id}/approve` |

### Optimistic Updates

The swipe is optimistic — the card is removed from the feed immediately. If the API call fails, the card reappears and the user is notified.
