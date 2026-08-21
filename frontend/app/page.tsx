"use client";

import { useState } from "react";
import { NdaForm } from "@/components/NdaForm";
import { NdaPreview } from "@/components/NdaPreview";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { DEFAULT_FORM_DATA, NdaFormData } from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<NdaFormData>(DEFAULT_FORM_DATA);

  function handleChange(patch: Partial<NdaFormData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-xl font-semibold text-slate-900">
            Mutual NDA Creator
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Fill in the deal-specific terms below and see the Common Paper
            Mutual NDA filled in live. Download the completed document as a
            PDF when you&apos;re ready.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[420px_1fr]">
        <div>
          <NdaForm data={data} onChange={handleChange} />
          <div className="mt-4 mb-8">
            <DownloadPdfButton data={data} />
          </div>
        </div>

        <NdaPreview data={data} />
      </main>
    </div>
  );
}
