import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthRequestError, clearStoredAuth, readStoredAuth, signin, signup, storeAuth } from "./auth";

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("signup", () => {
  it("posts email and password to /api/auth/signup and returns the token/user", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: "abc", user: { id: 1, email: "a@example.com", created_at: "now" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await signup("a@example.com", "secret123");

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/signup", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: "a@example.com", password: "secret123" });
    expect(result.token).toBe("abc");
  });

  it("throws an AuthRequestError with the backend's detail message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ detail: "Email already exists." }) }),
    );

    await expect(signup("a@example.com", "secret123")).rejects.toThrow("Email already exists.");
  });

  it("throws an AuthRequestError when the network request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await expect(signup("a@example.com", "secret123")).rejects.toBeInstanceOf(AuthRequestError);
  });
});

describe("signin", () => {
  it("posts to /api/auth/signin", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: "abc", user: { id: 1, email: "a@example.com", created_at: "now" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await signin("a@example.com", "secret123");
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/signin", expect.objectContaining({ method: "POST" }));
  });
});

describe("stored auth", () => {
  it("round-trips through storeAuth/readStoredAuth/clearStoredAuth", () => {
    expect(readStoredAuth()).toBeNull();

    const auth = { token: "abc", user: { id: 1, email: "a@example.com", created_at: "now" } };
    storeAuth(auth);
    expect(readStoredAuth()).toEqual(auth);

    clearStoredAuth();
    expect(readStoredAuth()).toBeNull();
  });
});
