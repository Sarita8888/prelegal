from app.nda_chat import is_complete
from app.schemas import NdaFields


def test_is_complete_false_when_missing_required_field():
    fields = NdaFields(party1Name="Acme, Inc.")
    assert is_complete(fields) is False


def test_is_complete_false_when_required_field_is_blank():
    fields = NdaFields(
        party1Name="Acme, Inc.",
        party2Name="Beta Corp.",
        purpose="Evaluating a deal.",
        effectiveDate="2026-08-26",
        governingLaw="Delaware",
        jurisdiction="   ",
    )
    assert is_complete(fields) is False


def test_is_complete_true_when_all_required_fields_present():
    fields = NdaFields(
        party1Name="Acme, Inc.",
        party2Name="Beta Corp.",
        purpose="Evaluating a deal.",
        effectiveDate="2026-08-26",
        governingLaw="Delaware",
        jurisdiction="New Castle, DE",
    )
    assert is_complete(fields) is True
