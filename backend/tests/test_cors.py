from fastapi.testclient import TestClient

from app.main import app


def _preflight(origin: str):
    with TestClient(app) as client:
        return client.options(
            "/api/catalog",
            headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
        )


def test_cors_allows_localhost_dev_origin():
    response = _preflight("http://localhost:3000")
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors_allows_vercel_frontend_preview_and_production_origins():
    for origin in [
        "https://frontend-git-pa-6-all-document-types-sara-ab48.vercel.app",
        "https://frontend-sara-ab48.vercel.app",
    ]:
        response = _preflight(origin)
        assert response.status_code == 200, origin
        assert response.headers["access-control-allow-origin"] == origin


def test_cors_rejects_unrelated_origins():
    for origin in [
        "https://evil.example.com",
        "https://frontend-sara-ab48.vercel.app.attacker.com",
    ]:
        response = _preflight(origin)
        assert "access-control-allow-origin" not in response.headers, origin
