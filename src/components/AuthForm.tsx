import { Link, useNavigate } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth, validateCredentials } from "@/lib/auth/useAuth";
import { Watermark } from "@/components/Watermark";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err =
      validateCredentials(email, password) ??
      (mode === "signup" && password !== confirm ? "Passwords don't match." : null);
    if (err) return setError(err);
    try {
      await (mode === "login" ? signIn : signUp)(email, password);
    } catch (x) {
      setError((x as Error).message);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Dumbbell className="h-6 w-6" />
        </div>
        <div className="num text-3xl uppercase">Gym Tracker</div>
      </div>
      <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create account"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Prototype — any valid email and 6+ character password works.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3" noValidate>
        <input
          className="field"
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="field"
          type="password"
          placeholder="Password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === "signup" && (
          <input
            className="field"
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" className="btn btn-primary w-full">
          {mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link to="/signup" className="font-semibold text-primary">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Have an account?{" "}
            <Link to="/login" className="font-semibold text-primary">
              Log in
            </Link>
          </>
        )}
      </p>
      <Watermark className="mt-12" />
    </div>
  );
}
