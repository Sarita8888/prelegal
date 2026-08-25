import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatRequestError, sendChatMessage } from "./chat";
import { makeFormData } from "./testFixtures";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sendChatMessage", () => {
  it("posts the message history and fields, and strips null fields from the result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          reply: "Nice to meet you.",
          fields: { party1Name: "Acme, Inc.", party2Name: null },
          is_complete: false,
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendChatMessage(
      [{ role: "user", content: "Hi" }],
      makeFormData(),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({
      reply: "Nice to meet you.",
      fields: { party1Name: "Acme, Inc." },
      isComplete: false,
    });
  });

  it("throws a ChatRequestError when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }),
    );

    await expect(
      sendChatMessage([{ role: "user", content: "Hi" }], makeFormData()),
    ).rejects.toBeInstanceOf(ChatRequestError);
  });

  it("throws a ChatRequestError when the network request itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    await expect(
      sendChatMessage([{ role: "user", content: "Hi" }], makeFormData()),
    ).rejects.toBeInstanceOf(ChatRequestError);
  });
});
