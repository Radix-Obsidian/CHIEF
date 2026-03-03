"""Draft management endpoints with LangGraph dynamic interrupt/resume.

Endpoints:
  GET  /api/drafts              → List pending drafts
  GET  /api/drafts/{id}         → Get single draft
  PUT  /api/drafts/{id}         → Edit draft body
  POST /api/drafts/{thread_id}/approve → Approve/reject via Command resume
"""

import logging

from fastapi import Depends, FastAPI, HTTPException

from api.models import ApproveRequest, DraftActionResponse
from core.auth import get_current_user_id
from core.cors import add_cors
from core.supabase_client import get_supabase

log = logging.getLogger("chief.api.drafts")

app = FastAPI(title="CHIEF Drafts")
add_cors(app)


@app.get("/api/drafts")
async def list_drafts(user_id: str = Depends(get_current_user_id), status: str = "pending"):
    """List drafts filtered by status."""
    supabase = get_supabase()

    result = supabase.table("drafts").select("*").eq(
        "user_id", user_id
    ).eq("status", status).order("created_at", desc=True).execute()

    return result.data


@app.get("/api/drafts/{draft_id}")
async def get_draft(draft_id: str, user_id: str = Depends(get_current_user_id)):
    """Get a single draft with full body."""
    supabase = get_supabase()

    result = supabase.table("drafts").select("*").eq(
        "id", draft_id
    ).eq("user_id", user_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Draft not found")

    return result.data


@app.put("/api/drafts/{draft_id}")
async def edit_draft(draft_id: str, body: str, user_id: str = Depends(get_current_user_id)):
    """Edit a draft's body text."""
    supabase = get_supabase()

    result = supabase.table("drafts").update({
        "body": body,
        "status": "edited",
    }).eq("id", draft_id).eq("user_id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Draft not found")

    return result.data[0]


@app.post("/api/drafts/{thread_id}/approve")
async def approve_draft(thread_id: str, req: ApproveRequest, user_id: str = Depends(get_current_user_id)):
    """Approve or reject a draft by resuming the paused LangGraph.

    The graph is paused inside the Scribe node via dynamic interrupt().
    This endpoint resumes it with the human decision via Command(resume=...).
    Scribe writes the decision into state, then Operator sends or archives.
    """
    try:
        from langgraph.types import Command
        from agents.graph import get_chief_graph

        # Verify the thread belongs to the authenticated user
        supabase = get_supabase()
        ownership = supabase.table("emails").select("id").eq(
            "thread_id", thread_id
        ).eq("user_id", user_id).limit(1).execute()
        if not ownership.data:
            raise HTTPException(status_code=403, detail="Thread does not belong to you")

        graph = get_chief_graph()
        config = {"configurable": {"thread_id": thread_id}}

        # Verify graph is actually paused at scribe
        state = graph.get_state(config)
        if not state or not state.tasks or not any(t.interrupts for t in state.tasks):
            raise HTTPException(
                status_code=404,
                detail="No pending draft for this thread"
            )

        # Resume with human decision — Command pattern
        command = Command(resume={
            "approved": req.approved,
            "user_edits": req.edits,
        })

        result = await graph.ainvoke(command, config)

        action = result.get("action_taken", "unknown")
        draft_id = result.get("draft_id")

        log.info("Draft %s for thread %s: %s", "approved" if req.approved else "rejected", thread_id, action)

        return DraftActionResponse(status=action, draft_id=draft_id)

    except HTTPException:
        raise
    except Exception as e:
        log.error("Error resuming graph for thread %s: %s", thread_id, e)
        raise HTTPException(status_code=500, detail=str(e))
