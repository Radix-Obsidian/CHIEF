"""Push notification service (stub for MEP).

Week 4 will add:
- Web Push via VAPID keys
- Email fallback via Supabase Edge Function

For now, logs notifications for testing.
"""

import logging

log = logging.getLogger("chief.notifications")


async def send_push(
    user_id: str,
    title: str,
    body: str,
    url: str | None = None,
) -> bool:
    """Send a push notification to the user.

    Args:
        user_id: Supabase user UUID
        title: Notification title
        body: Notification body text
        url: Optional URL to open on tap

    Returns:
        True if notification sent successfully.
    """
    # TODO: Implement Web Push with VAPID keys in Week 4
    log.info("PUSH [%s] %s: %s (url=%s)", user_id, title, body, url)
    return True


async def notify_draft_ready(user_id: str, subject: str, importance: int) -> bool:
    """Send notification that a new draft is ready for review."""
    return await send_push(
        user_id=user_id,
        title=f"Draft Ready (Score: {importance}/10)",
        body=f"Re: {subject}",
        url="/inbox",
    )


async def notify_email_sent(user_id: str, to: str, subject: str) -> bool:
    """Send notification confirming email was sent."""
    return await send_push(
        user_id=user_id,
        title="Email Sent",
        body=f"To: {to} — {subject}",
        url="/history",
    )
