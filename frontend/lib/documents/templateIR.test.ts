import { describe, expect, it } from "vitest";
import { resolveFieldDisplayValue } from "./templateIR";

describe("resolveFieldDisplayValue", () => {
  it("returns the trimmed value when present", () => {
    expect(resolveFieldDisplayValue("customerName", "Customer", { customerName: "  Acme, Inc.  " })).toBe(
      "Acme, Inc.",
    );
  });

  it("returns a bracketed placeholder using the label when missing", () => {
    expect(resolveFieldDisplayValue("customerName", "Customer", {})).toBe("[Customer not yet provided]");
  });

  it("returns a bracketed placeholder when the value is blank or whitespace-only", () => {
    expect(resolveFieldDisplayValue("customerName", "Customer", { customerName: "   " })).toBe(
      "[Customer not yet provided]",
    );
  });
});
