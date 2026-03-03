# EmailState Reference

`EmailState` is the LangGraph `TypedDict` that flows through all 4 pipeline nodes.

**File:** `backend/agents/state.py`

## Fields

### Input (set before graph invoke)

| Field | Type | Description |
|-------|------|-------------|
| `email_id` | `str` | Supabase email UUID |
| `user_id` | `str` | Supabase user UUID |
| `raw_email` | `dict` | `{from, to, subject, body, thread_id, received_at}` |

### Gatekeeper Output

| Field | Type | Description |
|-------|------|-------------|
| `sanitized_body` | `str` | PII-sanitized email body |
| `pii_findings` | `list[str]` | PII types found: `["SSN", "PHONE"]` |
| `importance_score` | `int` | 1-10 importance rating |
| `importance_reason` | `str` | LLM's explanation for the score |
| `should_draft` | `bool` | `True` if score >= user's threshold |

### Oracle Output

| Field | Type | Description |
|-------|------|-------------|
| `rag_context` | `list[dict]` | Top-5 relevant past emails from Pinecone |
| `sender_history` | `dict` | `{frequency, relationship, last_topic, total_interactions}` |
| `suggested_tone` | `str` | `professional` \| `casual` \| `formal` \| `brief` |

### Scribe Output

| Field | Type | Description |
|-------|------|-------------|
| `draft_subject` | `str` | Generated reply subject |
| `draft_body` | `str` | Generated reply body (or user-edited version) |
| `confidence` | `float` | 0-1 confidence score |

### Human-in-the-Loop (set by Scribe after interrupt resumes)

| Field | Type | Description |
|-------|------|-------------|
| `approved` | `Optional[bool]` | Human's approval decision |
| `user_edits` | `Optional[str]` | Edited draft body (if user modified before approving) |

### Operator Output

| Field | Type | Description |
|-------|------|-------------|
| `draft_id` | `Optional[str]` | Supabase draft UUID |
| `action_taken` | `str` | `sent` \| `archived` \| `edited_and_sent` \| `send_failed` |
| `notification_sent` | `bool` | Whether push notification was sent |

### Control

| Field | Type | Description |
|-------|------|-------------|
| `error_log` | `Annotated[list[str], operator.add]` | Accumulated errors (append-only) |
| `messages` | `Annotated[list, add_messages]` | LangGraph message history |

## Node Ownership

```
Gatekeeper writes: sanitized_body, pii_findings, importance_score, importance_reason, should_draft
Oracle writes:     rag_context, sender_history, suggested_tone
Scribe writes:     draft_subject, draft_body, confidence, approved, user_edits
Operator writes:   draft_id, action_taken, notification_sent
```

## Lifecycle

```
1. Webhook handler creates initial state: {email_id, user_id, raw_email}
2. Gatekeeper adds sanitization + scoring fields
3. Oracle adds RAG context (if should_draft=True)
4. Scribe adds draft + calls interrupt() → graph pauses
5. Human swipes → Command(resume={approved, user_edits})
6. Scribe re-executes, reads resume data, writes approval fields
7. Operator reads approval, executes send/archive, writes final fields
```
