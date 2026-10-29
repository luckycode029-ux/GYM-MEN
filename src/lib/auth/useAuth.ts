// TODO: replace with Supabase auth
// UI-only stub: accepts any valid-looking email/password and stores a fake user locally.
import { useCallback, useEffect, useState } from "react";

export interface FakeUser {
  id: string;
  email: string;
}

const KEY = "gt.auth.user";
const listeners = new Set<() => void>();

function read(): FakeUser | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

function write(u: FakeUser | null) {
  if (u) window.localStorage.setItem(KEY, JSON.stringify(u));
  else window.localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function validateCredentials(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  return null;
}

function fakeUserFor(email: string): FakeUser {
  // Deterministic fake id so the same email sees the same data.
  let h = 0;
  for (const c of email.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const hex = h.toString(16).padStart(8, "0");
  return { id: `${hex}-0000-4000-8000-${hex}0000`.slice(0, 36), email: email.trim().toLowerCase() };
}

export function useAuth() {
  const [user, setUser] = useState<FakeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => setUser(read());
    sync();
    setLoading(false);
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const err = validateCredentials(email, password);
    if (err) throw new Error(err);
    write(fakeUserFor(email));
  }, []);
  const signUp = signIn;
  const signOut = useCallback(async () => write(null), []);

  return { user, loading, signIn, signUp, signOut };
}
