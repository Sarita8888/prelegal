import { describe, expect, it } from "vitest";
import { NdaFormData, REQUIRED_FIELDS, isFormComplete } from "./types";
import { makeCompleteFormData } from "./testFixtures";

function withField(field: keyof NdaFormData, value: string): Partial<NdaFormData> {
  return { [field]: value } as Partial<NdaFormData>;
}

describe("isFormComplete", () => {
  it("returns true when every required field is filled in", () => {
    expect(isFormComplete(makeCompleteFormData())).toBe(true);
  });

  it.each(REQUIRED_FIELDS)("returns false when %s is missing", (field) => {
    const data = makeCompleteFormData(withField(field, ""));
    expect(isFormComplete(data)).toBe(false);
  });

  it.each(REQUIRED_FIELDS)(
    "returns false when %s is whitespace-only",
    (field) => {
      const data = makeCompleteFormData(withField(field, "   "));
      expect(isFormComplete(data)).toBe(false);
    },
  );

  it("ignores non-required fields when determining completeness", () => {
    const data = makeCompleteFormData({
      modifications: "",
      mndaTermYears: "",
      confidentialityTermYears: "",
    });
    expect(isFormComplete(data)).toBe(true);
  });
});
