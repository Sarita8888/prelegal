from datetime import date

from litellm import completion

from app.schemas import ChatMessage, ChatTurn, NdaFields

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

REQUIRED_FIELDS: tuple[str, ...] = (
    "party1Name",
    "party2Name",
    "purpose",
    "effectiveDate",
    "governingLaw",
    "jurisdiction",
)

SYSTEM_PROMPT_TEMPLATE = """You are a friendly legal assistant helping a user fill out a Common Paper \
Mutual Non-Disclosure Agreement (Mutual NDA) cover page. Have a natural, freeform conversation: ask about \
whichever fields are still missing, one or two at a time, and confirm anything ambiguous. Do not ask about \
fields that are already known unless the user's latest message suggests they want to change one. Once every \
required field is filled in, tell the user their NDA is ready to download.

Today's date is {today}, for resolving relative dates like "today" or "next Monday".

The fields you must collect are:
- party1Name, party2Name: the legal/company names of the two parties.
- purpose: how the confidential information may be used (default suggestion if the user has none in mind: \
"Evaluating whether to enter into a business relationship with the other party.").
- effectiveDate: the MNDA's effective date, formatted as YYYY-MM-DD.
- mndaTermType: "fixed" (expires N years from the effective date) or "ongoing" (continues until terminated). \
If "fixed", also set mndaTermYears (a whole number, as a string, e.g. "1").
- confidentialityTermType: "fixed" (protected for N years from the effective date) or "perpetual". If "fixed", \
also set confidentialityTermYears (a whole number, as a string).
- governingLaw: the US state whose law governs the agreement.
- jurisdiction: the city/county and state where disputes are litigated.
- modifications: optional free-text list of any modifications to the standard terms; leave null if the user \
has none.

Known field values so far (JSON, null means not yet known):
{known_fields}

Respond with:
- reply: your next conversational message to the user.
- fields: the COMPLETE current best-known value for every field above — carry forward every value already \
known unless the user's latest message changes it. Never null out a field the user already gave you.
"""


def build_messages(history: list[ChatMessage], known_fields: NdaFields) -> list[dict[str, str]]:
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        today=date.today().isoformat(),
        known_fields=known_fields.model_dump_json(),
    )
    return [{"role": "system", "content": system_prompt}] + [
        {"role": message.role, "content": message.content} for message in history
    ]


def run_chat_turn(history: list[ChatMessage], known_fields: NdaFields) -> ChatTurn:
    response = completion(
        model=MODEL,
        messages=build_messages(history, known_fields),
        response_format=ChatTurn,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    result = response.choices[0].message.content
    return ChatTurn.model_validate_json(result)


def is_complete(fields: NdaFields) -> bool:
    return all((getattr(fields, field) or "").strip() for field in REQUIRED_FIELDS)
