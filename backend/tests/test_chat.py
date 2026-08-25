from types import SimpleNamespace
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import ChatTurn, NdaFields


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def _fake_completion_response(turn: ChatTurn) -> SimpleNamespace:
    message = SimpleNamespace(content=turn.model_dump_json())
    choice = SimpleNamespace(message=message)
    return SimpleNamespace(choices=[choice])


def test_chat_returns_reply_and_incomplete_fields(client):
    turn = ChatTurn(
        reply="Great, who is the other party?",
        fields=NdaFields(party1Name="Acme, Inc."),
    )
    with patch("app.nda_chat.completion", return_value=_fake_completion_response(turn)):
        response = client.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "The first party is Acme, Inc."}],
                "fields": {},
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["reply"] == "Great, who is the other party?"
    assert body["fields"]["party1Name"] == "Acme, Inc."
    assert body["is_complete"] is False


def test_chat_marks_complete_once_required_fields_are_known(client):
    turn = ChatTurn(
        reply="You're all set, you can download your NDA now.",
        fields=NdaFields(
            party1Name="Acme, Inc.",
            party2Name="Beta Corp.",
            purpose="Evaluating a business relationship.",
            effectiveDate="2026-08-26",
            governingLaw="Delaware",
            jurisdiction="New Castle, DE",
        ),
    )
    with patch("app.nda_chat.completion", return_value=_fake_completion_response(turn)):
        response = client.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "Jurisdiction is New Castle, DE"}],
                "fields": {"governingLaw": "Delaware"},
            },
        )

    assert response.status_code == 200
    assert response.json()["is_complete"] is True


def test_chat_rejects_history_not_ending_in_user_message(client):
    response = client.post(
        "/api/chat",
        json={
            "messages": [{"role": "assistant", "content": "Hi there!"}],
            "fields": {},
        },
    )
    assert response.status_code == 400


def test_chat_returns_bad_gateway_on_llm_failure(client):
    with patch("app.nda_chat.completion", side_effect=RuntimeError("provider down")):
        response = client.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "Hello"}],
                "fields": {},
            },
        )

    assert response.status_code == 502


def test_chat_validates_payload_shape(client):
    response = client.post("/api/chat", json={"fields": {}})
    assert response.status_code == 422
