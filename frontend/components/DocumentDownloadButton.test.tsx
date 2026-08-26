import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DocumentDownloadButton } from "./DocumentDownloadButton";

const toBlob = vi.fn();
vi.mock("@react-pdf/renderer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@react-pdf/renderer")>();
  return {
    ...actual,
    pdf: vi.fn(() => ({ toBlob })),
  };
});

describe("DocumentDownloadButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    toBlob.mockReset();
  });

  it("is disabled with a hint when isComplete is false", () => {
    render(
      <DocumentDownloadButton documentType="ai-addendum" documentName="AI Addendum" data={{}} isComplete={false} />,
    );
    expect(screen.getByRole("button", { name: /Download PDF/ })).toBeDisabled();
    expect(screen.getByText(/Fill in all required fields/)).toBeInTheDocument();
  });

  it("generates a PDF named after the document when isComplete is true", async () => {
    toBlob.mockResolvedValue(new Blob(["x"]));
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    let clickedLink: HTMLAnchorElement | null = null;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      clickedLink = document.body.querySelector("a");
    });

    render(
      <DocumentDownloadButton documentType="ai-addendum" documentName="AI Addendum" data={{}} isComplete={true} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Download PDF/ }));

    await waitFor(() => expect(toBlob).toHaveBeenCalledTimes(1));
    expect(clickedLink!.download).toBe("AI-Addendum.pdf");
  });

  it("shows an error message if PDF generation fails", async () => {
    toBlob.mockRejectedValue(new Error("failed"));
    render(
      <DocumentDownloadButton documentType="ai-addendum" documentName="AI Addendum" data={{}} isComplete={true} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Download PDF/ }));

    expect(
      await screen.findByText(/Something went wrong generating the PDF/),
    ).toBeInTheDocument();
  });
});
