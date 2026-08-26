import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DownloadPdfButton } from "./DownloadPdfButton";
import { makeCompleteFormData, makeFormData } from "@/lib/testFixtures";

const toBlob = vi.fn();
vi.mock("@react-pdf/renderer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@react-pdf/renderer")>();
  return {
    ...actual,
    pdf: vi.fn(() => ({ toBlob })),
  };
});

describe("DownloadPdfButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    toBlob.mockReset();
  });

  it("is disabled and shows a hint when isComplete is false", () => {
    render(<DownloadPdfButton data={makeFormData()} isComplete={false} />);
    expect(screen.getByRole("button", { name: /Download PDF/ })).toBeDisabled();
    expect(
      screen.getByText(/Fill in all required fields/),
    ).toBeInTheDocument();
  });

  it("is enabled and shows no hint when isComplete is true", () => {
    render(<DownloadPdfButton data={makeCompleteFormData()} isComplete={true} />);
    expect(screen.getByRole("button", { name: /Download PDF/ })).toBeEnabled();
    expect(
      screen.queryByText(/Fill in all required fields/),
    ).not.toBeInTheDocument();
  });

  it("generates a blob, creates an object URL, and clicks a download link on click", async () => {
    const blob = new Blob(["fake-pdf-bytes"], { type: "application/pdf" });
    toBlob.mockResolvedValue(blob);

    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    let clickedLink: HTMLAnchorElement | null = null;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {
        clickedLink = document.body.querySelector("a");
      });

    render(
      <DownloadPdfButton
        data={makeCompleteFormData({ party1Name: "Acme, Inc.", party2Name: "Beta Corp." })}
        isComplete={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Download PDF/ }));

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));

    expect(toBlob).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickedLink!.href).toBe("blob:mock-url");
    expect(clickedLink!.download).toBe("Mutual-NDA-Acme, Inc.-and-Beta Corp..pdf");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("stays disabled and never generates a PDF when isComplete is false", () => {
    render(<DownloadPdfButton data={makeCompleteFormData({ party1Name: "", party2Name: "" })} isComplete={false} />);
    const button = screen.getByRole("button", { name: /Download PDF/ });
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(toBlob).not.toHaveBeenCalled();
  });

  it("shows a generating state while the PDF is being built", async () => {
    let resolveBlob: (blob: Blob) => void = () => {};
    toBlob.mockReturnValue(
      new Promise<Blob>((resolve) => {
        resolveBlob = resolve;
      }),
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<DownloadPdfButton data={makeCompleteFormData()} isComplete={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Download PDF/ }));

    expect(
      await screen.findByRole("button", { name: /Generating PDF/ }),
    ).toBeInTheDocument();

    resolveBlob(new Blob(["x"]));

    expect(
      await screen.findByRole("button", { name: /^Download PDF$/ }),
    ).toBeInTheDocument();
  });

  it("shows an error message and re-enables the button if PDF generation fails", async () => {
    toBlob.mockRejectedValue(new Error("rendering failed"));

    render(<DownloadPdfButton data={makeCompleteFormData()} isComplete={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Download PDF/ }));

    expect(
      await screen.findByText(/Something went wrong generating the PDF/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Download PDF$/ })).toBeEnabled();
  });

  it("clears a previous error message on the next successful attempt", async () => {
    toBlob.mockRejectedValueOnce(new Error("rendering failed"));
    toBlob.mockResolvedValueOnce(new Blob(["x"]));
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<DownloadPdfButton data={makeCompleteFormData()} isComplete={true} />);
    const button = screen.getByRole("button", { name: /Download PDF/ });

    fireEvent.click(button);
    await screen.findByText(/Something went wrong generating the PDF/);

    fireEvent.click(button);
    await waitFor(() =>
      expect(
        screen.queryByText(/Something went wrong generating the PDF/),
      ).not.toBeInTheDocument(),
    );
  });
});
