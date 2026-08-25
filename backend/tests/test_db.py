import sqlite3

from app.config import settings
from app.db import init_db


def test_init_db_creates_users_table():
    init_db()

    connection = sqlite3.connect(settings.db_path)
    try:
        cursor = connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        assert cursor.fetchone() is not None
    finally:
        connection.close()


def test_init_db_wipes_existing_data():
    init_db()
    connection = sqlite3.connect(settings.db_path)
    connection.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        ("test@example.com", "hash"),
    )
    connection.commit()
    connection.close()

    init_db()

    connection = sqlite3.connect(settings.db_path)
    try:
        cursor = connection.execute("SELECT COUNT(*) FROM users")
        assert cursor.fetchone()[0] == 0
    finally:
        connection.close()
