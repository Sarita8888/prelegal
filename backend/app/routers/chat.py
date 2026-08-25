from fastapi import APIRouter, HTTPException, status

from app.nda_chat import is_complete, run_chat_turn
from app.schemas import ChatRequest, ChatResponse

router = APIRouter(tags=["chat"])

LLM_UNAVAILABLE_DETAIL = "The AI assistant is temporarily unavailable. Please try again."


@router.post("/chat")
def chat(payload: ChatRequest) -> ChatResponse:
    if not payload.messages or payload.messages[-1].role != "user":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="The last message must be from the user.")

    try:
        turn = run_chat_turn(payload.messages, payload.fields)
    except Exception as exc:
        # Covers network errors, provider errors, and malformed structured
        # output from the LLM call — all surface the same way to the client.
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=LLM_UNAVAILABLE_DETAIL) from exc

    return ChatResponse(reply=turn.reply, fields=turn.fields, is_complete=is_complete(turn.fields))
