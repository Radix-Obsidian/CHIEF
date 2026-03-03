# Realtime Guide

CHIEF uses two real-time mechanisms: **Supabase Realtime** for database-driven updates and **SSE streaming** for pipeline progress.

## Supabase Realtime (Postgres Changes)

The frontend subscribes to live INSERT and UPDATE events on the `emails` and `drafts` tables. RLS automatically filters events so each user only sees their own data.

### Prerequisites

Enable Realtime replication for both tables in Supabase Dashboard:

**Dashboard → Database → Replication → Supabase Realtime → Toggle ON for `emails` and `drafts`**

### useRealtimeEmails

**File:** `frontend/hooks/use-realtime-emails.ts`

Subscribes to new emails and score updates:

```typescript
import { useRealtimeEmails } from "@/hooks/use-realtime-emails";

function InboxPage() {
  useRealtimeEmails({
    userId: session.user.id,
    onInsert: (email) => {
      // New email arrived — add to feed
      setEmails((prev) => [email, ...prev]);
    },
    onUpdate: (email) => {
      // Email updated (e.g., importance score recalculated)
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? email : e))
      );
    },
  });
}
```

Under the hood:

```typescript
const channel = supabase
  .channel(`emails:${userId}`)
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "emails",
    filter: `user_id=eq.${userId}`,
  }, (payload) => onInsert?.(payload.new))
  .on("postgres_changes", {
    event: "UPDATE",
    schema: "public",
    table: "emails",
    filter: `user_id=eq.${userId}`,
  }, (payload) => onUpdate?.(payload.new))
  .subscribe();
```

### useRealtimeDrafts

**File:** `frontend/hooks/use-realtime-drafts.ts`

Subscribes to new drafts and status changes:

```typescript
import { useRealtimeDrafts } from "@/hooks/use-realtime-drafts";

function SwipeFeed() {
  useRealtimeDrafts({
    userId: session.user.id,
    onInsert: (draft) => {
      if (draft.status === "pending") {
        // New draft ready for review — add to swipe feed
        refetchPendingDrafts();
      }
    },
    onUpdate: (draft) => {
      if (draft.status !== "pending") {
        // Draft approved/rejected — remove from feed
        removeDraftFromFeed(draft.id);
      }
    },
  });
}
```

### Important: DELETE Events and RLS

Supabase Realtime does **not** apply RLS to DELETE events (Postgres limitation). Since CHIEF doesn't delete emails or drafts (we update status instead), this isn't a concern. But be aware if you add DELETE operations.

## SSE Streaming (Pipeline Progress)

Each node in the LangGraph pipeline emits progress events via `get_stream_writer()`. The frontend connects via Server-Sent Events to show real-time pipeline status.

### Backend: Stream Endpoint

**File:** `backend/api/email.py` — `GET /api/email/{email_id}/stream`

The endpoint invokes `graph.astream()` with `stream_mode=["custom", "updates"]`:

```python
async def event_stream():
    async for chunk in graph.astream(
        input_data,
        config=config,
        stream_mode=["custom", "updates"],
    ):
        if isinstance(chunk, tuple) and len(chunk) == 2:
            mode, payload = chunk
            if mode == "custom":
                yield f"data: {json.dumps(payload)}\n\n"
            elif mode == "updates":
                for node_name in payload:
                    yield f"data: {json.dumps({'node': node_name, 'status': 'node_complete'})}\n\n"

    yield f"data: {json.dumps({'status': 'stream_end'})}\n\n"
```

### Frontend: SSE Proxy

**File:** `frontend/app/api/email/[id]/stream/route.ts`

Next.js API route proxies the backend SSE stream to the browser:

```typescript
export async function GET(request, { params }) {
  const { id: emailId } = await params;
  const userId = request.nextUrl.searchParams.get("user_id");

  const upstream = await fetch(
    `${BACKEND_URL}/api/email/${emailId}/stream?user_id=${userId}`,
    { cache: "no-store" }
  );

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Frontend: useAgentStream Hook

**File:** `frontend/hooks/use-agent-stream.ts`

```typescript
import { useAgentStream } from "@/hooks/use-agent-stream";

function EmailDetail({ emailId }: { emailId: string }) {
  const { events, latest, streaming, start, stop } = useAgentStream();

  // Start streaming when user opens email detail
  useEffect(() => {
    start(emailId, userId);
    return () => stop();
  }, [emailId]);

  return (
    <div>
      {streaming && <PipelineProgress events={events} />}
      {latest?.status === "waiting_approval" && <SwipeCard />}
    </div>
  );
}
```

### Event Sequence

A typical SSE stream for a high-importance email:

```
data: {"node": "gatekeeper", "status": "sanitizing_pii"}
data: {"node": "gatekeeper", "status": "scoring_importance"}
data: {"node": "gatekeeper", "status": "complete", "importance_score": 8, "should_draft": true}
data: {"node": "gatekeeper", "status": "node_complete"}
data: {"node": "oracle", "status": "querying_context"}
data: {"node": "oracle", "status": "synthesizing_context", "rag_docs": 3}
data: {"node": "oracle", "status": "complete", "suggested_tone": "professional"}
data: {"node": "oracle", "status": "node_complete"}
data: {"node": "scribe", "status": "generating_draft"}
data: {"node": "scribe", "status": "waiting_approval", "confidence": 0.82}
data: {"status": "stream_end"}
```

The stream ends at `stream_end`. If Scribe interrupts, no more events come until the user resumes the graph.

## Architecture Summary

```
Backend writes to Supabase tables
  → Supabase Realtime pushes Postgres Changes to frontend
  → Frontend hooks update UI without polling

Backend streams LangGraph events via SSE
  → Next.js proxy forwards stream to browser
  → useAgentStream hook parses events and updates UI
```

No polling. No WebSocket server to maintain. Supabase handles the Realtime infrastructure, and SSE is a simple HTTP stream.
