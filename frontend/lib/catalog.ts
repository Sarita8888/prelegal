export interface CatalogEntry {
  name: string;
  description: string;
  filename: string;
  documentType: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function fetchCatalog(): Promise<CatalogEntry[]> {
  const response = await fetch(`${API_BASE_URL}/api/catalog`);
  if (!response.ok) {
    throw new Error("Couldn't load the list of supported documents. Please try again.");
  }
  return response.json();
}

export function uniqueByDocumentType(entries: CatalogEntry[]): CatalogEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.documentType)) return false;
    seen.add(entry.documentType);
    return true;
  });
}
