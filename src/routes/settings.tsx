import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, LogOut, RotateCcw, User } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth/useAuth";
import { repository } from "@/lib/data/repository";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Gym Tracker" },
      { name: "description", content: "Units, demo data and account." },
    ],
  }),
  component: () => <AppShell title="Settings">{(u) => <Settings email={u.email} />}</AppShell>,
});

function Settings({ email }: { email: string }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Link
        to="/profile"
        className="card flex items-center justify-between p-4 transition-colors hover:bg-surface/80"
      >
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-primary" />
          <span className="font-semibold">Profile</span>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>
      <div className="card p-4">
        <div className="text-sm text-muted-foreground">Signed in as</div>
        <div className="font-semibold">{email}</div>
      </div>
      <div className="card flex items-center justify-between p-4">
        <span className="font-semibold">Units</span>
        <span className="rounded-lg bg-accent px-3 py-2 text-sm font-bold text-accent-foreground">
          kg
        </span>
      </div>
      <button
        className="btn btn-ghost w-full"
        onClick={async () => {
          if (!confirm("Delete all logged workouts and reset demo data?")) return;
          await repository.resetDemoData();
          setMsg("Demo data reset.");
        }}
      >
        <RotateCcw className="h-5 w-5" /> Reset demo data
      </button>
      {msg && <p className="text-center text-sm text-primary">{msg}</p>}
      <button
        className="btn w-full border border-destructive text-destructive"
        onClick={async () => {
          await signOut();
          navigate({ to: "/login" });
        }}
      >
        <LogOut className="h-5 w-5" /> Sign out
      </button>
    </div>
  );
}
