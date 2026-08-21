import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

describe("Home page", () => {
  it("starts with the Download PDF button disabled", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: /Download PDF/ })).toBeDisabled();
  });

  it("updates the live preview header as the party names are typed", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByLabelText(/Party 1/), "Acme, Inc.");
    await user.type(screen.getByLabelText(/Party 2/), "Beta Corp.");

    expect(
      screen.getByText("Between Acme, Inc. and Beta Corp."),
    ).toBeInTheDocument();
  });

  it("updates the live preview's MNDA Term line when the term type is switched", async () => {
    render(<Home />);

    expect(
      screen.getByText("Expires 1 year(s) from the Effective Date."),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("radio", {
        name: /Continues until terminated in accordance with the terms of the MNDA/,
      }),
    );

    expect(
      screen.getByText(
        "Continues until terminated in accordance with the terms of the MNDA.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Expires 1 year(s) from the Effective Date."),
    ).not.toBeInTheDocument();
  });

  it("enables the Download PDF button once all required fields are filled in", () => {
    render(<Home />);
    const downloadButton = screen.getByRole("button", { name: /Download PDF/ });

    fireEvent.change(screen.getByLabelText(/Party 1/), {
      target: { value: "Acme, Inc." },
    });
    fireEvent.change(screen.getByLabelText(/Party 2/), {
      target: { value: "Beta Corp." },
    });
    fireEvent.change(screen.getByLabelText("Effective Date *"), {
      target: { value: "2026-08-21" },
    });
    fireEvent.change(screen.getByLabelText(/Governing Law/), {
      target: { value: "Delaware" },
    });
    expect(downloadButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Jurisdiction/), {
      target: { value: "New Castle, DE" },
    });

    expect(downloadButton).toBeEnabled();
  });
});
