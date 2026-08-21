import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TermsParagraph } from "./TermsParagraph";
import { RefKey } from "@/lib/ndaContent";

const refValues: Record<RefKey, string> = {
  purpose: "Evaluating a partnership.",
  effectiveDate: "August 21, 2026",
  mndaTerm: "Expires 1 year(s) from the Effective Date.",
  confidentialityTerm: "1 year(s) from the Effective Date.",
  governingLaw: "Delaware",
  jurisdiction: "New Castle, DE",
};

describe("TermsParagraph", () => {
  it("renders plain text as-is", () => {
    render(<TermsParagraph template="Hello world" refValues={refValues} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders bold tokens inside a <strong> element", () => {
    render(
      <TermsParagraph template="The **Disclosing Party** shall." refValues={refValues} />,
    );
    const strong = screen.getByText("Disclosing Party");
    expect(strong.tagName).toBe("STRONG");
  });

  it("renders a ref token using its label, with the resolved value as a tooltip", () => {
    render(
      <TermsParagraph template="For the {{purpose}}." refValues={refValues} />,
    );
    const ref = screen.getByText("Purpose");
    expect(ref).toHaveAttribute("title", "Evaluating a partnership.");
  });

  it("renders mixed text, bold, and ref tokens in the correct order within one paragraph", () => {
    const { container } = render(
      <TermsParagraph
        template="The **Receiving Party** shall use it for the {{purpose}} only."
        refValues={refValues}
      />,
    );
    expect(container.querySelector("p")?.textContent).toBe(
      "The Receiving Party shall use it for the Purpose only.",
    );
  });
});
