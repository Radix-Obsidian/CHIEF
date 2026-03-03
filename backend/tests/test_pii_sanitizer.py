"""Tests for PII sanitization service."""

import os
import pytest

# Ensure PII scanning is enabled for tests
os.environ["PII_SCAN_ENABLED"] = "true"

from services.pii_sanitizer import sanitize, SanitizedResult


class TestPIISanitizer:
    """Test PII pattern detection and redaction."""

    def test_ssn_redaction(self):
        result = sanitize("My SSN is 123-45-6789")
        assert "[SSN_REDACTED]" in result.clean_text
        assert "SSN" in result.pii_types_found
        assert "123-45-6789" not in result.clean_text

    def test_credit_card_redaction(self):
        result = sanitize("Card: 4111-1111-1111-1111")
        assert "[CREDIT_CARD_REDACTED]" in result.clean_text
        assert "CREDIT_CARD" in result.pii_types_found

    def test_phone_redaction(self):
        result = sanitize("Call me at (555) 123-4567")
        assert "[PHONE_REDACTED]" in result.clean_text
        assert "PHONE" in result.pii_types_found

    def test_email_redaction(self):
        result = sanitize("Contact john@example.com for details")
        assert "[EMAIL_ADDRESS_REDACTED]" in result.clean_text
        assert "EMAIL_ADDRESS" in result.pii_types_found

    def test_ip_address_redaction(self):
        result = sanitize("Server at 192.168.1.100")
        assert "[IP_ADDRESS_REDACTED]" in result.clean_text
        assert "IP_ADDRESS" in result.pii_types_found

    def test_dob_redaction(self):
        result = sanitize("DOB: 01/15/1990")
        assert "[DATE_OF_BIRTH_REDACTED]" in result.clean_text
        assert "DATE_OF_BIRTH" in result.pii_types_found

    def test_no_pii(self):
        text = "This is a normal email with no sensitive data."
        result = sanitize(text)
        assert result.clean_text == text
        assert result.pii_types_found == []
        assert result.finding_count == 0

    def test_empty_input(self):
        result = sanitize("")
        assert result.clean_text == ""
        assert result.finding_count == 0

    def test_multiple_pii_types(self):
        text = "SSN: 123-45-6789, Email: test@test.com, Phone: 555-123-4567"
        result = sanitize(text)
        assert result.finding_count >= 3
        assert len(result.pii_types_found) >= 3

    def test_financial_context_required(self):
        """Bank account patterns should only trigger near financial keywords."""
        result_no_context = sanitize("Order number 12345678")
        # Without financial context, generic number shouldn't be flagged as bank account
        assert "BANK_ACCOUNT" not in result_no_context.pii_types_found

        result_with_context = sanitize("Wire to account 12345678 routing number")
        assert "BANK_ACCOUNT" in result_with_context.pii_types_found

    def test_preserves_original_length(self):
        text = "Some text with SSN 123-45-6789 in it"
        result = sanitize(text)
        assert result.original_length == len(text)
