from pathlib import Path

from app.documents.registry import all_document_types, get_document_schema, load_catalog

REPO_ROOT = Path(__file__).resolve().parents[2]


def test_every_catalog_document_type_has_a_field_schema():
    document_types = {entry.documentType for entry in load_catalog()}
    assert document_types == set(all_document_types())


def test_every_field_schema_has_at_least_one_catalog_entry():
    catalog_document_types = {entry.documentType for entry in load_catalog()}
    for document_type in all_document_types():
        assert document_type in catalog_document_types


def test_every_template_file_referenced_by_a_schema_exists():
    for document_type in all_document_types():
        schema = get_document_schema(document_type)
        for template_file in schema.templateFiles:
            assert (REPO_ROOT / template_file).is_file(), f"{template_file} missing for {document_type}"


def test_every_field_has_a_unique_key_within_its_document():
    for document_type in all_document_types():
        schema = get_document_schema(document_type)
        keys = [field.key for field in schema.fields]
        assert len(keys) == len(set(keys)), f"duplicate field key in {document_type}"


def test_enum_fields_declare_options():
    for document_type in all_document_types():
        schema = get_document_schema(document_type)
        for field in schema.fields:
            if field.kind == "enum":
                assert field.options, f"{document_type}.{field.key} is an enum but has no options"
