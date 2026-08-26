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

function mockFetchWithRoutes(
  handlers: Record<string, () => { ok: boolean; json: () => Promise<unknown> }>,
) {
  return vi.fn((url: string) => {
    const path = url.toString();
    for (const [suffix, handler] of Object.entries(handlers)) {
      if (path.endsWith(suffix)) return Promise.resolve(handler());
    }
    throw new Error(`Unhandled fetch in test: ${path}`);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
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

describe("Auth and My Documents", () => {
  it("lets a user sign up from the header, then sign out", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchWithRoutes({
        "/api/catalog": () => ({ ok: true, json: () => Promise.resolve(CATALOG) }),
        "/api/auth/signup": () => ({
          ok: true,
          json: () =>
            Promise.resolve({ token: "abc", user: { id: 1, email: "new@example.com", created_at: "now" } }),
        }),
      }),
    );
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Sign up" }));
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(screen.getByText("new@example.com")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument());
  });

  it("saves a completed document to My Documents and lists it there", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchWithRoutes({
        "/api/catalog": () => ({ ok: true, json: () => Promise.resolve(CATALOG) }),
        "/api/auth/signup": () => ({
          ok: true,
          json: () =>
            Promise.resolve({ token: "abc", user: { id: 1, email: "new@example.com", created_at: "now" } }),
        }),
        "/api/chat": () => ({
          ok: true,
          json: () =>
            Promise.resolve({
              reply: "You're all set.",
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
        }),
        "/api/documents": () => ({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 1,
              document_type: "mutual-nda",
              document_name: "Mutual Non-Disclosure Agreement",
              fields: {},
              created_at: "2026-08-26 10:00:00",
            }),
        }),
      }),
    );

    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Sign up" }));
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(screen.getByText("new@example.com")).toBeInTheDocument());

    await selectMutualNda(user);
    await user.type(screen.getByLabelText(/Your message/), "Here are all the details.");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    const saveButton = await screen.findByRole("button", { name: "Save to My Documents" });
    await user.click(saveButton);
    await waitFor(() => expect(screen.getByRole("button", { name: "Saved ✓" })).toBeInTheDocument());
  });

  it("prompts a signed-out user to sign in instead of showing a save button", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchWithRoutes({
        "/api/catalog": () => ({ ok: true, json: () => Promise.resolve(CATALOG) }),
        "/api/chat": () => ({
          ok: true,
          json: () =>
            Promise.resolve({
              reply: "You're all set.",
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
        }),
      }),
    );

    const user = userEvent.setup();
    render(<Home />);
    await selectMutualNda(user);
    await user.type(screen.getByLabelText(/Your message/), "Here are all the details.");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    expect(await screen.findByText("Sign in to save this document")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save to My Documents" })).not.toBeInTheDocument();
  });
});
