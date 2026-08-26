import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # env_file lets `uv run` pick up the root .env for local (non-Docker) dev;
    # in Docker, docker-compose's env_file already injects the real env vars.
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    db_path: Path = Path("./data/app.db")
    static_dir: Path = Path("./static")
    openrouter_api_key: str = ""
    catalog_path: Path = Path("../catalog.json")
    field_schemas_path: Path = Path("../field-schemas.json")


settings = Settings()

# pydantic-settings' env_file only populates this Settings object, it does not
# put the value into os.environ. litellm reads OPENROUTER_API_KEY directly
# from the environment, so export it explicitly for local (non-Docker) dev.
if settings.openrouter_api_key:
    os.environ.setdefault("OPENROUTER_API_KEY", settings.openrouter_api_key)
