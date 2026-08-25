import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

function mockChatResponse(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Home page", () => {
  it("starts with the Download PDF button disabled and a greeting from the assistant", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: /Download PDF/ })).toBeDisabled();
    expect(screen.getByText(/I'll help you put together a Mutual NDA/)).toBeInTheDocument();
  });

  it("sends a chat message and updates the live preview from the AI's extracted fields", async () => {
    vi.stubGlobal(
      "fetch",
      mockChatResponse({
        reply: "Got it, who is the second party?",
        fields: { party1Name: "Acme, Inc.", party2Name: null },
        is_complete: false,
      }),
    );

    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByLabelText(/Your message/), "The first party is Acme, Inc.");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() =>
      expect(screen.getByText("Between Acme, Inc. and [Party 2]")).toBeInTheDocument(),
    );
    expect(screen.getByText("Got it, who is the second party?")).toBeInTheDocument();
  });

  it("enables the Download PDF button once the AI reports the NDA is complete", async () => {
    vi.stubGlobal(
      "fetch",
      mockChatResponse({
        reply: "You're all set — you can download your NDA now.",
        fields: {
          party1Name: "Acme, Inc.",
          party2Name: "Beta Corp.",
          purpose: "Evaluating a business relationship.",
          effectiveDate: "2026-08-26",
          governingLaw: "Delaware",
          jurisdiction: "New Castle, DE",
        },
        is_complete: true,
      }),
    );

    const user = userEvent.setup();
    render(<Home />);
    const downloadButton = screen.getByRole("button", { name: /Download PDF/ });

    await user.type(screen.getByLabelText(/Your message/), "Here are all the details.");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() => expect(downloadButton).toBeEnabled());
  });

  it("shows a retryable error message when the chat request fails", async () => {
    vi.stubGlobal("fetch", mockChatResponse({}, false));

    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByLabelText(/Your message/), "Hello");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() =>
      expect(
        screen.getByText(/AI assistant is temporarily unavailable/),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Retry/ })).toBeInTheDocument();
  });
});
