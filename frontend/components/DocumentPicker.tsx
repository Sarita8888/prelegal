"use client";

import { useEffect, useState } from "react";
import { CatalogEntry, fetchCatalog, uniqueByDocumentType } from "@/lib/catalog";

export function DocumentPicker({
  onSelect,
}: {
  onSelect: (documentType: string, documentName: string) => void;
}) {
  const [entries, setEntries] = useState<CatalogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalog()
      .then((all) => setEntries(uniqueByDocumentType(all)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load documents."));
  }, []);

  return (
    <div className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-xl font-semibold text-[#032147]">What would you like to create?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pick a document type to get started. If you don&apos;t see what you need, tell the assistant
          anyway once you&apos;re chatting — it can suggest the closest match.
        </p>

        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
        {!entries && !error && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {entries?.map((entry) => (
            <button
              key={entry.documentType}
              type="button"
              onClick={() => onSelect(entry.documentType, entry.name)}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-[#209dd7] hover:shadow-md"
            >
              <div className="font-medium text-slate-900">{entry.name}</div>
              <div className="mt-1 text-xs text-slate-500">{entry.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
