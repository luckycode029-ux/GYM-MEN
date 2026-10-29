import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, Moon, Play } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { repository } from "@/lib/data/repository";
import { useLoad } from "@/lib/useLoad";
import { DAY_NAMES, dayOfWeek, formatTarget, isoDate } from "@/lib/workout";
import { TRAINING_RULES } from "@/data/exercises";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Gym Tracker" },
      { name: "description", content: "Today's workout from your weekly gym plan." },
      { property: "og:title", content: "Gym Tracker" },
      { property: "og:description", content: "Log your weekly gym plan, sets and progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  return <AppShell title="Today">{(user) => <Today userId={user.id} />}</AppShell>;
}

function Today({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const dow = dayOfWeek();
  const today = isoDate();
  const { data } = useLoad(async () => {
    const [days, plan, exercises, session, active, profile] = await Promise.all([
      repository.getPlanDays(userId),
      repository.getPlanForDay(userId, dow),
      repository.getExercises(),
      repository.getSessionForDate(userId, today),
      repository.getActiveSession(userId),
      repository.getProfile(userId),
    ]);
    const logs = session ? await repository.getSetLogsForSession(session.id) : [];
    return {
      day: days.find((d) => d.day_of_week === dow)!,
      plan,
      exercises,
      logs,
      active,
      profile,
    };
  }, [userId, dow, today]);

  if (!data) return null;
  const { day, plan, exercises, logs, active, profile } = data;
  const isRest = day.is_rest || plan.length === 0;

  async function start() {
    await repository.startSession(userId, today, dow);
    navigate({ to: "/workout" });
  }

  return (
    <div className="space-y-4">
      <div>
        {profile?.name ? (
          <div className="mb-0.5 text-xs font-semibold text-muted-foreground">
            Welcome back, <span className="text-foreground">{profile.name}</span>
          </div>
        ) : null}
        <div className="text-sm font-semibold uppercase tracking-wider text-primary">
          {DAY_NAMES[dow - 1]}
        </div>
        <h1 className="num mt-1 text-4xl uppercase leading-none">
          {isRest
            ? day.title && day.title.toLowerCase() !== "rest"
              ? day.title
              : "Rest day"
            : day.title}
        </h1>
      </div>

      {isRest ? (
        <div className="card flex flex-col items-center px-6 py-12 text-center">
          <Moon className="h-10 w-10 text-primary" />
          <p className="mt-4 text-lg font-semibold">Recover and recharge.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sleep well, eat well, take a walk. Back at it tomorrow.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {plan.map((p) => {
              const ex = exercises.find((e) => e.id === p.exercise_id)!;
              const alt = exercises.find((e) => e.alternate_of === ex.id);
              const done = logs.filter(
                (l) => !l.is_warmup && (l.exercise_id === ex.id || l.exercise_id === alt?.id),
              ).length;
              const complete = done >= p.target_sets;
              return (
                <li key={p.id}>
                  <Link
                    to="/exercise/$id"
                    params={{ id: ex.id }}
                    className="card flex min-h-16 items-center gap-3 px-4 py-3"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${complete ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
                    >
                      {complete ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="num text-sm">{p.sort_order}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{ex.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatTarget(p, ex.tracking)}
                        {done > 0 && !complete && ` · ${done}/${p.target_sets} done`}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <button onClick={start} className="btn btn-primary w-full text-lg">
            <Play className="h-5 w-5" /> {active ? "Resume workout" : "Start workout"}
          </button>
        </>
      )}
      <RulesCard />
    </div>
  );
}

function RulesCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <button
        onClick={() => setOpen(!open)}
        className="flex min-h-12 w-full items-center justify-between px-4 font-semibold"
      >
        Rules
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="fade-in space-y-2 px-4 pb-4 text-sm text-muted-foreground">
          {TRAINING_RULES.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-primary">•</span>
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
