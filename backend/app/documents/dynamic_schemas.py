from functools import lru_cache
from typing import Literal

from pydantic import BaseModel, create_model

from app.documents.registry import FieldSpec, get_document_schema


def _field_type(field: FieldSpec) -> type:
    if field.kind == "enum" and field.options:
        return Literal[tuple(field.options)] | None  # type: ignore[valid-type]
    return str | None


def _model_name(document_type: str, suffix: str) -> str:
    return f"{suffix}_{document_type.replace('-', '_')}"


@lru_cache
def build_fields_model(document_type: str) -> type[BaseModel]:
    schema = get_document_schema(document_type)
    if schema is None:
        raise ValueError(f"Unknown document type: {document_type}")

    field_definitions = {field.key: (_field_type(field), None) for field in schema.fields}
    return create_model(_model_name(document_type, "Fields"), **field_definitions)  # type: ignore[call-overload]


@lru_cache
def build_chat_turn_model(document_type: str) -> type[BaseModel]:
    fields_model = build_fields_model(document_type)
    return create_model(
        _model_name(document_type, "ChatTurn"),
        reply=(str, ...),
        askedFollowUp=(bool, ...),
        suggestedDocumentType=(str | None, None),
        fields=(fields_model, ...),
    )
