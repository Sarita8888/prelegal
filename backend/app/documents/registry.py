import json
from functools import lru_cache
from typing import Literal

from pydantic import BaseModel

from app.config import settings


class FieldSpec(BaseModel):
    key: str
    label: str
    kind: Literal["text", "enum"] = "text"
    options: list[str] | None = None
    required: bool = False
    promptHint: str = ""


class DocumentSchema(BaseModel):
    templateFiles: list[str]
    fields: list[FieldSpec]


class CatalogEntry(BaseModel):
    name: str
    description: str
    filename: str
    documentType: str


@lru_cache
def load_field_schemas() -> dict[str, DocumentSchema]:
    raw = json.loads(settings.field_schemas_path.read_text(encoding="utf-8"))
    return {document_type: DocumentSchema.model_validate(value) for document_type, value in raw.items()}


@lru_cache
def load_catalog() -> list[CatalogEntry]:
    raw = json.loads(settings.catalog_path.read_text(encoding="utf-8"))
    return [CatalogEntry.model_validate(entry) for entry in raw]


def get_document_schema(document_type: str) -> DocumentSchema | None:
    return load_field_schemas().get(document_type)


def all_document_types() -> tuple[str, ...]:
    return tuple(load_field_schemas().keys())


def required_field_keys(document_type: str) -> tuple[str, ...]:
    schema = get_document_schema(document_type)
    if schema is None:
        return ()
    return tuple(field.key for field in schema.fields if field.required)


def display_name(document_type: str) -> str:
    entries = [entry for entry in load_catalog() if entry.documentType == document_type]
    for entry in entries:
        if "cover page" not in entry.name.lower():
            return entry.name
    return entries[0].name if entries else document_type
