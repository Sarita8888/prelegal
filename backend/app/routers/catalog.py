from fastapi import APIRouter

from app.documents.registry import CatalogEntry, load_catalog

router = APIRouter(tags=["catalog"])


@router.get("/catalog")
def catalog() -> list[CatalogEntry]:
    return load_catalog()
