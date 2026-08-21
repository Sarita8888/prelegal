import {
  STANDARD_TERMS_ATTRIBUTION,
  STANDARD_TERMS_SECTIONS,
  formatDisplayDate,
  formatConfidentialityTerm,
  formatMndaTerm,
  resolveCoverPageValues,
} from "@/lib/ndaContent";
import { NdaFormData } from "@/lib/types";
import { TermsParagraph } from "./TermsParagraph";

export function NdaPreview({ data }: { data: NdaFormData }) {
  const refValues = resolveCoverPageValues(data);
  const party1 = data.party1Name.trim() || "[Party 1]";
  const party2 = data.party2Name.trim() || "[Party 2]";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <header className="mb-6 border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Mutual Non-Disclosure Agreement
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Between {party1} and {party2}
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Cover Page</h2>

        <CoverField label="Purpose" hint="How Confidential Information may be used">
          {refValues.purpose}
        </CoverField>

        <CoverField label="Effective Date">{refValues.effectiveDate}</CoverField>

        <CoverField label="MNDA Term" hint="The length of this MNDA">
          {formatMndaTerm(data)}
        </CoverField>

        <CoverField
          label="Term of Confidentiality"
          hint="How long Confidential Information is protected"
        >
          {formatConfidentialityTerm(data)}
        </CoverField>

        <CoverField label="Governing Law">{refValues.governingLaw}</CoverField>
        <CoverField label="Jurisdiction">{refValues.jurisdiction}</CoverField>

        {data.modifications.trim() && (
          <CoverField label="MNDA Modifications">
            {data.modifications}
          </CoverField>
        )}

        <p className="mt-4 text-sm text-slate-600">
          By signing this Cover Page, each party agrees to enter into this MNDA
          as of the Effective Date ({formatDisplayDate(data.effectiveDate)}).
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-slate-200 bg-slate-50 p-2 text-left" />
                <th className="border border-slate-200 bg-slate-50 p-2 text-left font-medium">
                  Party 1
                </th>
                <th className="border border-slate-200 bg-slate-50 p-2 text-left font-medium">
                  Party 2
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Signature", value: "", value2: "" },
                { label: "Print Name", value: "", value2: "" },
                { label: "Title", value: "", value2: "" },
                { label: "Company", value: party1, value2: party2 },
                { label: "Notice Address", value: "", value2: "" },
                { label: "Date", value: "", value2: "" },
              ].map((row) => (
                <tr key={row.label}>
                  <td className="border border-slate-200 p-2 font-medium text-slate-600">
                    {row.label}
                  </td>
                  <td className="border border-slate-200 p-2 text-slate-800">
                    {row.value}
                  </td>
                  <td className="border border-slate-200 p-2 text-slate-800">
                    {row.value2}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Standard Terms
        </h2>
        {STANDARD_TERMS_SECTIONS.map((template, index) => (
          <TermsParagraph key={index} template={template} refValues={refValues} />
        ))}
        <p className="mt-6 text-xs text-slate-400">{STANDARD_TERMS_ATTRIBUTION}</p>
      </section>
    </article>
  );
}

function CoverField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      {hint && <div className="text-xs text-slate-400">{hint}</div>}
      <div className="mt-0.5 rounded bg-amber-50 px-2 py-1 text-sm text-slate-900">
        {children}
      </div>
    </div>
  );
}
