from datetime import date

from litellm import completion
from pydantic import BaseModel

from app.documents.dynamic_schemas import build_chat_turn_model
from app.documents.registry import all_document_types, display_name, get_document_schema, load_catalog, required_field_keys
from app.schemas import ChatMessage

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT_TEMPLATE = """You are a friendly legal assistant helping a user fill out a Common Paper \
{document_name} cover page / key terms. Have a natural, freeform conversation: ask about whichever fields \
are still missing, one or two at a time, and confirm anything ambiguous. Do not ask about fields that are \
already known unless the user's latest message suggests they want to change one. Once every required field \
is filled in, tell the user their document is ready to download.

Today's date is {today}, for resolving relative dates like "today" or "next Monday".

The fields you must collect are:
{field_lines}

Known field values so far (JSON, null means not yet known):
{known_fields}

If the user's latest message suggests they actually want a different kind of document, choose the closest \
match from this catalog of documents this product can generate and set suggestedDocumentType to its exact \
document type slug (or null if the current document is still the right one):
{catalog_menu}

Respond with:
- reply: your next conversational message to the user. If the document is not yet complete, this MUST end \
with a clarifying question about a missing field.
- askedFollowUp: true if and only if `reply` asks the user a clarifying question.
- suggestedDocumentType: as described above, or null.
- fields: the COMPLETE current best-known value for every field above — carry forward every value already \
known unless the user's latest message changes it. Never null out a field the user already gave you.
"""


def _catalog_menu() -> str:
    seen: set[str] = set()
    lines: list[str] = []
    for entry in load_catalog():
        if entry.documentType in seen:
            continue
        seen.add(entry.documentType)
        lines.append(f"- {entry.documentType}: {entry.name} — {entry.description}")
    return "\n".join(lines)


def build_system_prompt(document_type: str, known_fields: BaseModel) -> str:
    schema = get_document_schema(document_type)
    if schema is None:
        raise ValueError(f"Unknown document type: {document_type}")

    field_lines = "\n".join(
        f"- {field.key}: {field.promptHint}" + (f" Options: {', '.join(field.options)}." if field.options else "")
        for field in schema.fields
    )

    return SYSTEM_PROMPT_TEMPLATE.format(
        document_name=display_name(document_type),
        today=date.today().isoformat(),
        field_lines=field_lines,
        known_fields=known_fields.model_dump_json(),
        catalog_menu=_catalog_menu(),
    )


def build_messages(document_type: str, history: list[ChatMessage], known_fields: BaseModel) -> list[dict[str, str]]:
    system_prompt = build_system_prompt(document_type, known_fields)
    return [{"role": "system", "content": system_prompt}] + [
        {"role": message.role, "content": message.content} for message in history
    ]


def is_complete(document_type: str, fields: BaseModel) -> bool:
    return all((getattr(fields, key, None) or "").strip() for key in required_field_keys(document_type))


def _fallback_follow_up(document_type: str, fields: BaseModel) -> str | None:
    schema = get_document_schema(document_type)
    if schema is None:
        return None
    for field in schema.fields:
        if field.required and not (getattr(fields, field.key, None) or "").strip():
            return f"Also, what's the {field.label}?"
    return None


def run_chat_turn(document_type: str, history: list[ChatMessage], known_fields: BaseModel) -> BaseModel:
    chat_turn_model = build_chat_turn_model(document_type)
    response = completion(
        model=MODEL,
        messages=build_messages(document_type, history, known_fields),
        response_format=chat_turn_model,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    result = response.choices[0].message.content
    turn = chat_turn_model.model_validate_json(result)

    if turn.suggestedDocumentType not in all_document_types() or turn.suggestedDocumentType == document_type:
        turn.suggestedDocumentType = None

    asked_question = turn.askedFollowUp and "?" in turn.reply
    if not is_complete(document_type, turn.fields) and not asked_question:
        follow_up = _fallback_follow_up(document_type, turn.fields)
        if follow_up:
            turn.reply = f"{turn.reply} {follow_up}"

    return turn
