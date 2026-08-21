import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NdaForm } from "./NdaForm";
import { makeFormData } from "@/lib/testFixtures";

describe("NdaForm", () => {
  it("renders current field values from the data prop", () => {
    const data = makeFormData({ party1Name: "Acme, Inc.", governingLaw: "Delaware" });
    render(<NdaForm data={data} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/Party 1/)).toHaveValue("Acme, Inc.");
    expect(screen.getByLabelText(/Governing Law/)).toHaveValue("Delaware");
  });

  it("calls onChange with the new value when a text field changes", () => {
    const onChange = vi.fn();
    render(<NdaForm data={makeFormData()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Party 1/), {
      target: { value: "New Co." },
    });

    expect(onChange).toHaveBeenCalledWith({ party1Name: "New Co." });
  });

  it("calls onChange with the new value when the purpose textarea changes", () => {
    const onChange = vi.fn();
    render(<NdaForm data={makeFormData()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Purpose/), {
      target: { value: "A new purpose." },
    });

    expect(onChange).toHaveBeenCalledWith({ purpose: "A new purpose." });
  });

  it("calls onChange with the new date when the effective date changes", () => {
    const onChange = vi.fn();
    render(<NdaForm data={makeFormData()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Effective Date *"), {
      target: { value: "2026-01-01" },
    });

    expect(onChange).toHaveBeenCalledWith({ effectiveDate: "2026-01-01" });
  });

  it("calls onChange when switching the MNDA term to ongoing", () => {
    const onChange = vi.fn();
    render(<NdaForm data={makeFormData({ mndaTermType: "fixed" })} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("radio", {
        name: /Continues until terminated in accordance with the terms of the MNDA/,
      }),
    );

    expect(onChange).toHaveBeenCalledWith({ mndaTermType: "ongoing" });
  });

  it("calls onChange when switching the MNDA term back to fixed", () => {
    const onChange = vi.fn();
    render(<NdaForm data={makeFormData({ mndaTermType: "ongoing" })} onChange={onChange} />);

    fireEvent.click(screen.getByRole("radio", { name: /Expires/ }));

    expect(onChange).toHaveBeenCalledWith({ mndaTermType: "fixed" });
  });

  it("disables the MNDA term year input when the term type is ongoing", () => {
    render(
      <NdaForm data={makeFormData({ mndaTermType: "ongoing" })} onChange={vi.fn()} />,
    );
    const [mndaYearsInput] = screen.getAllByRole("spinbutton");
    expect(mndaYearsInput).toBeDisabled();
  });

  it("enables the MNDA term year input when the term type is fixed", () => {
    render(
      <NdaForm data={makeFormData({ mndaTermType: "fixed" })} onChange={vi.fn()} />,
    );
    const [mndaYearsInput] = screen.getAllByRole("spinbutton");
    expect(mndaYearsInput).toBeEnabled();
  });

  it("calls onChange when switching the confidentiality term to perpetual", () => {
    const onChange = vi.fn();
    render(
      <NdaForm
        data={makeFormData({ confidentialityTermType: "fixed" })}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /In perpetuity/ }));

    expect(onChange).toHaveBeenCalledWith({ confidentialityTermType: "perpetual" });
  });

  it("disables the confidentiality term year input when perpetual", () => {
    render(
      <NdaForm
        data={makeFormData({ confidentialityTermType: "perpetual" })}
        onChange={vi.fn()}
      />,
    );
    const [, confidentialityYearsInput] = screen.getAllByRole("spinbutton");
    expect(confidentialityYearsInput).toBeDisabled();
  });

  it("calls onChange with the new value when governing law changes", () => {
    const onChange = vi.fn();
    render(<NdaForm data={makeFormData()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Governing Law/), {
      target: { value: "California" },
    });

    expect(onChange).toHaveBeenCalledWith({ governingLaw: "California" });
  });

  it("calls onChange with the new value when jurisdiction changes", () => {
    const onChange = vi.fn();
    render(<NdaForm data={makeFormData()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Jurisdiction/), {
      target: { value: "San Francisco, CA" },
    });

    expect(onChange).toHaveBeenCalledWith({ jurisdiction: "San Francisco, CA" });
  });

  it("calls onChange with the new value when modifications changes", () => {
    const onChange = vi.fn();
    render(<NdaForm data={makeFormData()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/MNDA Modifications/), {
      target: { value: "Add a mutual indemnification clause." },
    });

    expect(onChange).toHaveBeenCalledWith({
      modifications: "Add a mutual indemnification clause.",
    });
  });

  it("does not throw when the form is submitted (e.g. via Enter key)", () => {
    render(<NdaForm data={makeFormData()} onChange={vi.fn()} />);
    const form = screen.getByLabelText(/Party 1/).closest("form");
    expect(form).not.toBeNull();
    expect(() => fireEvent.submit(form as HTMLFormElement)).not.toThrow();
  });
});
