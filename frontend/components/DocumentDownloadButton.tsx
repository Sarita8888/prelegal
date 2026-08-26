"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { DocumentPdfDocument } from "./documents/DocumentPdfDocument";

export function DocumentDownloadButton({
  documentType,
  documentName,
  data,
  isComplete,
}: {
  documentType: string;
  documentName: string;
  data: Record<string, string | null | undefined>;
  isComplete: boolean;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);
    setError(false);
    try {
      const blob = await pdf(
        <DocumentPdfDocument documentType={documentType} documentName={documentName} data={data} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${documentName.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={!isComplete || isGenerating}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isGenerating ? "Generating PDF…" : "Download PDF"}
      </button>
      {!isComplete && (
        <p className="mt-2 text-xs text-slate-500">
          Fill in all required fields (*) to enable download.
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-600">
          Something went wrong generating the PDF. Please try again.
        </p>
      )}
    </div>
  );
}
