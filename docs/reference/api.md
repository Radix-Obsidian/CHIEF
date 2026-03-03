# API Reference

All endpoints require `Authorization: Bearer <supabase-jwt>` unless noted otherwise.

Base URL: `http://localhost:8000` (development) or your Railway URL (production).

---

## Auth

### `GET /api/auth/google`

Redirect to Google OAuth consent screen. No auth required.

**Response:** `302 Redirect` to Google OAuth URL

### `POST /api/auth/callback`

Exchange authorization code for tokens. No auth required.

**Request Body:**
```json
{
  "code": "4/0AbCD...",
  "state": null
}
```

**Response:**
```json
{
  "access_token": "ya29...",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "expires_at": "2026-03-02T13:00:00Z"
}
```

### `POST /api/auth/refresh`

Refresh the user's Gmail access token.

**Response:**
```json
{
  "access_token": "ya29...",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "expires_at": "2026-03-02T14:00:00Z"
}
```

---

## Email

### `GET /api/email/feed`

Paginated email feed sorted by importance (highest first).

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number (max 1000) |
| `per_page` | int | 20 | Items per page (max 100) |

**Response:**
```json
{
  "emails": [
    {
      "id": "550e8400-...",
      "gmail_id": "18d7a...",
      "thread_id": "18d7a...",
      "from_address": "alice@example.com",
      "subject": "Q1 Budget Review",
      "body_preview": "Hi, please review the attached...",
      "importance_score": 8,
      "importance_reason": "Budget-related from frequent sender",
      "has_draft": true,
      "received_at": "2026-03-02T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

### `GET /api/email/pending`

List emails with paused graphs (drafts awaiting swipe approval).

**Response:**
```json
[
  {
    "thread_id": "18d7a...",
    "email_id": "550e8400-...",
    "draft_subject": "Re: Q1 Budget Review",
    "draft_body": "Hi Alice, I've reviewed the budget...",
    "importance_score": 8,
    "confidence": 0.82,
    "original_email": {
      "from": "alice@example.com",
      "subject": "Q1 Budget Review",
      "preview": "Hi, please review the attached..."
    }
  }
]
```

### `GET /api/email/{email_id}`

Get a single email with full sanitized body.

**Response:** Full email row from Supabase.

### `GET /api/email/{email_id}/stream`

SSE stream of pipeline progress. Connect via `EventSource`.

**Response:** `text/event-stream`

```
data: {"node": "gatekeeper", "status": "sanitizing_pii"}
data: {"node": "gatekeeper", "status": "scoring_importance"}
data: {"node": "gatekeeper", "status": "complete", "importance_score": 8}
data: {"node": "oracle", "status": "querying_context"}
data: {"node": "scribe", "status": "generating_draft"}
data: {"node": "scribe", "status": "waiting_approval", "confidence": 0.82}
data: {"status": "stream_end"}
```

---

## Drafts

### `GET /api/drafts`

List drafts filtered by status.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | "pending" | Filter: pending, approved, rejected, sent |

**Response:** Array of draft objects.

### `GET /api/drafts/{draft_id}`

Get a single draft with full body.

### `PUT /api/drafts/{draft_id}`

Edit a draft's body text.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `body` | string | New draft body (max 10,000 chars) |

### `POST /api/drafts/{thread_id}/approve`

Approve or reject a draft. Resumes the paused LangGraph via `Command(resume=...)`.

**Request Body:**
```json
{
  "approved": true,
  "edits": null
}
```

To approve with edits:
```json
{
  "approved": true,
  "edits": "Hi Alice, thanks for the budget review. Looks good to me!"
}
```

To reject (archive):
```json
{
  "approved": false
}
```

**Response:**
```json
{
  "status": "sent",
  "draft_id": "550e8400-..."
}
```

Possible `status` values: `sent`, `edited_and_sent`, `archived`, `send_failed`

---

## Gmail

### `POST /api/gmail/watch/start`

Start Gmail Pub/Sub watch for the authenticated user's inbox.

### `POST /api/gmail/watch/stop`

Stop Gmail watch.

### `GET /api/gmail/watch/status`

Check current watch status.

**Response:**
```json
{
  "active": true,
  "expiry": "2026-03-09T10:00:00Z",
  "history_id": "12345"
}
```

### `POST /api/gmail/sync`

Trigger a manual full sync.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `max_emails` | int | 100 | Max emails to sync |

---

## Users

### `GET /api/users/{user_id}`

Get user profile. `user_id` must match the authenticated user.

**Response:**
```json
{
  "id": "550e8400-...",
  "email": "you@gmail.com",
  "full_name": "Your Name",
  "settings": {
    "importance_threshold": 5,
    "auto_draft": true
  },
  "voice_profile": {},
  "created_at": "2026-03-01T00:00:00Z"
}
```

### `PUT /api/users/{user_id}/settings`

Update user settings. `user_id` must match the authenticated user.

**Request Body:**
```json
{
  "importance_threshold": 7,
  "auto_draft": false,
  "voice_profile": {}
}
```

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `importance_threshold` | int | 1-10 | Minimum score to generate a draft |
| `auto_draft` | bool | — | Auto-send high-confidence (>=0.9) drafts |
| `voice_profile` | object | — | Custom voice settings |

---

## Webhooks

### `POST /api/webhooks/gmail`

Gmail Pub/Sub push notification handler. No JWT auth — verified via Google OIDC token.

Called by Google Cloud Pub/Sub when new emails arrive.

### `POST /api/webhooks/gmail/test`

Manual trigger for testing. Requires JWT auth.
