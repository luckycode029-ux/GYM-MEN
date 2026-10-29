import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Pencil } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { repository } from "@/lib/data/repository";
import { useLoad } from "@/lib/useLoad";
import { DAY_NAMES, dayOfWeek, formatTarget } from "@/lib/workout";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Weekly plan — Gym Tracker" },
      { name: "description", content: "Your Monday to Sunday training plan." },
      { property: "og:title", content: "Weekly plan — Gym Tracker" },
      { property: "og:description", content: "Your Monday to Sunday training plan." },
    ],
  }),
  component: () => <AppShell title="Plan">{(user) => <Plan userId={user.id} />}</AppShell>,
});

function Plan({ userId }: { userId: string }) {
  const today = dayOfWeek();
  const [open, setOpen] = useState<number | null>(today);
  const { data } = useLoad(async () => {
    const [days, exercises] = await Promise.all([
      repository.getPlanDays(userId),
      repository.getExercises(),
    ]);
    const plans = await Promise.all(
      days.map((d) => repository.getPlanForDay(userId, d.day_of_week)),
    );
    return { days, exercises, plans };
  }, [userId]);
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Mon – Sun schedule
        </span>
        <Link to="/plan/edit" className="btn btn-primary px-3 py-1.5 text-sm">
          <Pencil className="h-4 w-4" /> Edit plan
        </Link>
      </div>

      <ul className="space-y-2">
        {data.days.map((d, i) => {
          const isOpen = open === d.day_of_week;
          const rest = d.is_rest || data.plans[i]!.length === 0;
          return (
            <li
              key={d.day_of_week}
              className={`card ${d.day_of_week === today ? "border-primary/60" : ""}`}
            >
              <button
                disabled={rest}
                onClick={() => setOpen(isOpen ? null : d.day_of_week)}
                className="flex min-h-16 w-full items-center gap-3 px-4 text-left disabled:cursor-default"
              >
                <span className="num w-10 text-lg uppercase text-primary">
                  {DAY_NAMES[i]!.slice(0, 3)}
                </span>
                <span className="flex-1">
                  <span className={`block font-semibold ${rest ? "text-muted-foreground" : ""}`}>
                    {d.title || "Rest"}
                  </span>
                  {!rest ? (
                    <span className="text-sm text-muted-foreground">
                      {data.plans[i]!.length} exercises
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Rest day</span>
                  )}
                </span>
                {!rest && (
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>
              {isOpen && !rest && (
                <ul className="fade-in border-t border-border">
                  {data.plans[i]!.map((p) => {
                    const ex = data.exercises.find((e) => e.id === p.exercise_id);
                    if (!ex) return null;
                    return (
                      <li key={p.id}>
                        <Link
                          to="/exercise/$id"
                          params={{ id: ex.id }}
                          className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 text-sm"
                        >
                          <span>{ex.name}</span>
                          <span className="num shrink-0 text-base text-muted-foreground">
                            {formatTarget(p, ex.tracking)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
