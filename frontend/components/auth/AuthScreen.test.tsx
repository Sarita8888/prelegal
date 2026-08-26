import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthScreen } from "./AuthScreen";
import { AuthProvider } from "@/lib/AuthContext";

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

function renderAuthScreen(mode: "signin" | "signup", onSuccess = vi.fn()) {
  render(
    <AuthProvider>
      <AuthScreen mode={mode} onSuccess={onSuccess} onSwitchMode={vi.fn()} />
    </AuthProvider>,
  );
  return onSuccess;
}

describe("AuthScreen", () => {
  it("signs up with the entered email/password and calls onSuccess", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: "abc", user: { id: 1, email: "a@example.com", created_at: "now" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onSuccess = renderAuthScreen("signup");
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: "a@example.com",
      password: "secret123",
    });
  });

  it("shows an error message when sign in fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ detail: "Invalid email or password." }),
      }),
    );
    renderAuthScreen("signin");
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(screen.getByText("Invalid email or password.")).toBeInTheDocument());
  });

  it("calls onSwitchMode when the toggle link is clicked", async () => {
    const onSwitchMode = vi.fn();
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthScreen mode="signin" onSuccess={vi.fn()} onSwitchMode={onSwitchMode} />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(onSwitchMode).toHaveBeenCalled();
  });
});
