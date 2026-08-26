from typing import Literal

from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: str


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class SaveDocumentRequest(BaseModel):
    document_type: str
    fields: dict[str, str | None] = {}


class DocumentOut(BaseModel):
    id: int
    document_type: str
    document_name: str
    fields: dict[str, str | None]
    created_at: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    document_type: str
    messages: list[ChatMessage]
    fields: dict[str, str | None] = {}


class ChatResponse(BaseModel):
    reply: str
    fields: dict[str, str | None]
    is_complete: bool
    suggested_document_type: str | None = None
