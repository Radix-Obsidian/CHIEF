"""Voice profiler — Analyze user's sent emails to extract writing style.

Builds a voice profile used by the Scribe node to generate drafts
that sound like the executive wrote them.

Profile is stored as JSONB in the users.voice_profile column.
"""

import json
import logging

from agents.prompts import VOICE_ANALYSIS_PROMPT
from core.llm import get_llm
from core.supabase_client import get_supabase
from core.gmail_client import get_messages, get_message_detail

log = logging.getLogger("chief.voice")


async def build_profile(
    user_id: str,
    access_token: str,
    refresh_token: str | None = None,
    sample_size: int = 20,
) -> dict:
    """Analyze the user's sent emails to build a voice profile.

    Args:
        user_id: Supabase user UUID
        access_token: Gmail OAuth access token
        refresh_token: Gmail OAuth refresh token
        sample_size: Number of sent emails to analyze

    Returns:
        Voice profile dict.
    """
    log.info("Building voice profile for user %s (sample_size=%d)", user_id, sample_size)

    # Fetch sent emails from Gmail
    sent_messages = await get_messages(
        access_token, refresh_token, max_results=sample_size, label_ids=["SENT"]
    )

    sent_texts = []
    for msg_ref in sent_messages[:sample_size]:
        try:
            detail = await get_message_detail(access_token, msg_ref["id"], refresh_token)
            body = detail.get("body", "").strip()
            if body and len(body) > 20:  # Skip very short replies
                sent_texts.append(
                    f"Subject: {detail.get('subject', 'N/A')}\n"
                    f"To: {detail.get('to', 'N/A')}\n"
                    f"Body:\n{body[:500]}"
                )
        except Exception as e:
            log.warning("Failed to fetch sent email: %s", e)

    if not sent_texts:
        log.warning("No sent emails found for voice profiling")
        return _default_profile()

    # Analyze via deliverable LLM
    llm = get_llm(tier="deliverable", temperature=0.2)
    prompt = VOICE_ANALYSIS_PROMPT.format(
        sent_emails="\n\n---\n\n".join(sent_texts[:15])
    )

    try:
        response = await llm.ainvoke(prompt)
        profile = json.loads(response.content)
    except Exception as e:
        log.error("Voice analysis failed: %s", e)
        profile = _default_profile()

    # Store in Supabase
    supabase = get_supabase()
    supabase.table("users").update({
        "voice_profile": profile,
    }).eq("id", user_id).execute()

    log.info("Voice profile built: formality=%s, tone=%s",
             profile.get("formality_level"), profile.get("tone_descriptors"))

    return profile


def _default_profile() -> dict:
    """Default voice profile for users without sent email history."""
    return {
        "greeting_style": "Hi,",
        "closing_style": "Best,",
        "formality_level": 3,
        "avg_sentence_length": "medium",
        "common_phrases": [],
        "tone_descriptors": ["direct", "professional"],
        "punctuation_style": "minimal",
        "emoji_usage": "never",
    }
