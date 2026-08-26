"use client";

import { DocumentDownloadButton } from "@/components/DocumentDownloadButton";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { NdaPreview } from "@/components/NdaPreview";
import { SavedDocument } from "@/lib/documents";
import { DEFAULT_FORM_DATA, NdaFormData } from "@/lib/types";

export function SavedDocumentView({ document, onBack }: { document: SavedDocument; onBack: () => void }) {
  const isNda = document.document_type === "mutual-nda";
  const ndaData: NdaFormData = { ...DEFAULT_FORM_DATA, ...(document.fields as Partial<NdaFormData>) };

  return (
    <div className="flex-1 bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-xl font-semibold text-brand-navy">{document.document_name}</h1>
            <p className="mt-1 text-sm text-slate-500">Saved document — download it again below.</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 text-sm font-medium text-brand-blue hover:underline"
          >
            Back to My Documents
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          {isNda ? (
            <DownloadPdfButton data={ndaData} isComplete />
          ) : (
            <DocumentDownloadButton
              documentType={document.document_type}
              documentName={document.document_name}
              data={document.fields}
              isComplete
            />
          )}
        </div>
        {isNda ? (
          <NdaPreview data={ndaData} />
        ) : (
          <DocumentPreview
            documentType={document.document_type}
            documentName={document.document_name}
            data={document.fields}
          />
        )}
      </main>
    </div>
  );
}
