// @vitest-environment node
import { describe, expect, it } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { PDFParse } from "pdf-parse";
import { NdaPdfDocument } from "./NdaPdfDocument";
import { makeCompleteFormData, makeFormData } from "@/lib/testFixtures";

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function renderPdfText(data: Parameters<typeof NdaPdfDocument>[0]["data"]) {
  const stream = await pdf(<NdaPdfDocument data={data} />).toBuffer();
  const buffer = await streamToBuffer(stream);
  expect(buffer.subarray(0, 5).toString("utf-8")).toBe("%PDF-");

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text.replace(/\s+/g, " ");
  } finally {
    await parser.destroy();
  }
}

describe("NdaPdfDocument (real PDF generation)", () => {
  it(
    "produces a valid PDF whose text includes the filled-in cover page and full standard terms",
    async () => {
      const text = await renderPdfText(
        makeCompleteFormData({
          party1Name: "Acme, Inc.",
          party2Name: "Beta Corp.",
          purpose: "Evaluating a potential partnership.",
          mndaTermType: "fixed",
          mndaTermYears: "1",
          confidentialityTermType: "fixed",
          confidentialityTermYears: "1",
        }),
      );

      // Cover page
      expect(text).toContain("Between Acme, Inc. and Beta Corp.");
      expect(text).toContain("Evaluating a potential partnership.");
      expect(text).toContain("August 21, 2026");
      expect(text).toContain("Expires 1 year(s) from the Effective Date.");
      expect(text).toContain(
        "1 year(s) from the Effective Date, but in the case of trade secrets",
      );
      expect(text).toContain("Delaware");
      expect(text).toContain("New Castle, DE");
      expect(text).toContain("Company Acme, Inc. Beta Corp.");

      // Standard Terms
      expect(text).toContain("Standard Terms");
      expect(text).toContain("1. Introduction");
      expect(text).toContain("11. General");
      expect(text).toContain("Disclosing Party");
      expect(text).toContain("Receiving Party");
      expect(text).toContain(
        "Common Paper Mutual Non-Disclosure Agreement, Version 1.0",
      );
    },
    20000,
  );

  it(
    "renders MNDA Modifications only when provided",
    async () => {
      const withoutMods = await renderPdfText(makeCompleteFormData({ modifications: "" }));
      expect(withoutMods).not.toContain("MNDA Modifications");

      const withMods = await renderPdfText(
        makeCompleteFormData({ modifications: "Add a mutual indemnity clause." }),
      );
      expect(withMods).toContain("MNDA Modifications");
      expect(withMods).toContain("Add a mutual indemnity clause.");
    },
    20000,
  );

  it(
    "renders bracketed placeholders for an empty form instead of blank/undefined text",
    async () => {
      const text = await renderPdfText(makeFormData({ party1Name: "", party2Name: "" }));

      expect(text).toContain("Between [Party 1] and [Party 2]");
      expect(text).toContain("[Governing Law not yet provided]");
      expect(text).toContain("[Jurisdiction not yet provided]");
      expect(text).toContain("[Effective Date not yet provided]");
      expect(text).not.toMatch(/undefined/i);
    },
    20000,
  );

  it(
    "reflects the ongoing MNDA term and perpetual confidentiality term choices",
    async () => {
      const text = await renderPdfText(
        makeCompleteFormData({
          mndaTermType: "ongoing",
          confidentialityTermType: "perpetual",
        }),
      );

      expect(text).toContain(
        "Continues until terminated in accordance with the terms of the MNDA.",
      );
      expect(text).toContain("In perpetuity.");
    },
    20000,
  );
});
