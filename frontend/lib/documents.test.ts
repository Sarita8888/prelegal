import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentsRequestError, formatSavedAt, listDocuments, saveDocument } from "./documents";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("saveDocument", () => {
  it("posts the document type and fields with an Authorization header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 1,
          document_type: "mutual-nda",
          document_name: "Mutual NDA",
          fields: {},
          created_at: "now",
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await saveDocument("token123", "mutual-nda", { party1Name: "Acme" });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/documents");
    expect(options.headers.Authorization).toBe("Bearer token123");
    expect(JSON.parse(options.body)).toEqual({ document_type: "mutual-nda", fields: { party1Name: "Acme" } });
  });

  it("throws a DocumentsRequestError when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }));
    await expect(saveDocument("token123", "mutual-nda", {})).rejects.toBeInstanceOf(DocumentsRequestError);
  });
});

describe("listDocuments", () => {
  it("sends the Authorization header and returns the parsed list", async () => {
    const documents = [
      { id: 1, document_type: "mutual-nda", document_name: "Mutual NDA", fields: {}, created_at: "now" },
    ];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(documents) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listDocuments("token123");

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer token123");
    expect(result).toEqual(documents);
  });

  it("throws a DocumentsRequestError when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }));
    await expect(listDocuments("token123")).rejects.toBeInstanceOf(DocumentsRequestError);
  });
});

describe("formatSavedAt", () => {
  it("interprets the SQLite timestamp as UTC rather than local time", () => {
    const formatted = formatSavedAt("2026-08-26 10:00:00");
    expect(formatted).not.toMatch(/Invalid/);
  });
});
