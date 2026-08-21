import { describe, expect, it } from "vitest";
import {
  REF_LABELS,
  STANDARD_TERMS_SECTIONS,
  formatConfidentialityTerm,
  formatDisplayDate,
  formatMndaTerm,
  resolveCoverPageValues,
  tokenize,
} from "./ndaContent";
import { makeFormData } from "./testFixtures";

describe("tokenize", () => {
  it("returns a single text part for plain text with no tokens", () => {
    expect(tokenize("hello world")).toEqual([
      { kind: "text", text: "hello world" },
    ]);
  });

  it("returns an empty array for an empty string", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("parses a bold token", () => {
    expect(tokenize("**Disclosing Party**")).toEqual([
      { kind: "bold", text: "Disclosing Party" },
    ]);
  });

  it("parses a ref token with the correct label", () => {
    expect(tokenize("{{purpose}}")).toEqual([
      { kind: "ref", key: "purpose", label: "Purpose" },
    ]);
  });

  it("resolves the correct label for every known ref key", () => {
    for (const [key, label] of Object.entries(REF_LABELS)) {
      expect(tokenize(`{{${key}}}`)).toEqual([
        { kind: "ref", key, label },
      ]);
    }
  });

  it("preserves surrounding plain text around a single token", () => {
    expect(tokenize("before **bold** after")).toEqual([
      { kind: "text", text: "before " },
      { kind: "bold", text: "bold" },
      { kind: "text", text: " after" },
    ]);
  });

  it("handles multiple bold tokens without greedily spanning across them", () => {
    expect(tokenize("**A** and **B**")).toEqual([
      { kind: "bold", text: "A" },
      { kind: "text", text: " and " },
      { kind: "bold", text: "B" },
    ]);
  });

  it("handles adjacent tokens with no text in between", () => {
    expect(tokenize("**A**{{purpose}}")).toEqual([
      { kind: "bold", text: "A" },
      { kind: "ref", key: "purpose", label: "Purpose" },
    ]);
  });

  it("handles a mix of text, bold, and ref tokens in one string", () => {
    expect(
      tokenize("The **Receiving Party** shall use it for the {{purpose}}."),
    ).toEqual([
      { kind: "text", text: "The " },
      { kind: "bold", text: "Receiving Party" },
      { kind: "text", text: " shall use it for the " },
      { kind: "ref", key: "purpose", label: "Purpose" },
      { kind: "text", text: "." },
    ]);
  });

  it("does not treat single-brace or single-asterisk text as a token", () => {
    expect(tokenize("{purpose} and *bold*")).toEqual([
      { kind: "text", text: "{purpose} and *bold*" },
    ]);
  });

  it("tokenizes every Standard Terms section without throwing", () => {
    for (const section of STANDARD_TERMS_SECTIONS) {
      expect(() => tokenize(section)).not.toThrow();
      expect(tokenize(section).length).toBeGreaterThan(0);
    }
  });
});

describe("formatDisplayDate", () => {
  it("returns a placeholder for an empty string", () => {
    expect(formatDisplayDate("")).toBe("[Effective Date not yet provided]");
  });

  it("returns a placeholder for an unparseable string", () => {
    expect(formatDisplayDate("not-a-date")).toBe(
      "[Effective Date not yet provided]",
    );
  });

  it("formats a valid ISO date as a long-form US date", () => {
    expect(formatDisplayDate("2026-08-21")).toBe("August 21, 2026");
  });

  it("formats the first day of a month correctly", () => {
    expect(formatDisplayDate("2026-01-01")).toBe("January 1, 2026");
  });

  it("formats a leap-year date correctly", () => {
    expect(formatDisplayDate("2024-02-29")).toBe("February 29, 2024");
  });
});

describe("formatMndaTerm", () => {
  it("returns the ongoing sentence when mndaTermType is 'ongoing', ignoring years", () => {
    const data = makeFormData({ mndaTermType: "ongoing", mndaTermYears: "5" });
    expect(formatMndaTerm(data)).toBe(
      "Continues until terminated in accordance with the terms of the MNDA.",
    );
  });

  it("returns the expiry sentence with the given year count when fixed", () => {
    const data = makeFormData({ mndaTermType: "fixed", mndaTermYears: "3" });
    expect(formatMndaTerm(data)).toBe(
      "Expires 3 year(s) from the Effective Date.",
    );
  });

  it("falls back to a blank placeholder when years is empty", () => {
    const data = makeFormData({ mndaTermType: "fixed", mndaTermYears: "" });
    expect(formatMndaTerm(data)).toBe("Expires [ ] year(s) from the Effective Date.");
  });

  it("falls back to a blank placeholder when years is whitespace-only", () => {
    const data = makeFormData({ mndaTermType: "fixed", mndaTermYears: "   " });
    expect(formatMndaTerm(data)).toBe("Expires [ ] year(s) from the Effective Date.");
  });

  it("trims surrounding whitespace from a provided year value", () => {
    const data = makeFormData({ mndaTermType: "fixed", mndaTermYears: "  2  " });
    expect(formatMndaTerm(data)).toBe("Expires 2 year(s) from the Effective Date.");
  });
});

describe("formatConfidentialityTerm", () => {
  it("returns the perpetuity sentence when perpetual, ignoring years", () => {
    const data = makeFormData({
      confidentialityTermType: "perpetual",
      confidentialityTermYears: "5",
    });
    expect(formatConfidentialityTerm(data)).toBe("In perpetuity.");
  });

  it("returns the fixed-term sentence with the given year count", () => {
    const data = makeFormData({
      confidentialityTermType: "fixed",
      confidentialityTermYears: "2",
    });
    expect(formatConfidentialityTerm(data)).toBe(
      "2 year(s) from the Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.",
    );
  });

  it("falls back to a blank placeholder when years is empty", () => {
    const data = makeFormData({
      confidentialityTermType: "fixed",
      confidentialityTermYears: "",
    });
    expect(formatConfidentialityTerm(data)).toBe(
      "[ ] year(s) from the Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.",
    );
  });
});

describe("resolveCoverPageValues", () => {
  it("resolves every field to its provided value when fully filled in", () => {
    const data = makeFormData({
      purpose: "Evaluating a partnership.",
      effectiveDate: "2026-08-21",
      mndaTermType: "fixed",
      mndaTermYears: "1",
      confidentialityTermType: "fixed",
      confidentialityTermYears: "1",
      governingLaw: "Delaware",
      jurisdiction: "New Castle, DE",
    });

    expect(resolveCoverPageValues(data)).toEqual({
      purpose: "Evaluating a partnership.",
      effectiveDate: "August 21, 2026",
      mndaTerm: "Expires 1 year(s) from the Effective Date.",
      confidentialityTerm:
        "1 year(s) from the Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.",
      governingLaw: "Delaware",
      jurisdiction: "New Castle, DE",
    });
  });

  it("falls back to placeholders for purpose, governing law, and jurisdiction when blank", () => {
    const data = makeFormData({
      purpose: "",
      governingLaw: "",
      jurisdiction: "",
    });

    const resolved = resolveCoverPageValues(data);
    expect(resolved.purpose).toBe("[Purpose not yet provided]");
    expect(resolved.governingLaw).toBe("[Governing Law not yet provided]");
    expect(resolved.jurisdiction).toBe("[Jurisdiction not yet provided]");
  });

  it("treats whitespace-only purpose, governing law, and jurisdiction as blank", () => {
    const data = makeFormData({
      purpose: "   ",
      governingLaw: "  ",
      jurisdiction: "\t",
    });

    const resolved = resolveCoverPageValues(data);
    expect(resolved.purpose).toBe("[Purpose not yet provided]");
    expect(resolved.governingLaw).toBe("[Governing Law not yet provided]");
    expect(resolved.jurisdiction).toBe("[Jurisdiction not yet provided]");
  });

  it("reflects an empty effective date as its own placeholder", () => {
    const data = makeFormData({ effectiveDate: "" });
    expect(resolveCoverPageValues(data).effectiveDate).toBe(
      "[Effective Date not yet provided]",
    );
  });
});
