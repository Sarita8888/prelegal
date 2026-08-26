"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  AuthResult,
  clearStoredAuth,
  readStoredAuth,
  signin as apiSignin,
  signup as apiSignup,
  storeAuth,
  User,
} from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAuth(readStoredAuth());
    setIsLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    const result = await apiSignin(email, password);
    storeAuth(result);
    setAuth(result);
  }

  async function signUp(email: string, password: string) {
    const result = await apiSignup(email, password);
    storeAuth(result);
    setAuth(result);
  }

  function signOut() {
    clearStoredAuth();
    setAuth(null);
  }

  return (
    <AuthContext.Provider
      value={{ user: auth?.user ?? null, token: auth?.token ?? null, isLoading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
