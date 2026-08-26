import json
import sqlite3

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError

from app.db import get_connection
from app.documents.dynamic_schemas import build_fields_model
from app.documents.registry import all_document_types, display_name
from app.schemas import DocumentOut, SaveDocumentRequest, UserOut
from app.security import get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])


def _row_to_document(row: sqlite3.Row) -> DocumentOut:
    return DocumentOut(
        id=row["id"],
        document_type=row["document_type"],
        document_name=row["document_name"],
        fields=json.loads(row["fields_json"]),
        created_at=row["created_at"],
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def save_document(
    payload: SaveDocumentRequest,
    current_user: UserOut = Depends(get_current_user),
    connection: sqlite3.Connection = Depends(get_connection),
) -> DocumentOut:
    if payload.document_type not in all_document_types():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"Unknown document type: {payload.document_type}")

    fields_model = build_fields_model(payload.document_type)
    try:
        fields = fields_model.model_validate(payload.fields)
    except ValidationError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid fields for this document type.") from exc

    document_name = display_name(payload.document_type)
    fields_json = json.dumps(fields.model_dump())

    cursor = connection.execute(
        "INSERT INTO documents (user_id, document_type, document_name, fields_json) VALUES (?, ?, ?, ?)",
        (current_user.id, payload.document_type, document_name, fields_json),
    )
    connection.commit()

    row = connection.execute("SELECT * FROM documents WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return _row_to_document(row)


@router.get("")
def list_documents(
    current_user: UserOut = Depends(get_current_user),
    connection: sqlite3.Connection = Depends(get_connection),
) -> list[DocumentOut]:
    rows = connection.execute(
        "SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC",
        (current_user.id,),
    ).fetchall()
    return [_row_to_document(row) for row in rows]


@router.get("/{document_id}")
def get_document(
    document_id: int,
    current_user: UserOut = Depends(get_current_user),
    connection: sqlite3.Connection = Depends(get_connection),
) -> DocumentOut:
    row = connection.execute(
        "SELECT * FROM documents WHERE id = ? AND user_id = ?",
        (document_id, current_user.id),
    ).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return _row_to_document(row)
