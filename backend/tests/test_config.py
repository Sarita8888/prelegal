import importlib
import os


def test_openrouter_api_key_from_env_file_is_exported_to_environ(monkeypatch):
    """config.py must put OPENROUTER_API_KEY into os.environ itself, since
    pydantic-settings' env_file only populates the Settings object and litellm
    reads the key straight from the process environment."""
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    from app import config

    importlib.reload(config)
    try:
        if config.settings.openrouter_api_key:
            assert os.environ["OPENROUTER_API_KEY"] == config.settings.openrouter_api_key
        else:
            assert "OPENROUTER_API_KEY" not in os.environ
    finally:
        importlib.reload(config)
