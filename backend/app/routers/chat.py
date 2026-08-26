from fastapi import APIRouter, HTTPException, status
from pydantic import ValidationError

from app.documents import chat_engine
from app.documents.dynamic_schemas import build_fields_model
from app.documents.registry import all_document_types
from app.schemas import ChatRequest, ChatResponse

router = APIRouter(tags=["chat"])

LLM_UNAVAILABLE_DETAIL = "The AI assistant is temporarily unavailable. Please try again."


@router.post("/chat")
def chat(payload: ChatRequest) -> ChatResponse:
    if payload.document_type not in all_document_types():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"Unknown document type: {payload.document_type}")
    if not payload.messages or payload.messages[-1].role != "user":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="The last message must be from the user.")

    fields_model = build_fields_model(payload.document_type)
    try:
        known_fields = fields_model.model_validate(payload.fields)
    except ValidationError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid fields for this document type.") from exc

    try:
        turn = chat_engine.run_chat_turn(payload.document_type, payload.messages, known_fields)
    except Exception as exc:
        # Covers network errors, provider errors, and malformed structured
        # output from the LLM call — all surface the same way to the client.
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=LLM_UNAVAILABLE_DETAIL) from exc

    return ChatResponse(
        reply=turn.reply,
        fields=turn.fields.model_dump(),
        is_complete=chat_engine.is_complete(payload.document_type, turn.fields),
        suggested_document_type=turn.suggestedDocumentType,
    )
