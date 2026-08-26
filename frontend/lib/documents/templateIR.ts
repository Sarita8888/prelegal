export type InlinePart =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "field"; fieldKey: string; suffix: string };

export interface Block {
  depth: number;
  marker: string;
  parts: InlinePart[];
}

export interface ParsedTemplate {
  title: string;
  blocks: Block[];
}

export function resolveFieldDisplayValue(
  fieldKey: string,
  label: string,
  data: Record<string, string | null | undefined>,
): string {
  const value = data[fieldKey];
  if (value && value.trim()) return value.trim();
  return `[${label} not yet provided]`;
}
