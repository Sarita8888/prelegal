export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export class AuthRequestError extends Error {}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const STORAGE_KEY = "prelegal_auth";

async function submitAuthRequest(path: string, body: unknown): Promise<AuthResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthRequestError("Couldn't reach the server. Please check your connection and try again.");
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new AuthRequestError(detail?.detail ?? "Something went wrong. Please try again.");
  }

  return response.json();
}

export function signup(email: string, password: string): Promise<AuthResult> {
  return submitAuthRequest("/api/auth/signup", { email, password });
}

export function signin(email: string, password: string): Promise<AuthResult> {
  return submitAuthRequest("/api/auth/signin", { email, password });
}

export function readStoredAuth(): AuthResult | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthResult;
  } catch {
    return null;
  }
}

export function storeAuth(auth: AuthResult): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
