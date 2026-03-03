"""Development seed endpoint for demo/production testing.

Endpoints:
  POST /api/dev/seed → Insert demo data + return JWT credentials
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import FastAPI

from core.config import JWT_SECRET
from core.cors import add_cors
from core.supabase_client import get_supabase

log = logging.getLogger("chief.api.dev")

app = FastAPI(title="CHIEF Dev")
add_cors(app)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
TEST_USER_ID = "5bb5a66e-ea2f-4303-ad04-90690f552c0c"
TEST_EMAIL = "test@chief.app"

VOICE_PROFILE = {
    "greeting_style": "Hi",
    "closing_style": "Best,",
    "formality_level": 7,
    "avg_sentence_length": "medium",
    "common_phrases": ["circle back", "let me review", "sounds good"],
    "tone_descriptors": ["professional", "concise", "friendly"],
    "punctuation_style": "standard",
    "emoji_usage": "rare",
}

USER_SETTINGS = {
    "auto_draft": True,
    "importance_threshold": 5,
    "tone_strictness": 70,
}

# ---------------------------------------------------------------------------
# Seed data — realistic executive emails
# ---------------------------------------------------------------------------
SEED_EMAILS = [
    {
        "gmail_id": "seed_ceo_q1",
        "thread_id": "thread_ceo_q1",
        "from_address": "ceo@acme.com",
        "to_addresses": [TEST_EMAIL],
        "subject": "Q1 Revenue Forecast — Need Your Input",
        "body_sanitized": "Hey, the board wants an updated Q1 revenue forecast by Friday. Can you pull together the latest pipeline numbers and send me a summary? Especially interested in the enterprise segment growth.",
        "body_preview": "Hey, the board wants an updated Q1 revenue forecast by Friday. Can you pull together...",
        "importance_score": 9,
        "importance_reason": "CEO direct request, board-level urgency, revenue impact",
    },
    {
        "gmail_id": "seed_board_series_b",
        "thread_id": "thread_board_series_b",
        "from_address": "board@capitalventures.com",
        "to_addresses": [TEST_EMAIL],
        "subject": "Series B Term Sheet — Final Review",
        "body_sanitized": "Attached is the final term sheet for the Series B round. We've incorporated the changes from last week's call. Please review Section 4 (liquidation preferences) and confirm by EOD Wednesday.",
        "body_preview": "Attached is the final term sheet for the Series B round. We've incorporated the changes...",
        "importance_score": 8,
        "importance_reason": "Fundraising milestone, board-level, time-sensitive",
    },
    {
        "gmail_id": "seed_stripe_partner",
        "thread_id": "thread_stripe_partner",
        "from_address": "mchen@stripe.com",
        "to_addresses": [TEST_EMAIL],
        "subject": "Partnership Integration Timeline",
        "body_sanitized": "Following up on our call — the engineering team can start the API integration next sprint. We'll need your webhook endpoints documented by March 10. Happy to set up a technical sync this week.",
        "body_preview": "Following up on our call — the engineering team can start the API integration...",
        "importance_score": 7,
        "importance_reason": "Strategic partnership, engineering dependency, time-bound",
    },
    {
        "gmail_id": "seed_tc_speaker",
        "thread_id": "thread_tc_speaker",
        "from_address": "events@techcrunch.com",
        "to_addresses": [TEST_EMAIL],
        "subject": "TechCrunch Disrupt — Speaker Invitation",
        "body_sanitized": "We'd love to have you on the AI Infrastructure panel at TechCrunch Disrupt (June 12-14, SF). The session is 30 minutes including Q&A. Please confirm your availability by March 15.",
        "body_preview": "We'd love to have you on the AI Infrastructure panel at TechCrunch Disrupt...",
        "importance_score": 6,
        "importance_reason": "PR opportunity, brand visibility, not time-critical",
    },
    {
        "gmail_id": "seed_retro",
        "thread_id": "thread_retro",
        "from_address": "sarah@acme.com",
        "to_addresses": [TEST_EMAIL],
        "subject": "Product Launch Retro — Action Items",
        "body_sanitized": "Great launch last week! Here are the action items from the retro: 1) Fix onboarding drop-off (eng), 2) Update pricing page copy (marketing), 3) Schedule customer interviews (product). Can you own #3?",
        "body_preview": "Great launch last week! Here are the action items from the retro...",
        "importance_score": 7,
        "importance_reason": "Direct report, action item assigned, product impact",
    },
    {
        "gmail_id": "seed_nda",
        "thread_id": "thread_nda",
        "from_address": "legal@acme.com",
        "to_addresses": [TEST_EMAIL],
        "subject": "NDA Renewal — DocuSign Ready",
        "body_sanitized": "The mutual NDA with Databricks is up for renewal. I've prepared the DocuSign envelope with updated terms. Please review and sign when you have a moment — no rush, expires end of month.",
        "body_preview": "The mutual NDA with Databricks is up for renewal. I've prepared the DocuSign...",
        "importance_score": 5,
        "importance_reason": "Legal compliance, routine renewal, low urgency",
    },
    {
        "gmail_id": "seed_newsletter",
        "thread_id": "thread_newsletter",
        "from_address": "newsletter@morning.com",
        "to_addresses": [TEST_EMAIL],
        "subject": "The Morning Brief — March 2",
        "body_sanitized": "Top stories: Fed signals rate pause, Apple Vision Pro sales disappoint, OpenAI launches new reasoning model. Plus: why the best founders are ruthless about saying no.",
        "body_preview": "Top stories: Fed signals rate pause, Apple Vision Pro sales disappoint...",
        "importance_score": 3,
        "importance_reason": "Newsletter, informational only, no action required",
    },
]

SEED_DRAFTS = [
    # 4 pending (inbox swipe cards)
    {
        "thread_id": "thread_ceo_q1",
        "subject": "Re: Q1 Revenue Forecast — Need Your Input",
        "body": "Hi, I'll pull the latest pipeline numbers today and have the summary to you by Thursday. Enterprise segment is trending 23% above target — will break that down in the deck. Let me circle back once I've synced with the sales team.",
        "tone": "professional",
        "confidence": 0.91,
        "status": "pending",
    },
    {
        "thread_id": "thread_board_series_b",
        "subject": "Re: Series B Term Sheet — Final Review",
        "body": "Hi, thanks for turning this around quickly. I'll review Section 4 today and flag any concerns. The liquidation preferences look standard from my initial read, but I want our outside counsel to weigh in before I confirm. Will respond by EOD Wednesday as requested.",
        "tone": "professional",
        "confidence": 0.87,
        "status": "pending",
    },
    {
        "thread_id": "thread_stripe_partner",
        "subject": "Re: Partnership Integration Timeline",
        "body": "Hi, sounds good — let me review the webhook documentation and get it over to your team by March 10. A technical sync this week would be great. How does Thursday afternoon look? I'll loop in our lead engineer.",
        "tone": "professional",
        "confidence": 0.85,
        "status": "pending",
    },
    {
        "thread_id": "thread_tc_speaker",
        "subject": "Re: TechCrunch Disrupt — Speaker Invitation",
        "body": "Hi, thanks for the invitation — I'd love to join the AI Infrastructure panel. June 12-14 works for me. Happy to share some talking points ahead of time. Let me know what you need from my end.",
        "tone": "professional",
        "confidence": 0.82,
        "status": "pending",
    },
    # 2 sent (history page)
    {
        "thread_id": "thread_retro",
        "subject": "Re: Product Launch Retro — Action Items",
        "body": "Hi Sarah, great job pulling the retro together. I'll own #3 — scheduling customer interviews. Aiming to have 5 interviews booked by end of next week. Will share the interview guide in Notion for feedback first.",
        "tone": "professional",
        "confidence": 0.88,
        "status": "sent",
    },
    {
        "thread_id": "thread_nda",
        "subject": "Re: NDA Renewal — DocuSign Ready",
        "body": "Thanks for prepping this. I've reviewed the updated terms and everything looks good. Signed and returned via DocuSign.",
        "tone": "professional",
        "confidence": 0.93,
        "status": "edited_and_sent",
    },
    # 1 rejected (history page)
    {
        "thread_id": "thread_newsletter",
        "subject": "Re: The Morning Brief — March 2",
        "body": "Thanks for the roundup.",
        "tone": "casual",
        "confidence": 0.65,
        "status": "rejected",
    },
]


def _mint_jwt(user_id: str) -> str:
    """Create a HS256 JWT for the given user."""
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@app.post("/api/dev/seed")
async def seed_demo_data():
    """Insert demo data into Supabase and return auth credentials.

    Idempotent — deletes prior seed data before re-inserting.
    """
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    # ── 1. Upsert test user ──
    supabase.table("users").upsert(
        {
            "id": TEST_USER_ID,
            "email": TEST_EMAIL,
            "full_name": "Test User",
            "google_sub": "test_google_sub_000",
            "voice_profile": VOICE_PROFILE,
            "settings": USER_SETTINGS,
        },
        on_conflict="id",
    ).execute()

    # ── 2. Clean prior seed data (idempotent) ──
    seed_gmail_ids = [e["gmail_id"] for e in SEED_EMAILS]
    supabase.table("drafts").delete().eq("user_id", TEST_USER_ID).in_(
        "thread_id", [e["thread_id"] for e in SEED_EMAILS]
    ).execute()
    supabase.table("emails").delete().eq("user_id", TEST_USER_ID).in_(
        "gmail_id", seed_gmail_ids
    ).execute()

    # ── 3. Insert emails ──
    email_rows = []
    for e in SEED_EMAILS:
        email_rows.append({
            "id": str(uuid.uuid4()),
            "user_id": TEST_USER_ID,
            "gmail_id": e["gmail_id"],
            "thread_id": e["thread_id"],
            "from_address": e["from_address"],
            "to_addresses": e["to_addresses"],
            "subject": e["subject"],
            "body_sanitized": e["body_sanitized"],
            "body_preview": e["body_preview"],
            "importance_score": e["importance_score"],
            "importance_reason": e["importance_reason"],
            "labels": [],
            "received_at": now,
            "processed_at": now,
            "has_draft": True,
        })

    supabase.table("emails").insert(email_rows).execute()

    # Build thread→email_id lookup
    thread_to_email = {row["thread_id"]: row["id"] for row in email_rows}

    # ── 4. Insert drafts ──
    draft_rows = []
    for d in SEED_DRAFTS:
        email_id = thread_to_email.get(d["thread_id"])
        if not email_id:
            continue
        sent_at = now if d["status"] in ("sent", "edited_and_sent") else None
        approved_at = now if d["status"] in ("sent", "edited_and_sent") else None
        draft_rows.append({
            "id": str(uuid.uuid4()),
            "user_id": TEST_USER_ID,
            "email_id": email_id,
            "thread_id": d["thread_id"],
            "subject": d["subject"],
            "body": d["body"],
            "tone": d["tone"],
            "confidence": d["confidence"],
            "status": d["status"],
            "approved_at": approved_at,
            "sent_at": sent_at,
            "created_at": now,
        })

    supabase.table("drafts").insert(draft_rows).execute()

    # ── 5. Mint JWT ──
    access_token = _mint_jwt(TEST_USER_ID)

    log.info("Seeded %d emails + %d drafts for test user", len(email_rows), len(draft_rows))

    return {
        "user_id": TEST_USER_ID,
        "access_token": access_token,
        "seeded": {
            "emails": len(email_rows),
            "drafts": len(draft_rows),
        },
    }
