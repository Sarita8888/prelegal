from types import SimpleNamespace
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.documents.dynamic_schemas import build_chat_turn_model
from app.main import app

DOCUMENT_TYPES = ["mutual-nda", "ai-addendum", "dpa"]


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def _fake_completion_response(turn) -> SimpleNamespace:
    message = SimpleNamespace(content=turn.model_dump_json())
    choice = SimpleNamespace(message=message)
    return SimpleNamespace(choices=[choice])


@pytest.mark.parametrize("document_type", DOCUMENT_TYPES)
def test_chat_returns_reply_and_fields(client, document_type):
    chat_turn_model = build_chat_turn_model(document_type)
    turn = chat_turn_model(reply="Great, who's involved?", askedFollowUp=True, fields={})
    with patch("app.documents.chat_engine.completion", return_value=_fake_completion_response(turn)):
        response = client.post(
            "/api/chat",
            json={
                "document_type": document_type,
                "messages": [{"role": "user", "content": "Let's get started."}],
                "fields": {},
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["reply"] == "Great, who's involved?"
    assert body["is_complete"] is False


def test_chat_marks_mutual_nda_complete_once_required_fields_are_known(client):
    chat_turn_model = build_chat_turn_model("mutual-nda")
    turn = chat_turn_model(
        reply="You're all set, you can download your document now.",
        askedFollowUp=False,
        fields={
            "party1Name": "Acme, Inc.",
            "party2Name": "Beta Corp.",
            "purpose": "Evaluating a business relationship.",
            "effectiveDate": "2026-08-26",
            "governingLaw": "Delaware",
            "jurisdiction": "New Castle, DE",
        },
    )
    with patch("app.documents.chat_engine.completion", return_value=_fake_completion_response(turn)):
        response = client.post(
            "/api/chat",
            json={
                "document_type": "mutual-nda",
                "messages": [{"role": "user", "content": "Jurisdiction is New Castle, DE"}],
                "fields": {"governingLaw": "Delaware"},
            },
        )

    assert response.status_code == 200
    assert response.json()["is_complete"] is True


def test_chat_appends_a_fallback_question_when_incomplete_reply_has_none(client):
    chat_turn_model = build_chat_turn_model("mutual-nda")
    turn = chat_turn_model(
        reply="Thanks, got it.",
        askedFollowUp=False,
        fields={"party1Name": "Acme, Inc."},
    )
    with patch("app.documents.chat_engine.completion", return_value=_fake_completion_response(turn)):
        response = client.post(
            "/api/chat",
            json={
                "document_type": "mutual-nda",
                "messages": [{"role": "user", "content": "The first party is Acme, Inc."}],
                "fields": {},
            },
        )

    assert response.status_code == 200
    assert "?" in response.json()["reply"]


def test_chat_rejects_unknown_document_type(client):
    response = client.post(
        "/api/chat",
        json={
            "document_type": "not-a-real-document",
            "messages": [{"role": "user", "content": "Hello"}],
            "fields": {},
        },
    )
    assert response.status_code == 400


def test_chat_rejects_history_not_ending_in_user_message(client):
    response = client.post(
        "/api/chat",
        json={
            "document_type": "mutual-nda",
            "messages": [{"role": "assistant", "content": "Hi there!"}],
            "fields": {},
        },
    )
    assert response.status_code == 400


def test_chat_returns_bad_gateway_on_llm_failure(client):
    with patch("app.documents.chat_engine.completion", side_effect=RuntimeError("provider down")):
        response = client.post(
            "/api/chat",
            json={
                "document_type": "mutual-nda",
                "messages": [{"role": "user", "content": "Hello"}],
                "fields": {},
            },
        )

    assert response.status_code == 502


def test_chat_validates_payload_shape(client):
    response = client.post("/api/chat", json={"fields": {}})
    assert response.status_code == 422


def test_catalog_endpoint_lists_all_document_types(client):
    response = client.get("/api/catalog")
    assert response.status_code == 200
    document_types = {entry["documentType"] for entry in response.json()}
    assert "mutual-nda" in document_types
    assert "ai-addendum" in document_types
