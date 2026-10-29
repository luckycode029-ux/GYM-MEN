import { createFileRoute } from "@tanstack/react-router";
import { LineChart as LineIcon } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { repository } from "@/lib/data/repository";
import { useLoad } from "@/lib/useLoad";
import { weekKey } from "@/lib/workout";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Gym Tracker" },
      { name: "description", content: "Charts of your top sets, weekly volume and sessions." },
      { property: "og:title", content: "Progress — Gym Tracker" },
      {
        property: "og:description",
        content: "Charts of your top sets, weekly volume and sessions.",
      },
    ],
  }),
  component: () => <AppShell title="Progress">{(u) => <Progress userId={u.id} />}</AppShell>,
});

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};
const tip = {
  contentStyle: {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
  },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

function Empty({ text }: { text: string }) {
  return (
    <div className="placeholder-box h-40 flex-col gap-2 text-center">
      <LineIcon className="h-6 w-6" />
      {text}
    </div>
  );
}

function Progress({ userId }: { userId: string }) {
  const { data } = useLoad(async () => {
    const [exercises, logs, sessions] = await Promise.all([
      repository.getExercises(),
      repository.getAllSetLogs(userId),
      repository.getSessions(userId),
    ]);
    return { exercises, logs, sessions };
  }, [userId]);
  const [picked, setPicked] = useState<string | null>(null);
  if (!data) return null;

  const { exercises, logs, sessions } = data;
  const logged = exercises.filter((e) => logs.some((l) => l.exercise_id === e.id));
  const exId = picked ?? logged[0]?.id ?? exercises[0]!.id;
  const ex = exercises.find((e) => e.id === exId)!;
  const sessionDate = new Map(sessions.map((s) => [s.id, s.date]));
  const exLogs = logs.filter((l) => l.exercise_id === exId && !l.is_warmup);

  const topSet = [...new Set(exLogs.map((l) => l.session_id))].map((sid) => {
    const sets = exLogs.filter((l) => l.session_id === sid);
    const val =
      ex.tracking === "time"
        ? Math.max(...sets.map((l) => l.duration_seconds ?? 0))
        : ex.tracking === "weight_reps"
          ? Math.max(...sets.map((l) => l.weight_kg ?? 0))
          : Math.max(...sets.map((l) => l.reps ?? 0));
    return { date: sessionDate.get(sid)?.slice(5) ?? "", value: val };
  });

  const weeklySets = new Map<string, number>();
  for (const l of exLogs) {
    const w = weekKey(sessionDate.get(l.session_id) ?? "");
    weeklySets.set(w, (weeklySets.get(w) ?? 0) + 1);
  }
  const weekly = [...weeklySets].sort().map(([w, n]) => ({ week: w.slice(5), sets: n }));

  const perWeek = new Map<string, number>();
  for (const s of sessions) perWeek.set(weekKey(s.date), (perWeek.get(weekKey(s.date)) ?? 0) + 1);
  const sessionsWeekly = [...perWeek].sort().map(([w, n]) => ({ week: w.slice(5), sessions: n }));

  const topLabel =
    ex.tracking === "time"
      ? "Longest set (s)"
      : ex.tracking === "weight_reps"
        ? "Top-set weight (kg)"
        : "Top-set reps";

  return (
    <div className="space-y-6">
      <select
        className="field font-semibold"
        value={exId}
        onChange={(e) => setPicked(e.target.value)}
        aria-label="Exercise"
      >
        {logged.length > 0 && (
          <optgroup label="Logged">
            {logged.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </optgroup>
        )}
        <optgroup label="All exercises">
          {exercises
            .filter((e) => !logged.includes(e))
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
        </optgroup>
      </select>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">{topLabel}</h2>
        {topSet.length === 0 ? (
          <Empty text="Log this exercise to see your progress." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={topSet}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" {...axis} />
              <YAxis width={32} {...axis} />
              <Tooltip {...tip} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Weekly working sets</h2>
        {weekly.length === 0 ? (
          <Empty text="No sets yet for this exercise." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekly}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="week" {...axis} />
              <YAxis width={32} allowDecimals={false} {...axis} />
              <Tooltip {...tip} cursor={{ fill: "var(--color-surface)" }} />
              <Bar dataKey="sets" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Sessions per week</h2>
        {sessionsWeekly.length === 0 ? (
          <Empty text="Start your first workout to fill this in." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sessionsWeekly}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="week" {...axis} />
              <YAxis width={32} allowDecimals={false} {...axis} />
              <Tooltip {...tip} cursor={{ fill: "var(--color-surface)" }} />
              <Bar dataKey="sessions" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}
