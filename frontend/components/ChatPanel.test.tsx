import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "./ChatPanel";

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderChatPanel(overrides: Partial<React.ComponentProps<typeof ChatPanel>> = {}) {
  return render(
    <ChatPanel
      documentType="mutual-nda"
      documentName="Mutual NDA"
      knownFields={{}}
      onFieldsChange={vi.fn()}
      onCompleteChange={vi.fn()}
      onSuggestedDocumentType={vi.fn()}
      {...overrides}
    />,
  );
}

describe("ChatPanel", () => {
  it("disables the Send button until there is input", () => {
    renderChatPanel();
    expect(screen.getByRole("button", { name: /Send/ })).toBeDisabled();
  });

  it("greets with 'a' before a consonant-sounding document name", () => {
    renderChatPanel({ documentName: "Mutual NDA" });
    expect(screen.getByText(/put together a Mutual NDA\./)).toBeInTheDocument();
  });

  it("greets with 'an' before a vowel-sounding document name", () => {
    renderChatPanel({ documentName: "AI Addendum" });
    expect(screen.getByText(/put together an AI Addendum\./)).toBeInTheDocument();
  });

  it("focuses the message input on mount", () => {
    renderChatPanel();
    expect(screen.getByLabelText(/Your message/)).toHaveFocus();
  });

  it("sends the message with the document type, shows the assistant's reply, and reports extracted fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          reply: "Thanks! What's the purpose of this agreement?",
          fields: { party1Name: "Acme, Inc." },
          is_complete: false,
          suggested_document_type: null,
        }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onFieldsChange = vi.fn();
    const onCompleteChange = vi.fn();

    const user = userEvent.setup();
    renderChatPanel({ onFieldsChange, onCompleteChange });

    await user.type(screen.getByLabelText(/Your message/), "Acme, Inc. is party one.");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    expect(screen.getByText("Acme, Inc. is party one.")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText("Thanks! What's the purpose of this agreement?"),
      ).toBeInTheDocument(),
    );
    expect(onFieldsChange).toHaveBeenCalledWith({ party1Name: "Acme, Inc." });
    expect(onCompleteChange).toHaveBeenCalledWith(false);
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body).document_type).toBe("mutual-nda");
  });

  it("returns focus to the message input after the assistant replies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ reply: "Got it.", fields: {}, is_complete: false, suggested_document_type: null }),
      }),
    );

    const user = userEvent.setup();
    renderChatPanel();
    const input = screen.getByLabelText(/Your message/);

    await user.type(input, "Hello");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() => expect(screen.getByText("Got it.")).toBeInTheDocument());
    await waitFor(() => expect(input).toHaveFocus());
  });

  it("returns focus to the message input after a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }));

    const user = userEvent.setup();
    renderChatPanel();
    const input = screen.getByLabelText(/Your message/);

    await user.type(input, "Hello");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() =>
      expect(screen.getByText(/AI assistant is temporarily unavailable/)).toBeInTheDocument(),
    );
    await waitFor(() => expect(input).toHaveFocus());
  });

  it("reports a suggested document type from the backend", async () => {
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
    const onSuggestedDocumentType = vi.fn();

    const user = userEvent.setup();
    renderChatPanel({ onSuggestedDocumentType });

    await user.type(screen.getByLabelText(/Your message/), "Actually I need something else.");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() => expect(onSuggestedDocumentType).toHaveBeenCalledWith("csa"));
  });

  it("only sends chat-confirmed fields to the backend, not unconfirmed UI defaults", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ reply: "Got it.", fields: {}, is_complete: false, suggested_document_type: null }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderChatPanel({ knownFields: { party1Name: "Acme, Inc." } });

    await user.type(screen.getByLabelText(/Your message/), "Hello");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.fields).toEqual({ party1Name: "Acme, Inc." });
  });

  it("clears the input box after sending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ reply: "Got it.", fields: {}, is_complete: false, suggested_document_type: null }),
      }),
    );

    const user = userEvent.setup();
    renderChatPanel();
    const input = screen.getByLabelText(/Your message/);

    await user.type(input, "Hello");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    expect(input).toHaveValue("");
  });

  it("shows a retry option on failure and resends the same history on retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ reply: "Recovered.", fields: {}, is_complete: false, suggested_document_type: null }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderChatPanel();

    await user.type(screen.getByLabelText(/Your message/), "Hello");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() => expect(screen.getByRole("button", { name: /Retry/ })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Retry/ }));

    await waitFor(() => expect(screen.getByText("Recovered.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
