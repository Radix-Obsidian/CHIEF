"""Scribe node — Draft generation in user's voice.

Third node in the pipeline. Responsibilities:
1. Load user's voice profile
2. Get few-shot examples from past sent emails
3. Generate draft reply using deliverable tier LLM (Claude Sonnet 4)
4. Return draft + confidence score

IMPORTANT: The graph pauses after this node (interrupt_after=["scribe"]).
The draft is checkpointed and waits for human approval via swipe.
"""

import json
import logging

from agents.state import EmailState
from agents.prompts import DRAFT_GENERATION_PROMPT
from core.llm import get_llm
from core.supabase_client import get_supabase

log = logging.getLogger("chief.scribe")

# Default voice profile if none calibrated yet
_DEFAULT_VOICE = {
    "greeting_style": "Hi,",
    "closing_style": "Best,",
    "formality_level": 3,
    "avg_sentence_length": "medium",
    "common_phrases": [],
    "tone_descriptors": ["direct", "professional"],
    "punctuation_style": "minimal",
    "emoji_usage": "never",
}


async def scribe_node(state: EmailState) -> dict:
    """Generate a draft reply in the user's voice."""
    user_id = state["user_id"]
    raw = state["raw_email"]

    log.info("Scribe drafting reply for email %s", state["email_id"])

    # 1. Load voice profile
    supabase = get_supabase()
    user_row = supabase.table("users").select("voice_profile").eq("id", user_id).single().execute()
    voice_profile = user_row.data.get("voice_profile") if user_row.data else None
    if not voice_profile:
        voice_profile = _DEFAULT_VOICE

    voice_str = json.dumps(voice_profile, indent=2)

    # 2. Build context briefing from Oracle output
    rag_context = state.get("rag_context", [])
    sender_history = state.get("sender_history", {})
    context_briefing = (
        f"Sender relationship: {sender_history.get('relationship', 'unknown')}\n"
        f"Email frequency: {sender_history.get('frequency', 'unknown')}\n"
        f"Last topic: {sender_history.get('last_topic', 'unknown')}\n"
        f"Past interactions: {sender_history.get('total_interactions', 0)}\n"
    )

    # 3. Get few-shot examples (last 5 sent emails from this user)
    few_shot_examples = await _get_few_shot_examples(supabase, user_id)

    # 4. Generate draft with deliverable LLM (Claude Sonnet 4)
    llm = get_llm(tier="deliverable", temperature=0.4)
    prompt = DRAFT_GENERATION_PROMPT.format(
        voice_profile=voice_str,
        context_briefing=context_briefing,
        from_address=raw.get("from", ""),
        subject=raw.get("subject", ""),
        body=state.get("sanitized_body", "")[:3000],
        few_shot_examples=few_shot_examples,
        suggested_tone=state.get("suggested_tone", "professional"),
    )

    try:
        response = await llm.ainvoke(prompt)
        draft_data = json.loads(response.content)
        draft_subject = draft_data.get("subject", f"Re: {raw.get('subject', '')}")
        draft_body = draft_data.get("body", "")
        confidence = float(draft_data.get("confidence", 0.7))
    except Exception as e:
        log.error("Draft generation failed: %s", e)
        draft_subject = f"Re: {raw.get('subject', '')}"
        draft_body = f"Thank you for your email. I'll review and get back to you shortly."
        confidence = 0.1

    log.info("Scribe: draft generated with confidence %.2f. Graph will now pause for human approval.", confidence)

    return {
        "draft_subject": draft_subject,
        "draft_body": draft_body,
        "confidence": confidence,
    }


async def _get_few_shot_examples(supabase, user_id: str, limit: int = 5) -> str:
    """Get recent sent emails as few-shot examples for voice matching."""
    try:
        # Look for emails the user has sent (drafts that were sent)
        result = supabase.table("drafts").select(
            "subject, body"
        ).eq("user_id", user_id).eq(
            "status", "sent"
        ).order("sent_at", desc=True).limit(limit).execute()

        if not result.data:
            return "No prior sent emails available. Use the default professional tone."

        examples = []
        for i, draft in enumerate(result.data, 1):
            examples.append(f"Example {i}:\nSubject: {draft['subject']}\n{draft['body']}")

        return "\n\n---\n\n".join(examples)

    except Exception as e:
        log.warning("Failed to get few-shot examples: %s", e)
        return "No prior sent emails available. Use the default professional tone."
