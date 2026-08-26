import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

const CATALOG = [
  {
    name: "Mutual Non-Disclosure Agreement",
    description: "Standard mutual NDA terms.",
    filename: "templates/Mutual-NDA.md",
    documentType: "mutual-nda",
  },
  {
    name: "Mutual Non-Disclosure Agreement Cover Page",
    description: "Cover page for the Mutual NDA.",
    filename: "templates/Mutual-NDA-coverpage.md",
    documentType: "mutual-nda",
  },
  {
    name: "AI Addendum",
    description: "Addendum for AI/ML features.",
    filename: "templates/AI-Addendum.md",
    documentType: "ai-addendum",
  },
];

function mockFetch(chatResponseBody: unknown, chatOk = true) {
  return vi.fn((url: string) => {
    if (url.toString().endsWith("/api/catalog")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(CATALOG) });
    }
    return Promise.resolve({ ok: chatOk, json: () => Promise.resolve(chatResponseBody) });
  });
}

async function selectMutualNda(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => expect(screen.getAllByText("Mutual Non-Disclosure Agreement")).toHaveLength(1));
  await user.click(screen.getByText("Mutual Non-Disclosure Agreement"));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Home page", () => {
  it("shows a document picker listing each catalog document type once", async () => {
    vi.stubGlobal("fetch", mockFetch({}));
    render(<Home />);

    await waitFor(() => expect(screen.getByText("AI Addendum")).toBeInTheDocument());
    // The Mutual NDA has two catalog entries (standard terms + cover page) but
    // one document type, so it should appear as a single picker option.
    expect(screen.getAllByText("Mutual Non-Disclosure Agreement")).toHaveLength(1);
  });

  it("starts the workspace with the Download PDF button disabled and a greeting from the assistant", async () => {
    vi.stubGlobal("fetch", mockFetch({}));
    const user = userEvent.setup();
    render(<Home />);

    await selectMutualNda(user);

    expect(screen.getByRole("button", { name: /Download PDF/ })).toBeDisabled();
    expect(screen.getByText(/I'll help you put together a Mutual Non-Disclosure Agreement/)).toBeInTheDocument();
  });

  it("sends a chat message and updates the live preview from the AI's extracted fields", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        reply: "Got it, who is the second party?",
        fields: { party1Name: "Acme, Inc.", party2Name: null },
        is_complete: false,
        suggested_document_type: null,
      }),
    );

    const user = userEvent.setup();
    render(<Home />);
    await selectMutualNda(user);

    await user.type(screen.getByLabelText(/Your message/), "The first party is Acme, Inc.");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() =>
      expect(screen.getByText("Between Acme, Inc. and [Party 2]")).toBeInTheDocument(),
    );
    expect(screen.getByText("Got it, who is the second party?")).toBeInTheDocument();
  });

  it("enables the Download PDF button once the backend reports the document is complete", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
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
        suggested_document_type: null,
      }),
    );

    const user = userEvent.setup();
    render(<Home />);
    await selectMutualNda(user);
    const downloadButton = screen.getByRole("button", { name: /Download PDF/ });

    await user.type(screen.getByLabelText(/Your message/), "Here are all the details.");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() => expect(downloadButton).toBeEnabled());
  });

  it("shows a retryable error message when the chat request fails", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false));

    const user = userEvent.setup();
    render(<Home />);
    await selectMutualNda(user);

    await user.type(screen.getByLabelText(/Your message/), "Hello");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() =>
      expect(
        screen.getByText(/AI assistant is temporarily unavailable/),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Retry/ })).toBeInTheDocument();
  });

  it("returns to the picker when 'Choose a different document' is clicked", async () => {
    vi.stubGlobal("fetch", mockFetch({}));
    const user = userEvent.setup();
    render(<Home />);
    await selectMutualNda(user);

    await user.click(screen.getByRole("button", { name: /Choose a different document/ }));

    await waitFor(() => expect(screen.getByText("What would you like to create?")).toBeInTheDocument());
  });
});
