import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "./ChatPanel";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ChatPanel", () => {
  it("disables the Send button until there is input", () => {
    render(<ChatPanel knownFields={{}} onFieldsChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Send/ })).toBeDisabled();
  });

  it("sends the message, shows the assistant's reply, and reports extracted fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            reply: "Thanks! What's the purpose of this agreement?",
            fields: { party1Name: "Acme, Inc." },
            is_complete: false,
          }),
      }),
    );
    const onFieldsChange = vi.fn();

    const user = userEvent.setup();
    render(<ChatPanel knownFields={{}} onFieldsChange={onFieldsChange} />);

    await user.type(screen.getByLabelText(/Your message/), "Acme, Inc. is party one.");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    expect(screen.getByText("Acme, Inc. is party one.")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText("Thanks! What's the purpose of this agreement?"),
      ).toBeInTheDocument(),
    );
    expect(onFieldsChange).toHaveBeenCalledWith({ party1Name: "Acme, Inc." });
  });

  it("only sends chat-confirmed fields to the backend, not unconfirmed UI defaults", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: "Got it.", fields: {}, is_complete: false }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(
      <ChatPanel
        knownFields={{ party1Name: "Acme, Inc." }}
        onFieldsChange={vi.fn()}
      />,
    );

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
        json: () => Promise.resolve({ reply: "Got it.", fields: {}, is_complete: false }),
      }),
    );

    const user = userEvent.setup();
    render(<ChatPanel knownFields={{}} onFieldsChange={vi.fn()} />);
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
        json: () => Promise.resolve({ reply: "Recovered.", fields: {}, is_complete: false }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<ChatPanel knownFields={{}} onFieldsChange={vi.fn()} />);

    await user.type(screen.getByLabelText(/Your message/), "Hello");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() => expect(screen.getByRole("button", { name: /Retry/ })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Retry/ }));

    await waitFor(() => expect(screen.getByText("Recovered.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
