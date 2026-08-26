"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export function AuthScreen({
  mode,
  onSuccess,
  onSwitchMode,
}: {
  mode: "signin" | "signup";
  onSuccess: () => void;
  onSwitchMode: () => void;
}) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === "signup";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-sm px-6 py-16">
        <h1 className="text-xl font-semibold text-brand-navy">{isSignUp ? "Create an account" : "Sign in"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isSignUp
            ? "Save your documents and pick up where you left off."
            : "Welcome back. Sign in to see your saved documents."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-brand-purple px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-purple-dark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting
              ? isSignUp
                ? "Creating account…"
                : "Signing in…"
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button type="button" onClick={onSwitchMode} className="font-medium text-brand-blue hover:underline">
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
