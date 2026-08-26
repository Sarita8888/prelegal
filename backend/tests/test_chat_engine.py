import pytest

from app.documents.chat_engine import _fallback_follow_up, build_system_prompt, is_complete
from app.documents.dynamic_schemas import build_fields_model
from app.documents.registry import all_document_types, get_document_schema, required_field_keys


def _complete_field_values(document_type: str) -> dict[str, str]:
    schema = get_document_schema(document_type)
    return {
        field.key: (field.options[0] if field.options else "some value")
        for field in schema.fields
        if field.required
    }


@pytest.mark.parametrize("document_type", all_document_types())
def test_is_complete_false_when_no_fields_known(document_type):
    fields = build_fields_model(document_type)()
    assert is_complete(document_type, fields) is False


@pytest.mark.parametrize("document_type", all_document_types())
def test_is_complete_true_when_every_required_field_is_filled(document_type):
    fields_model = build_fields_model(document_type)
    fields = fields_model.model_validate(_complete_field_values(document_type))
    assert is_complete(document_type, fields) is True


def test_is_complete_false_when_required_field_is_blank():
    fields_model = build_fields_model("mutual-nda")
    values = _complete_field_values("mutual-nda")
    values["jurisdiction"] = "   "
    fields = fields_model.model_validate(values)
    assert is_complete("mutual-nda", fields) is False


def test_mutual_nda_required_fields_match_previous_behavior():
    assert set(required_field_keys("mutual-nda")) == {
        "party1Name",
        "party2Name",
        "purpose",
        "effectiveDate",
        "governingLaw",
        "jurisdiction",
    }


@pytest.mark.parametrize("document_type", all_document_types())
def test_fallback_follow_up_mentions_first_missing_required_field(document_type):
    fields = build_fields_model(document_type)()
    follow_up = _fallback_follow_up(document_type, fields)
    required = required_field_keys(document_type)
    if required:
        assert follow_up is not None
        assert "?" in follow_up
    else:
        assert follow_up is None


@pytest.mark.parametrize("document_type", all_document_types())
def test_fallback_follow_up_is_none_once_complete(document_type):
    fields_model = build_fields_model(document_type)
    fields = fields_model.model_validate(_complete_field_values(document_type))
    assert _fallback_follow_up(document_type, fields) is None


@pytest.mark.parametrize("document_type", all_document_types())
def test_build_system_prompt_includes_every_field_key(document_type):
    fields = build_fields_model(document_type)()
    prompt = build_system_prompt(document_type, fields)
    for key in build_fields_model(document_type).model_fields:
        assert key in prompt
