"""EmailState — LangGraph state definition for the CHIEF pipeline.

The state flows through 4 nodes:
  Gatekeeper → Oracle → Scribe → Operator

Scribe uses dynamic interrupt() to pause for human approval.
Human decision (approved, user_edits) is returned by interrupt()
and written into state by the Scribe node itself.
"""

import operator
from typing import Annotated, Optional
from typing_extensions import TypedDict
from langgraph.graph import add_messages


class EmailState(TypedDict):
    # ---- Input (set by webhook handler before graph invoke) ----
    email_id: str
    user_id: str
    raw_email: dict  # {from, to, subject, body, thread_id, received_at}

    # ---- Gatekeeper output ----
    sanitized_body: str
    pii_findings: list[str]  # ["SSN", "PHONE"] — types found
    importance_score: int  # 1-10
    importance_reason: str
    should_draft: bool  # False if score < user threshold

    # ---- Oracle output ----
    rag_context: list[dict]  # Top-5 relevant past emails from Pinecone
    sender_history: dict  # {frequency, relationship, last_topic, total_interactions}
    suggested_tone: str  # professional | casual | formal | brief

    # ---- Scribe output ----
    draft_subject: str
    draft_body: str
    confidence: float  # 0-1

    # ---- Operator output (runs AFTER human resume) ----
    draft_id: Optional[str]  # Supabase draft UUID
    action_taken: str  # "sent" | "archived" | "edited_and_sent"
    notification_sent: bool

    # ---- Human-in-the-loop (set by Scribe after interrupt() resumes) ----
    approved: Optional[bool]
    user_edits: Optional[str]  # If user edited the draft before approving

    # ---- Control ----
    error_log: Annotated[list[str], operator.add]
    messages: Annotated[list, add_messages]
