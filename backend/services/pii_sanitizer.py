"""PII sanitization service.

Strips personally identifiable information from email content before
any LLM call or Supabase storage. Defense in depth:
  - Phase 1 (MEP): Regex-based PIIGuard — fast, deterministic
  - Phase 2 (Week 4): Presidio NER — catches unstructured PII

Every email body passes through sanitize() before it touches an LLM.
"""

import logging
import os
import re
from dataclasses import dataclass, field

log = logging.getLogger("chief.pii")

# ---------------------------------------------------------------------------
# PII Regex Patterns
# ---------------------------------------------------------------------------
_PII_PATTERNS: dict[str, re.Pattern] = {
    "SSN": re.compile(r"\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b"),
    "CREDIT_CARD": re.compile(r"\b(?:\d{4}[-.\s]?){3}\d{4}\b"),
    "PHONE": re.compile(
        r"(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
    ),
    "EMAIL_ADDRESS": re.compile(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    ),
    "IP_ADDRESS": re.compile(
        r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
    ),
    "IPV6": re.compile(
        r"\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b"
    ),
    "BANK_ACCOUNT": re.compile(
        r"\b\d{8,17}\b"  # Broad — only applied in financial context
    ),
    "ROUTING_NUMBER": re.compile(
        r"\b\d{9}\b"  # ABA routing numbers
    ),
    "PASSPORT": re.compile(
        r"\b[A-Z]{1,2}\d{6,9}\b"
    ),
    "DATE_OF_BIRTH": re.compile(
        r"\b(?:0[1-9]|1[0-2])[/.-](?:0[1-9]|[12]\d|3[01])[/.-](?:19|20)\d{2}\b"
    ),
    "DRIVERS_LICENSE": re.compile(
        r"\b[A-Z]\d{7,14}\b"
    ),
}

# High-confidence patterns (always applied)
_HIGH_CONFIDENCE = {"SSN", "CREDIT_CARD", "EMAIL_ADDRESS", "IP_ADDRESS", "IPV6", "DATE_OF_BIRTH"}

# Context-dependent patterns (only applied near financial keywords)
_FINANCIAL_PATTERNS = {"BANK_ACCOUNT", "ROUTING_NUMBER"}
_FINANCIAL_KEYWORDS = re.compile(
    r"(?i)\b(?:account|routing|wire|transfer|bank|iban|swift|aba)\b"
)


@dataclass
class SanitizedResult:
    """Result of PII sanitization."""
    clean_text: str
    pii_types_found: list[str] = field(default_factory=list)
    finding_count: int = 0
    original_length: int = 0


def sanitize(text: str) -> SanitizedResult:
    """Strip PII from text using regex patterns.

    Args:
        text: Raw text to sanitize.

    Returns:
        SanitizedResult with clean text and metadata about findings.
    """
    if not text:
        return SanitizedResult(clean_text="", original_length=0)

    if not os.getenv("PII_SCAN_ENABLED", "true").lower() in ("true", "1", "yes"):
        return SanitizedResult(clean_text=text, original_length=len(text))

    clean = text
    types_found: set[str] = set()
    total_findings = 0

    has_financial_context = bool(_FINANCIAL_KEYWORDS.search(text))

    for pii_type, pattern in _PII_PATTERNS.items():
        # Skip context-dependent patterns unless context is present
        if pii_type in _FINANCIAL_PATTERNS and not has_financial_context:
            continue

        matches = pattern.findall(clean)
        if matches:
            types_found.add(pii_type)
            total_findings += len(matches)
            clean = pattern.sub(f"[{pii_type}_REDACTED]", clean)

    if total_findings > 0:
        log.info("Sanitized %d PII findings of types: %s", total_findings, types_found)

    return SanitizedResult(
        clean_text=clean,
        pii_types_found=sorted(types_found),
        finding_count=total_findings,
        original_length=len(text),
    )


def sanitize_headers(headers: dict[str, str]) -> dict[str, str]:
    """Sanitize PII from email headers (subject, etc.)."""
    sanitized = {}
    for key, value in headers.items():
        result = sanitize(value)
        sanitized[key] = result.clean_text
    return sanitized
