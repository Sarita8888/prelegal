import sqlite3
from collections.abc import Generator

from app.config import settings


def init_db() -> None:
    """(Re)create the SQLite database file with a fresh schema.

    Called on every app startup so each container run gets a clean database,
    per the project's "temporary database" requirement.
    """
    settings.db_path.parent.mkdir(parents=True, exist_ok=True)
    settings.db_path.unlink(missing_ok=True)

    connection = sqlite3.connect(settings.db_path)
    try:
        connection.execute(
            """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.commit()
    finally:
        connection.close()


def get_connection() -> Generator[sqlite3.Connection, None, None]:
    connection = sqlite3.connect(settings.db_path)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
    finally:
        connection.close()
