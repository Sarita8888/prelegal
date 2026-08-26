export interface SavedDocument {
  id: number;
  document_type: string;
  document_name: string;
  fields: Record<string, string | null>;
  created_at: string;
}

export class DocumentsRequestError extends Error {}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function saveDocument(
  token: string,
  documentType: string,
  fields: Record<string, string | null | undefined>,
): Promise<SavedDocument> {
  const response = await fetch(`${API_BASE_URL}/api/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ document_type: documentType, fields }),
  });
  if (!response.ok) {
    throw new DocumentsRequestError("Couldn't save the document. Please try again.");
  }
  return response.json();
}

export async function listDocuments(token: string): Promise<SavedDocument[]> {
  const response = await fetch(`${API_BASE_URL}/api/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new DocumentsRequestError("Couldn't load your documents. Please try again.");
  }
  return response.json();
}

// SQLite's CURRENT_TIMESTAMP is UTC but has no "Z"/offset, so browsers would
// otherwise parse it as local time.
export function formatSavedAt(createdAt: string): string {
  return new Date(`${createdAt.replace(" ", "T")}Z`).toLocaleString();
}
