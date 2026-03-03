"""Gmail API client wrapper.

Handles OAuth token management and provides methods for:
- Listing messages
- Getting message details
- Fetching history (incremental sync)
- Creating and sending drafts
- Managing labels
"""

import base64
import logging
from email.mime.text import MIMEText
from typing import Any

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from core.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

log = logging.getLogger("chief.gmail")


def _build_service(access_token: str, refresh_token: str | None = None):
    """Build an authenticated Gmail API service."""
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        token_uri="https://oauth2.googleapis.com/token",
    )
    return build("gmail", "v1", credentials=creds, cache_discovery=False)


async def get_messages(
    access_token: str,
    refresh_token: str | None = None,
    max_results: int = 100,
    label_ids: list[str] | None = None,
) -> list[dict]:
    """List messages from the user's inbox.

    Returns list of {id, threadId} dicts.
    """
    service = _build_service(access_token, refresh_token)
    query_params: dict[str, Any] = {
        "userId": "me",
        "maxResults": max_results,
    }
    if label_ids:
        query_params["labelIds"] = label_ids

    result = service.users().messages().list(**query_params).execute()
    return result.get("messages", [])


async def get_message_detail(
    access_token: str,
    message_id: str,
    refresh_token: str | None = None,
) -> dict:
    """Get full message details including headers and body.

    Returns parsed dict with: id, threadId, from, to, subject, body, received_at, labels.
    """
    service = _build_service(access_token, refresh_token)
    msg = service.users().messages().get(
        userId="me", id=message_id, format="full"
    ).execute()

    headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}

    body = _extract_body(msg.get("payload", {}))

    return {
        "id": msg["id"],
        "threadId": msg.get("threadId", ""),
        "from": headers.get("from", ""),
        "to": headers.get("to", ""),
        "subject": headers.get("subject", ""),
        "body": body,
        "received_at": headers.get("date", ""),
        "labels": msg.get("labelIds", []),
        "historyId": msg.get("historyId", ""),
    }


def _extract_body(payload: dict) -> str:
    """Extract text body from Gmail message payload."""
    if payload.get("mimeType") == "text/plain" and payload.get("body", {}).get("data"):
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="replace")

    for part in payload.get("parts", []):
        if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
            return base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="replace")
        # Recurse into nested parts
        if part.get("parts"):
            result = _extract_body(part)
            if result:
                return result

    return ""


async def get_history(
    access_token: str,
    history_id: str,
    refresh_token: str | None = None,
) -> dict:
    """Get history records since the given historyId.

    Returns {history: [...], historyId: str}.
    """
    service = _build_service(access_token, refresh_token)
    result = service.users().history().list(
        userId="me",
        startHistoryId=history_id,
        historyTypes=["messageAdded"],
        labelId="INBOX",
    ).execute()
    return {
        "history": result.get("history", []),
        "historyId": result.get("historyId", history_id),
    }


async def send_email(
    access_token: str,
    to: str,
    subject: str,
    body: str,
    thread_id: str | None = None,
    refresh_token: str | None = None,
) -> dict:
    """Send an email from the user's Gmail account.

    Returns the sent message metadata.
    """
    service = _build_service(access_token, refresh_token)

    message = MIMEText(body)
    message["to"] = to
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

    send_body: dict[str, Any] = {"raw": raw}
    if thread_id:
        send_body["threadId"] = thread_id

    return service.users().messages().send(userId="me", body=send_body).execute()


async def modify_labels(
    access_token: str,
    message_id: str,
    add_labels: list[str] | None = None,
    remove_labels: list[str] | None = None,
    refresh_token: str | None = None,
) -> dict:
    """Add/remove labels on a message (for archiving, etc.)."""
    service = _build_service(access_token, refresh_token)
    body = {
        "addLabelIds": add_labels or [],
        "removeLabelIds": remove_labels or [],
    }
    return service.users().messages().modify(
        userId="me", id=message_id, body=body
    ).execute()
