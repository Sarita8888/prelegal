import sqlite3

from fastapi import APIRouter, Depends, HTTPException, status

from app.db import get_connection
from app.schemas import AuthResponse, SigninRequest, SignupRequest, UserOut
from app.security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, connection: sqlite3.Connection = Depends(get_connection)) -> AuthResponse:
    existing = connection.execute("SELECT id FROM users WHERE email = ?", (payload.email,)).fetchone()
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    cursor = connection.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        (payload.email, hash_password(payload.password)),
    )
    connection.commit()

    row = connection.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
    user = UserOut(id=row["id"], email=row["email"], created_at=row["created_at"])
    return AuthResponse(token=create_access_token(user.id), user=user)


@router.post("/signin")
def signin(payload: SigninRequest, connection: sqlite3.Connection = Depends(get_connection)) -> AuthResponse:
    invalid_credentials = HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    row = connection.execute("SELECT * FROM users WHERE email = ?", (payload.email,)).fetchone()
    if row is None or not verify_password(payload.password, row["password_hash"]):
        raise invalid_credentials

    user = UserOut(id=row["id"], email=row["email"], created_at=row["created_at"])
    return AuthResponse(token=create_access_token(user.id), user=user)


@router.post("/signout", status_code=status.HTTP_204_NO_CONTENT)
def signout() -> None:
    # Sessions are stateless JWTs held by the client, so there is nothing to
    # invalidate server-side; the frontend simply discards the token.
    return None


@router.get("/me")
def get_me(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    return current_user
