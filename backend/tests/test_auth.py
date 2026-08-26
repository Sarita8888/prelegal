import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def _signup(client, email="a@example.com", password="secret123"):
    return client.post("/api/auth/signup", json={"email": email, "password": password})


def test_signup_creates_a_user_and_returns_a_token(client):
    response = _signup(client)

    assert response.status_code == 201
    body = response.json()
    assert body["token"]
    assert body["user"]["email"] == "a@example.com"
    assert "password" not in body["user"]


def test_signup_still_validates_payload_shape(client):
    response = _signup(client, email="not-an-email")
    assert response.status_code == 422


def test_signup_rejects_a_duplicate_email(client):
    _signup(client)
    response = _signup(client)
    assert response.status_code == 409


def test_signin_returns_a_token_for_correct_credentials(client):
    _signup(client, password="correct-horse")
    response = client.post("/api/auth/signin", json={"email": "a@example.com", "password": "correct-horse"})

    assert response.status_code == 200
    body = response.json()
    assert body["token"]
    assert body["user"]["email"] == "a@example.com"


def test_signin_rejects_wrong_password(client):
    _signup(client, password="correct-horse")
    response = client.post("/api/auth/signin", json={"email": "a@example.com", "password": "wrong"})
    assert response.status_code == 401


def test_signin_rejects_unknown_email(client):
    response = client.post("/api/auth/signin", json={"email": "nobody@example.com", "password": "whatever"})
    assert response.status_code == 401


def test_signout_succeeds(client):
    response = client.post("/api/auth/signout")
    assert response.status_code == 204


def test_me_requires_a_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_rejects_an_invalid_token(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401


def test_me_returns_the_current_user_for_a_valid_token(client):
    token = _signup(client).json()["token"]
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == "a@example.com"
