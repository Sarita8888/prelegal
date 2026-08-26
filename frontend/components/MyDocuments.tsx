"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { formatSavedAt, listDocuments, SavedDocument } from "@/lib/documents";

export function MyDocuments({
  onOpen,
  onBack,
}: {
  onOpen: (document: SavedDocument) => void;
  onBack: () => void;
}) {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<SavedDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listDocuments(token)
      .then(setDocuments)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load your documents."));
  }, [token]);

  return (
    <div className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-brand-navy">My Documents</h1>
          <button type="button" onClick={onBack} className="text-sm font-medium text-brand-blue hover:underline">
            New document
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">Documents you&apos;ve saved, ready to reopen or download again.</p>

        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
        {!documents && !error && <p className="mt-6 text-sm text-slate-400">Loading…</p>}
        {documents?.length === 0 && (
          <p className="mt-6 text-sm text-slate-500">
            You haven&apos;t saved any documents yet. Finish a document and select &quot;Save to My
            Documents&quot;.
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {documents?.map((document) => (
            <li key={document.id}>
              <button
                type="button"
                onClick={() => onOpen(document)}
                className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-[#209dd7] hover:shadow-md"
              >
                <div className="font-medium text-slate-900">{document.document_name}</div>
                <div className="mt-1 text-xs text-slate-500">Saved {formatSavedAt(document.created_at)}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
