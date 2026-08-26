"use client";

import { useAuth } from "@/lib/AuthContext";

export function Header({
  onNewDocument,
  onMyDocuments,
  onSignIn,
  onSignUp,
}: {
  onNewDocument: () => void;
  onMyDocuments: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  const { user, isLoading, signOut } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <button type="button" onClick={onNewDocument} className="text-lg font-semibold text-brand-navy">
          Prelegal
        </button>

        <nav className="flex items-center gap-5 text-sm">
          <button
            type="button"
            onClick={onNewDocument}
            className="font-medium text-slate-600 hover:text-brand-blue"
          >
            New Document
          </button>
          {user && (
            <button
              type="button"
              onClick={onMyDocuments}
              className="font-medium text-slate-600 hover:text-brand-blue"
            >
              My Documents
            </button>
          )}

          {!isLoading &&
            (user ? (
              <div className="flex items-center gap-3">
                <span className="text-brand-gray">{user.email}</span>
                <button type="button" onClick={signOut} className="font-medium text-brand-blue hover:underline">
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button type="button" onClick={onSignIn} className="font-medium text-brand-blue hover:underline">
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={onSignUp}
                  className="rounded-md bg-brand-purple px-3 py-1.5 font-medium text-white hover:bg-brand-purple-dark"
                >
                  Sign up
                </button>
              </div>
            ))}
        </nav>
      </div>
    </header>
  );
}
