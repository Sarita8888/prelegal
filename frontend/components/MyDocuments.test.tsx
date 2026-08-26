import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyDocuments } from "./MyDocuments";
import { AuthProvider } from "@/lib/AuthContext";
import { storeAuth } from "@/lib/auth";

const AUTH = { token: "abc", user: { id: 1, email: "a@example.com", created_at: "now" } };

beforeEach(() => {
  storeAuth(AUTH);
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("MyDocuments", () => {
  it("lists saved documents and opens one when clicked", async () => {
    const documents = [
      {
        id: 1,
        document_type: "mutual-nda",
        document_name: "Mutual NDA",
        fields: {},
        created_at: "2026-08-26 10:00:00",
      },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(documents) }));
    const onOpen = vi.fn();
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <MyDocuments onOpen={onOpen} onBack={vi.fn()} />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText("Mutual NDA")).toBeInTheDocument());
    await user.click(screen.getByText("Mutual NDA"));

    expect(onOpen).toHaveBeenCalledWith(documents[0]);
  });

  it("shows an empty state when there are no saved documents", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }));

    render(
      <AuthProvider>
        <MyDocuments onOpen={vi.fn()} onBack={vi.fn()} />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText(/haven.t saved any documents/)).toBeInTheDocument());
  });

  it("shows an error message when loading documents fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }));

    render(
      <AuthProvider>
        <MyDocuments onOpen={vi.fn()} onBack={vi.fn()} />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText(/Couldn't load your documents/)).toBeInTheDocument());
  });
});
