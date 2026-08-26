import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentPicker } from "./DocumentPicker";

const CATALOG = [
  { name: "AI Addendum", description: "AI terms.", filename: "templates/AI-Addendum.md", documentType: "ai-addendum" },
  { name: "BAA", description: "HIPAA terms.", filename: "templates/BAA.md", documentType: "baa" },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DocumentPicker", () => {
  it("shows a loading state, then the catalog entries", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(CATALOG) }));
    render(<DocumentPicker onSelect={vi.fn()} />);

    expect(screen.getByText(/Loading/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("AI Addendum")).toBeInTheDocument());
    expect(screen.getByText("BAA")).toBeInTheDocument();
  });

  it("calls onSelect with the document type and name when an entry is clicked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(CATALOG) }));
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<DocumentPicker onSelect={onSelect} />);

    await user.click(await screen.findByText("AI Addendum"));

    expect(onSelect).toHaveBeenCalledWith("ai-addendum", "AI Addendum");
  });

  it("shows an error message if the catalog fails to load", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }));
    render(<DocumentPicker onSelect={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByText(/Couldn't load the list of supported documents/)).toBeInTheDocument(),
    );
  });
});
