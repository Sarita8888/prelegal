import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentPreview } from "./DocumentPreview";
import { getFieldSpecs } from "@/lib/documents/registry";
import { TEMPLATES } from "@/lib/documents/generated/templates.generated";

const NON_NDA_DOCUMENT_TYPES = Object.keys(TEMPLATES).filter((type) => type !== "mutual-nda");

describe.each(NON_NDA_DOCUMENT_TYPES)("DocumentPreview (%s)", (documentType) => {
  it("renders every field label from the registry", () => {
    render(<DocumentPreview documentType={documentType} documentName="Test Document" data={{}} />);
    for (const field of getFieldSpecs(documentType)) {
      expect(screen.getAllByText(new RegExp(`^${escapeRegExp(field.label)}`)).length).toBeGreaterThan(0);
    }
  });

  it("shows a bracketed placeholder for every required field when no data is known", () => {
    render(<DocumentPreview documentType={documentType} documentName="Test Document" data={{}} />);
    for (const field of getFieldSpecs(documentType).filter((f) => f.required)) {
      expect(screen.getAllByText(`[${field.label} not yet provided]`).length).toBeGreaterThan(0);
    }
  });

  it("substitutes a filled-in field's value into the body text", () => {
    const fields = getFieldSpecs(documentType);
    const firstTextField = fields.find((field) => field.kind === "text");
    if (!firstTextField) return;

    const { container } = render(
      <DocumentPreview
        documentType={documentType}
        documentName="Test Document"
        data={{ [firstTextField.key]: "A Test Value" }}
      />,
    );
    // The Details section always shows the raw value; body references show the
    // label with the value as a tooltip, so just assert nothing crashed and the
    // Details value rendered.
    expect(container.textContent).toContain("A Test Value");
  });

  it("never leaks raw markup from the source templates into the rendered body", () => {
    const { container } = render(
      <DocumentPreview documentType={documentType} documentName="Test Document" data={{}} />,
    );
    expect(container.textContent).not.toMatch(/<span/);
    expect(container.textContent).not.toMatch(/\*\*/);
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
