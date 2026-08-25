"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { NdaPreview } from "@/components/NdaPreview";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { DEFAULT_FORM_DATA, NdaFormData } from "@/lib/types";

export default function Home() {
  // Only fields the chat has actually confirmed — kept separate from
  // DEFAULT_FORM_DATA's UI placeholder values so those placeholders are never
  // sent to the backend as if the user had already confirmed them.
  const [chatFields, setChatFields] = useState<Partial<NdaFormData>>({});
  const data: NdaFormData = { ...DEFAULT_FORM_DATA, ...chatFields };

  function handleFieldsChange(patch: Partial<NdaFormData>) {
    setChatFields((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-xl font-semibold text-[#032147]">
            Mutual NDA Creator
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Chat with the assistant about your deal and watch the Common
            Paper Mutual NDA fill in live. Download the completed document
            as a PDF when you&apos;re ready.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[420px_1fr]">
        <div className="flex flex-col">
          <div className="h-[600px]">
            <ChatPanel knownFields={chatFields} onFieldsChange={handleFieldsChange} />
          </div>
          <div className="mt-4 mb-8">
            <DownloadPdfButton data={data} />
          </div>
        </div>

        <NdaPreview data={data} />
      </main>
    </div>
  );
}
