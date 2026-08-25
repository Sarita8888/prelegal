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


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class NdaFields(BaseModel):
    """Mirrors frontend NdaFormData field-for-field (including its camelCase
    names) so the JSON contract needs no translation on either side."""

    party1Name: str | None = None
    party2Name: str | None = None
    purpose: str | None = None
    effectiveDate: str | None = None
    mndaTermType: Literal["fixed", "ongoing"] | None = None
    mndaTermYears: str | None = None
    confidentialityTermType: Literal["fixed", "perpetual"] | None = None
    confidentialityTermYears: str | None = None
    governingLaw: str | None = None
    jurisdiction: str | None = None
    modifications: str | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    fields: NdaFields


class ChatTurn(BaseModel):
    """Structured-output schema the LLM call is constrained to."""

    reply: str
    fields: NdaFields


class ChatResponse(BaseModel):
    reply: str
    fields: NdaFields
    is_complete: bool
