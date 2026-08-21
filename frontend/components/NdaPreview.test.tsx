import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NdaPreview } from "./NdaPreview";
import { makeCompleteFormData, makeFormData } from "@/lib/testFixtures";

describe("NdaPreview", () => {
  it("renders the parties in the header when provided", () => {
    render(
      <NdaPreview
        data={makeCompleteFormData({ party1Name: "Acme, Inc.", party2Name: "Beta Corp." })}
      />,
    );
    expect(screen.getByText("Between Acme, Inc. and Beta Corp.")).toBeInTheDocument();
  });

  it("renders party placeholders when names are blank", () => {
    render(<NdaPreview data={makeFormData({ party1Name: "", party2Name: "" })} />);
    expect(screen.getByText("Between [Party 1] and [Party 2]")).toBeInTheDocument();
  });

  it("renders the resolved Purpose, Effective Date, and terms", () => {
    render(
      <NdaPreview
        data={makeCompleteFormData({
          purpose: "Evaluating a partnership.",
          effectiveDate: "2026-08-21",
          mndaTermType: "fixed",
          mndaTermYears: "2",
          confidentialityTermType: "perpetual",
        })}
      />,
    );

    expect(screen.getByText("Evaluating a partnership.")).toBeInTheDocument();
    expect(screen.getByText("August 21, 2026")).toBeInTheDocument();
    expect(
      screen.getByText("Expires 2 year(s) from the Effective Date."),
    ).toBeInTheDocument();
    expect(screen.getByText("In perpetuity.")).toBeInTheDocument();
  });

  it("renders placeholders for governing law and jurisdiction when blank", () => {
    render(
      <NdaPreview data={makeFormData({ governingLaw: "", jurisdiction: "" })} />,
    );
    expect(screen.getByText("[Governing Law not yet provided]")).toBeInTheDocument();
    expect(screen.getByText("[Jurisdiction not yet provided]")).toBeInTheDocument();
  });

  it("fills the Company row of the signature table with party names", () => {
    render(
      <NdaPreview
        data={makeCompleteFormData({ party1Name: "Acme, Inc.", party2Name: "Beta Corp." })}
      />,
    );
    const companyRow = screen.getByText("Company").closest("tr");
    expect(companyRow).not.toBeNull();
    expect(companyRow!.textContent).toBe("CompanyAcme, Inc.Beta Corp.");
  });

  it("leaves the Signature row blank", () => {
    render(<NdaPreview data={makeCompleteFormData()} />);
    const signatureRow = screen.getByText("Signature").closest("tr");
    expect(signatureRow!.textContent).toBe("Signature");
  });

  it("does not render an MNDA Modifications block when modifications is blank", () => {
    render(<NdaPreview data={makeCompleteFormData({ modifications: "" })} />);
    expect(screen.queryByText("MNDA Modifications")).not.toBeInTheDocument();
  });

  it("renders the MNDA Modifications block and content when provided", () => {
    render(
      <NdaPreview
        data={makeCompleteFormData({ modifications: "Add a mutual indemnity clause." })}
      />,
    );
    expect(screen.getByText("MNDA Modifications")).toBeInTheDocument();
    expect(screen.getByText("Add a mutual indemnity clause.")).toBeInTheDocument();
  });

  it("preserves line breaks in multi-line Purpose and Modifications text", () => {
    render(
      <NdaPreview
        data={makeCompleteFormData({
          purpose: "Line one.\nLine two.",
          modifications: "Mod one.\nMod two.",
        })}
      />,
    );
    const purposeValue = screen.getByText((_, el) => el?.textContent === "Line one.\nLine two.");
    expect(purposeValue).toHaveClass("whitespace-pre-wrap");

    const modificationsValue = screen.getByText(
      (_, el) => el?.textContent === "Mod one.\nMod two.",
    );
    expect(modificationsValue).toHaveClass("whitespace-pre-wrap");
  });

  it("renders all 11 Standard Terms section headings", () => {
    render(<NdaPreview data={makeCompleteFormData()} />);
    for (let n = 1; n <= 11; n++) {
      expect(
        screen.getByText(new RegExp(`^${n}\\.\\s`)),
      ).toBeInTheDocument();
    }
  });

  it("renders the Common Paper attribution", () => {
    render(<NdaPreview data={makeCompleteFormData()} />);
    expect(
      screen.getByText(/Common Paper Mutual Non-Disclosure Agreement/),
    ).toBeInTheDocument();
  });

  it("renders cross-reference spans with a tooltip carrying the resolved value", () => {
    render(
      <NdaPreview
        data={makeCompleteFormData({ governingLaw: "Delaware", jurisdiction: "New Castle, DE" })}
      />,
    );
    const governingLawRefs = screen.getAllByText("Governing Law", { selector: "span" });
    expect(governingLawRefs.length).toBeGreaterThan(0);
    for (const ref of governingLawRefs) {
      expect(ref).toHaveAttribute("title", "Delaware");
    }
  });
});
