"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { NdaPreview } from "@/components/NdaPreview";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { DocumentDownloadButton } from "@/components/DocumentDownloadButton";
import { fetchCatalog, uniqueByDocumentType } from "@/lib/catalog";
import { useAuth } from "@/lib/AuthContext";
import { saveDocument } from "@/lib/documents";
import { DEFAULT_FORM_DATA, NdaFormData } from "@/lib/types";

export function DocumentWorkspace({
  documentType,
  documentName,
  onSwitchDocumentType,
  onBackToPicker,
  onRequestSignIn,
}: {
  documentType: string;
  documentName: string;
  onSwitchDocumentType: (documentType: string, documentName: string) => void;
  onBackToPicker: () => void;
  onRequestSignIn: () => void;
}) {
  const { token } = useAuth();
  const [chatFields, setChatFields] = useState<Record<string, string | null | undefined>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [suggestedDocumentType, setSuggestedDocumentType] = useState<string | null>(null);
  const [documentNamesByType, setDocumentNamesByType] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetchCatalog()
      .then((all) => {
        const names: Record<string, string> = {};
        for (const entry of uniqueByDocumentType(all)) {
          names[entry.documentType] = entry.name;
        }
        setDocumentNamesByType(names);
      })
      .catch(() => {
        // The suggestion banner just falls back to the raw slug if this fails.
      });
  }, []);

  // Starting a new document type means starting over — none of the previous
  // document's fields or completeness state should carry across.
  useEffect(() => {
    setChatFields({});
    setIsComplete(false);
    setSuggestedDocumentType(null);
  }, [documentType]);

  // Once fields change again after a save, the saved snapshot is stale.
  useEffect(() => {
    setSaveState("idle");
  }, [chatFields]);

  function handleFieldsChange(patch: Record<string, string>) {
    setChatFields((prev) => ({ ...prev, ...patch }));
  }

  async function handleSave() {
    if (!token) return;
    setSaveState("saving");
    try {
      await saveDocument(token, documentType, chatFields);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  const isNda = documentType === "mutual-nda";
  const ndaData: NdaFormData = { ...DEFAULT_FORM_DATA, ...(chatFields as Partial<NdaFormData>) };

  return (
    <div className="flex-1 bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-xl font-semibold text-[#032147]">{documentName}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Chat with the assistant about your deal and watch the document fill in live.
              Download it as a PDF when you&apos;re ready.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToPicker}
            className="shrink-0 text-sm font-medium text-[#209dd7] hover:underline"
          >
            Choose a different document
          </button>
        </div>
      </header>

      {suggestedDocumentType && (
        <div className="mx-auto mt-4 max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>It sounds like you might want a different document instead.</span>
            <div className="flex gap-3">
              <button
                type="button"
                className="font-medium underline"
                onClick={() =>
                  onSwitchDocumentType(
                    suggestedDocumentType,
                    documentNamesByType[suggestedDocumentType] ?? suggestedDocumentType,
                  )
                }
              >
                Switch document
              </button>
              <button
                type="button"
                className="font-medium underline"
                onClick={() => setSuggestedDocumentType(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[420px_1fr]">
        <div className="flex flex-col">
          <div className="h-[600px]">
            <ChatPanel
              key={documentType}
              documentType={documentType}
              documentName={documentName}
              knownFields={chatFields}
              onFieldsChange={handleFieldsChange}
              onCompleteChange={setIsComplete}
              onSuggestedDocumentType={setSuggestedDocumentType}
            />
          </div>
          <div className="mt-4 mb-8 flex flex-wrap items-center gap-3">
            {isNda ? (
              <DownloadPdfButton data={ndaData} isComplete={isComplete} />
            ) : (
              <DocumentDownloadButton
                documentType={documentType}
                documentName={documentName}
                data={chatFields}
                isComplete={isComplete}
              />
            )}
            {isComplete &&
              (token ? (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveState === "saving"}
                  className="rounded-md border border-brand-purple px-4 py-2 text-sm font-medium text-brand-purple hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saveState === "saving"
                    ? "Saving…"
                    : saveState === "saved"
                      ? "Saved ✓"
                      : "Save to My Documents"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onRequestSignIn}
                  className="text-sm font-medium text-brand-blue hover:underline"
                >
                  Sign in to save this document
                </button>
              ))}
            {saveState === "error" && (
              <p className="text-xs text-red-600">Couldn&apos;t save. Please try again.</p>
            )}
          </div>
        </div>

        {isNda ? (
          <NdaPreview data={ndaData} />
        ) : (
          <DocumentPreview documentType={documentType} documentName={documentName} data={chatFields} />
        )}
      </main>
    </div>
  );
}
