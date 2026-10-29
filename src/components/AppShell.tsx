import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Dumbbell, LineChart, MessageCircle, Settings, User } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth, type FakeUser } from "@/lib/auth/useAuth";
import { Watermark } from "@/components/Watermark";

const TABS = [
  { to: "/", label: "Today", icon: Dumbbell },
  { to: "/plan", label: "Plan", icon: CalendarDays },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/ask", label: "Ask", icon: MessageCircle },
] as const;

/** Route guard + layout. Children receive the signed-in (fake) user. */
export function AppShell({
  title,
  children,
  hideTabs,
  back,
}: {
  title?: ReactNode;
  children: (user: FakeUser) => ReactNode;
  hideTabs?: boolean;
  back?: ReactNode;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background/90 px-4 py-2 backdrop-blur">
        {back}
        <div className="min-w-0 flex-1 truncate text-lg font-bold">{title}</div>
        <Link
          to="/profile"
          aria-label="Profile"
          className="tap flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <User className="h-5 w-5" />
        </Link>
        <Link
          to="/settings"
          aria-label="Settings"
          className="tap flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </header>
      <main className={`fade-in flex-1 px-4 pt-4 ${hideTabs ? "pb-8" : "pb-28"}`}>
        {children(user)}
        <Watermark className="mt-10 pb-2" />
      </main>
      {!hideTabs && (
        <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="grid grid-cols-4">
            {TABS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: true }}
                className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground transition-colors data-[status=active]:text-primary"
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
