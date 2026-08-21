import { DEFAULT_FORM_DATA, NdaFormData } from "./types";

export function makeFormData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return { ...DEFAULT_FORM_DATA, ...overrides };
}

export function makeCompleteFormData(
  overrides: Partial<NdaFormData> = {},
): NdaFormData {
  return makeFormData({
    party1Name: "Acme, Inc.",
    party2Name: "Beta Corp.",
    effectiveDate: "2026-08-21",
    governingLaw: "Delaware",
    jurisdiction: "New Castle, DE",
    ...overrides,
  });
}
