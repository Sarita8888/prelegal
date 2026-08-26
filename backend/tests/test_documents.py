import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def _auth_headers(client, email="a@example.com", password="secret123"):
    token = client.post("/api/auth/signup", json={"email": email, "password": password}).json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_save_document_requires_authentication(client):
    response = client.post("/api/documents", json={"document_type": "mutual-nda", "fields": {}})
    assert response.status_code == 401


def test_save_document_rejects_unknown_document_type(client):
    headers = _auth_headers(client)
    response = client.post(
        "/api/documents", json={"document_type": "not-a-real-document", "fields": {}}, headers=headers
    )
    assert response.status_code == 400


def test_save_and_list_document(client):
    headers = _auth_headers(client)
    fields = {"party1Name": "Acme, Inc.", "party2Name": "Beta Corp."}

    save_response = client.post(
        "/api/documents", json={"document_type": "mutual-nda", "fields": fields}, headers=headers
    )
    assert save_response.status_code == 201
    saved = save_response.json()
    assert saved["document_type"] == "mutual-nda"
    assert saved["fields"]["party1Name"] == "Acme, Inc."
    assert saved["document_name"]

    list_response = client.get("/api/documents", headers=headers)
    assert list_response.status_code == 200
    documents = list_response.json()
    assert len(documents) == 1
    assert documents[0]["id"] == saved["id"]


def test_get_document_by_id(client):
    headers = _auth_headers(client)
    saved = client.post(
        "/api/documents", json={"document_type": "mutual-nda", "fields": {}}, headers=headers
    ).json()

    response = client.get(f"/api/documents/{saved['id']}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == saved["id"]


def test_get_document_returns_404_for_missing_document(client):
    headers = _auth_headers(client)
    response = client.get("/api/documents/999", headers=headers)
    assert response.status_code == 404


def test_documents_are_scoped_per_user(client):
    owner_headers = _auth_headers(client, email="owner@example.com")
    other_headers = _auth_headers(client, email="other@example.com")

    saved = client.post(
        "/api/documents", json={"document_type": "mutual-nda", "fields": {}}, headers=owner_headers
    ).json()

    other_list = client.get("/api/documents", headers=other_headers)
    assert other_list.json() == []

    other_get = client.get(f"/api/documents/{saved['id']}", headers=other_headers)
    assert other_get.status_code == 404
