import { describe, expect, it } from "vitest";
import { DEFAULT_FORM_DATA } from "./types";

describe("DEFAULT_FORM_DATA", () => {
  it("provides sensible UI placeholder defaults", () => {
    expect(DEFAULT_FORM_DATA.mndaTermType).toBe("fixed");
    expect(DEFAULT_FORM_DATA.confidentialityTermType).toBe("fixed");
    expect(DEFAULT_FORM_DATA.party1Name).toBe("");
  });
});
