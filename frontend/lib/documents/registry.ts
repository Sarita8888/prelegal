import { FIELD_SCHEMAS } from "./generated/fieldSchemas.generated";

export interface FieldSpec {
  key: string;
  label: string;
  kind: "text" | "enum";
  options?: readonly string[];
  required: boolean;
  promptHint: string;
}

export interface DocumentSchema {
  templateFiles: readonly string[];
  fields: readonly FieldSpec[];
}

const SCHEMAS = FIELD_SCHEMAS as unknown as Record<string, DocumentSchema>;

export function getDocumentSchema(documentType: string): DocumentSchema | undefined {
  return SCHEMAS[documentType];
}

export function getFieldSpecs(documentType: string): readonly FieldSpec[] {
  return SCHEMAS[documentType]?.fields ?? [];
}

export function getFieldLabel(documentType: string, fieldKey: string): string {
  return getFieldSpecs(documentType).find((field) => field.key === fieldKey)?.label ?? fieldKey;
}
