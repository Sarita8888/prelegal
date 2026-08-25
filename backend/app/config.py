from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_path: Path = Path("./data/app.db")
    static_dir: Path = Path("./static")


settings = Settings()
