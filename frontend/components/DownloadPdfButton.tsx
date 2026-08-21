"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { NdaPdfDocument } from "./NdaPdfDocument";
import { NdaFormData, isFormComplete } from "@/lib/types";

export function DownloadPdfButton({ data }: { data: NdaFormData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(false);
  const complete = isFormComplete(data);

  async function handleDownload() {
    setIsGenerating(true);
    setError(false);
    try {
      const blob = await pdf(<NdaPdfDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const parties = [data.party1Name, data.party2Name]
        .filter(Boolean)
        .join("-and-");
      link.href = url;
      link.download = `Mutual-NDA${parties ? `-${parties}` : ""}.pdf`;
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
        disabled={!complete || isGenerating}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isGenerating ? "Generating PDF…" : "Download PDF"}
      </button>
      {!complete && (
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
