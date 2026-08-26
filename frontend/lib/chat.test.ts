import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatRequestError, sendChatMessage } from "./chat";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sendChatMessage", () => {
  it("posts the document type, message history, and fields, and strips null fields from the result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          reply: "Nice to meet you.",
          fields: { party1Name: "Acme, Inc.", party2Name: null },
          is_complete: false,
          suggested_document_type: null,
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendChatMessage("mutual-nda", [{ role: "user", content: "Hi" }], {});

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({ method: "POST" }),
    );
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      document_type: "mutual-nda",
      messages: [{ role: "user", content: "Hi" }],
      fields: {},
    });
    expect(result).toEqual({
      reply: "Nice to meet you.",
      fields: { party1Name: "Acme, Inc." },
      isComplete: false,
      suggestedDocumentType: null,
    });
  });

  it("passes through a suggested document type when the backend returns one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            reply: "That sounds more like a Cloud Service Agreement.",
            fields: {},
            is_complete: false,
            suggested_document_type: "csa",
          }),
      }),
    );

    const result = await sendChatMessage("mutual-nda", [{ role: "user", content: "Hi" }], {});
    expect(result.suggestedDocumentType).toBe("csa");
  });

  it("throws a ChatRequestError when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }),
    );

    await expect(
      sendChatMessage("mutual-nda", [{ role: "user", content: "Hi" }], {}),
    ).rejects.toBeInstanceOf(ChatRequestError);
  });

  it("throws a ChatRequestError when the network request itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    await expect(
      sendChatMessage("mutual-nda", [{ role: "user", content: "Hi" }], {}),
    ).rejects.toBeInstanceOf(ChatRequestError);
  });
});
