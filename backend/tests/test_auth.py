import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_signup_returns_not_implemented(client):
    response = client.post(
        "/api/auth/signup", json={"email": "a@example.com", "password": "secret123"}
    )
    assert response.status_code == 501


def test_signup_still_validates_payload_shape(client):
    response = client.post(
        "/api/auth/signup", json={"email": "not-an-email", "password": "secret123"}
    )
    assert response.status_code == 422


def test_signin_returns_not_implemented(client):
    response = client.post(
        "/api/auth/signin", json={"email": "a@example.com", "password": "secret123"}
    )
    assert response.status_code == 501


def test_signout_returns_not_implemented(client):
    response = client.post("/api/auth/signout")
    assert response.status_code == 501


def test_me_returns_not_implemented(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 501
