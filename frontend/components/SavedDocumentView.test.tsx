import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SavedDocumentView } from "./SavedDocumentView";
import { SavedDocument } from "@/lib/documents";

const NDA_DOCUMENT: SavedDocument = {
  id: 1,
  document_type: "mutual-nda",
  document_name: "Mutual Non-Disclosure Agreement",
  fields: { party1Name: "Acme, Inc.", party2Name: "Beta Corp." },
  created_at: "2026-08-26 10:00:00",
};

const AI_ADDENDUM_DOCUMENT: SavedDocument = {
  id: 2,
  document_type: "ai-addendum",
  document_name: "AI Addendum",
  fields: { customerName: "Acme, Inc.", providerName: "Beta Corp." },
  created_at: "2026-08-26 10:00:00",
};

describe("SavedDocumentView", () => {
  it("renders the bespoke NDA preview for a saved mutual-nda document", () => {
    render(<SavedDocumentView document={NDA_DOCUMENT} onBack={vi.fn()} />);
    expect(screen.getByText("Between Acme, Inc. and Beta Corp.")).toBeInTheDocument();
  });

  it("renders the generic preview for other document types", () => {
    render(<SavedDocumentView document={AI_ADDENDUM_DOCUMENT} onBack={vi.fn()} />);
    expect(screen.getAllByRole("heading", { name: "AI Addendum" })).toHaveLength(2);
    expect(screen.getByText("Acme, Inc.")).toBeInTheDocument();
  });

  it("calls onBack when the back link is clicked", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<SavedDocumentView document={NDA_DOCUMENT} onBack={onBack} />);

    await user.click(screen.getByRole("button", { name: "Back to My Documents" }));
    expect(onBack).toHaveBeenCalled();
  });
});
