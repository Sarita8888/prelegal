"use client";

import { NdaFormData } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelClass = "block text-sm font-medium text-slate-700";
const hintClass = "mt-1 text-xs text-slate-500";
const fieldClass = "mb-5";

export function NdaForm({
  data,
  onChange,
}: {
  data: NdaFormData;
  onChange: (patch: Partial<NdaFormData>) => void;
}) {
  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <fieldset className={fieldClass}>
        <legend className="mb-3 text-sm font-semibold text-slate-900">
          Parties
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="party1Name">
              Party 1 (company name) *
            </label>
            <input
              id="party1Name"
              className={inputClass}
              value={data.party1Name}
              onChange={(e) => onChange({ party1Name: e.target.value })}
              placeholder="Acme, Inc."
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="party2Name">
              Party 2 (company name) *
            </label>
            <input
              id="party2Name"
              className={inputClass}
              value={data.party2Name}
              onChange={(e) => onChange({ party2Name: e.target.value })}
              placeholder="Beta Corp."
              required
            />
          </div>
        </div>
      </fieldset>

      <div className={fieldClass}>
        <label className={labelClass} htmlFor="purpose">
          Purpose *
        </label>
        <p className={hintClass}>How Confidential Information may be used.</p>
        <textarea
          id="purpose"
          className={inputClass}
          rows={2}
          value={data.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          required
        />
      </div>

      <div className={fieldClass}>
        <label className={labelClass} htmlFor="effectiveDate">
          Effective Date *
        </label>
        <input
          id="effectiveDate"
          type="date"
          className={inputClass}
          value={data.effectiveDate}
          onChange={(e) => onChange({ effectiveDate: e.target.value })}
          required
        />
      </div>

      <fieldset className={fieldClass}>
        <legend className={labelClass}>MNDA Term</legend>
        <p className={hintClass}>The length of this MNDA.</p>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="mndaTermType"
              checked={data.mndaTermType === "fixed"}
              onChange={() => onChange({ mndaTermType: "fixed" })}
            />
            Expires
            <input
              type="number"
              min={1}
              className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={data.mndaTermYears}
              onChange={(e) => onChange({ mndaTermYears: e.target.value })}
              disabled={data.mndaTermType !== "fixed"}
            />
            year(s) from Effective Date
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="mndaTermType"
              checked={data.mndaTermType === "ongoing"}
              onChange={() => onChange({ mndaTermType: "ongoing" })}
            />
            Continues until terminated in accordance with the terms of the MNDA
          </label>
        </div>
      </fieldset>

      <fieldset className={fieldClass}>
        <legend className={labelClass}>Term of Confidentiality</legend>
        <p className={hintClass}>How long Confidential Information is protected.</p>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="confidentialityTermType"
              checked={data.confidentialityTermType === "fixed"}
              onChange={() => onChange({ confidentialityTermType: "fixed" })}
            />
            <input
              type="number"
              min={1}
              className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={data.confidentialityTermYears}
              onChange={(e) =>
                onChange({ confidentialityTermYears: e.target.value })
              }
              disabled={data.confidentialityTermType !== "fixed"}
            />
            year(s) from Effective Date (trade secrets excepted)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="confidentialityTermType"
              checked={data.confidentialityTermType === "perpetual"}
              onChange={() => onChange({ confidentialityTermType: "perpetual" })}
            />
            In perpetuity
          </label>
        </div>
      </fieldset>

      <fieldset className={fieldClass}>
        <legend className="mb-3 text-sm font-semibold text-slate-900">
          Governing Law &amp; Jurisdiction
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="governingLaw">
              Governing Law (state) *
            </label>
            <input
              id="governingLaw"
              className={inputClass}
              value={data.governingLaw}
              onChange={(e) => onChange({ governingLaw: e.target.value })}
              placeholder="Delaware"
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jurisdiction">
              Jurisdiction (city/county and state) *
            </label>
            <input
              id="jurisdiction"
              className={inputClass}
              value={data.jurisdiction}
              onChange={(e) => onChange({ jurisdiction: e.target.value })}
              placeholder="New Castle, DE"
              required
            />
          </div>
        </div>
      </fieldset>

      <div className={fieldClass}>
        <label className={labelClass} htmlFor="modifications">
          MNDA Modifications
        </label>
        <p className={hintClass}>
          Optional. List any modifications to the standard MNDA terms.
        </p>
        <textarea
          id="modifications"
          className={inputClass}
          rows={2}
          value={data.modifications}
          onChange={(e) => onChange({ modifications: e.target.value })}
        />
      </div>
    </form>
  );
}
