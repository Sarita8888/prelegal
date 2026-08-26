import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";
import { AuthProvider } from "@/lib/AuthContext";
import { storeAuth } from "@/lib/auth";

afterEach(() => {
  window.localStorage.clear();
});

function renderHeader() {
  return render(
    <AuthProvider>
      <Header onNewDocument={vi.fn()} onMyDocuments={vi.fn()} onSignIn={vi.fn()} onSignUp={vi.fn()} />
    </AuthProvider>,
  );
}

describe("Header", () => {
  it("shows sign in/sign up and hides My Documents when logged out", async () => {
    renderHeader();

    await waitFor(() => expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "My Documents" })).not.toBeInTheDocument();
  });

  it("shows the user's email, sign out, and My Documents once logged in", async () => {
    storeAuth({ token: "abc", user: { id: 1, email: "a@example.com", created_at: "now" } });

    renderHeader();

    await waitFor(() => expect(screen.getByText("a@example.com")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "My Documents" })).toBeInTheDocument();
  });

  it("clears the session when Sign out is clicked", async () => {
    storeAuth({ token: "abc", user: { id: 1, email: "a@example.com", created_at: "now" } });
    const user = userEvent.setup();
    renderHeader();

    await waitFor(() => expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument());
  });
});
