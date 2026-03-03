"""Pydantic request/response models for all API endpoints."""

from datetime import datetime
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class OAuthCallbackRequest(BaseModel):
    code: str
    state: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    user_id: str
    expires_at: datetime


# ---------------------------------------------------------------------------
# Gmail Watch
# ---------------------------------------------------------------------------
class WatchStatusResponse(BaseModel):
    active: bool
    expiry: datetime | None = None
    history_id: str | None = None


# ---------------------------------------------------------------------------
# Emails
# ---------------------------------------------------------------------------
class EmailSummary(BaseModel):
    id: str
    gmail_id: str
    thread_id: str
    from_address: str
    subject: str
    body_preview: str
    importance_score: int
    importance_reason: str | None = None
    has_draft: bool
    received_at: datetime


class EmailFeedResponse(BaseModel):
    emails: list[EmailSummary]
    total: int
    page: int
    per_page: int


# ---------------------------------------------------------------------------
# Drafts
# ---------------------------------------------------------------------------
class DraftResponse(BaseModel):
    id: str
    email_id: str
    thread_id: str
    subject: str
    body: str
    status: str  # pending | approved | rejected | sent | edited
    importance_score: int
    original_from: str
    original_subject: str
    original_preview: str
    confidence: float | None = None
    created_at: datetime


class ApproveRequest(BaseModel):
    approved: bool
    edits: str | None = None


class DraftActionResponse(BaseModel):
    status: str
    draft_id: str | None = None


# ---------------------------------------------------------------------------
# Pending Drafts (for swipe feed)
# ---------------------------------------------------------------------------
class PendingDraft(BaseModel):
    thread_id: str
    draft_subject: str
    draft_body: str
    importance_score: int
    confidence: float | None = None
    original_email: dict = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Users / Settings
# ---------------------------------------------------------------------------
class UserSettings(BaseModel):
    importance_threshold: int = Field(default=5, ge=1, le=10)
    auto_draft: bool = True
    voice_profile: dict = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Pub/Sub Webhook
# ---------------------------------------------------------------------------
class PubSubMessage(BaseModel):
    data: str  # base64 encoded
    messageId: str | None = None
    publishTime: str | None = None


class PubSubPushRequest(BaseModel):
    message: PubSubMessage
    subscription: str | None = None
