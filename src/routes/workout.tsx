import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Info,
  Minus,
  Plus,
  Timer,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { repository } from "@/lib/data/repository";
import type { Exercise, PlanDayExercise, SetLog, WorkoutSession } from "@/lib/data/types";
import { useLoad } from "@/lib/useLoad";
import {
  formatSet,
  formatTarget,
  lastSessionWorkingSets,
  readyToIncrease,
  summarize,
} from "@/lib/workout";

export const Route = createFileRoute("/workout")({
  head: () => ({
    meta: [{ title: "Workout — Gym Tracker" }, { name: "description", content: "Log your sets." }],
  }),
  component: () => (
    <AppShell title="Workout" hideTabs>
      {(u) => <Workout userId={u.id} />}
    </AppShell>
  ),
});

interface Loaded {
  session: WorkoutSession;
  plan: PlanDayExercise[];
  exercises: Exercise[];
  sessionLogs: SetLog[];
  allLogs: SetLog[];
}

function Workout({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { data, reload } = useLoad<Loaded | null>(async () => {
    const session = await repository.getActiveSession(userId);
    if (!session) return null;
    const planPromise =
      session.planned_exercises && session.planned_exercises.length > 0
        ? Promise.resolve(session.planned_exercises)
        : repository.getPlanForDay(userId, session.day_of_week);
    const [plan, exercises, sessionLogs, allLogs] = await Promise.all([
      planPromise,
      repository.getExercises(),
      repository.getSetLogsForSession(session.id),
      repository.getAllSetLogs(userId),
    ]);
    return { session, plan, exercises, sessionLogs, allLogs };
  }, [userId]);
  const [index, setIndex] = useState(0);
  const [swapped, setSwapped] = useState<Record<string, boolean>>({});
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [summary, setSummary] = useState<ReturnType<typeof summarize> | null>(null);

  useEffect(() => {
    if (data === null && !summary) navigate({ to: "/" });
  }, [data, summary, navigate]);

  if (summary) return <Summary s={summary} />;
  if (!data) return null;
  if (data.plan.length === 0)
    return <p className="text-muted-foreground">No exercises planned for this day.</p>;

  const item = data.plan[Math.min(index, data.plan.length - 1)]!;
  const main = data.exercises.find((e) => e.id === item.exercise_id)!;
  const alt = data.exercises.find((e) => e.alternate_of === main.id) ?? null;
  // Swapped if toggled, or if alternate already has logs this session (survives refresh).
  const isSwapped =
    swapped[item.id] ?? (!!alt && data.sessionLogs.some((l) => l.exercise_id === alt.id));
  const ex = isSwapped && alt ? alt : main;

  async function finish() {
    const logs = await repository.getSetLogsForSession(data!.session.id);
    await repository.endSession(data!.session.id);
    setSummary(summarize(logs));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          aria-label="Previous exercise"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          className="btn btn-ghost px-3"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 text-center text-sm font-semibold text-muted-foreground">
          Exercise <span className="num text-lg text-foreground">{index + 1}</span> /{" "}
          {data.plan.length}
        </div>
        <button
          aria-label="Next exercise"
          disabled={index >= data.plan.length - 1}
          onClick={() => setIndex(index + 1)}
          className="btn btn-ghost px-3"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <ExerciseLogger
        key={`${item.id}-${ex.id}`}
        item={item}
        ex={ex}
        alt={isSwapped ? main : alt}
        isSwapped={isSwapped}
        onSwap={() => setSwapped({ ...swapped, [item.id]: !isSwapped })}
        session={data.session}
        sessionLogs={data.sessionLogs.filter((l) => l.exercise_id === ex.id)}
        history={data.allLogs.filter((l) => l.exercise_id === ex.id)}
        onLogged={(log) => {
          reload();
          if (!log.is_warmup) setRestEnd(Date.now() + item.rest_seconds * 1000);
        }}
        onDeleted={reload}
      />

      {index >= data.plan.length - 1 ? (
        <button onClick={finish} className="btn btn-primary w-full text-lg">
          Finish workout
        </button>
      ) : (
        <button onClick={finish} className="btn btn-ghost w-full">
          Finish workout early
        </button>
      )}

      {restEnd && (
        <RestTimer
          end={restEnd}
          onAdd={() => setRestEnd(restEnd + 30_000)}
          onDone={() => setRestEnd(null)}
        />
      )}
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  step,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  unit?: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(0, +(value - step).toFixed(2)))}
          className="btn btn-ghost h-14 w-14 shrink-0 p-0"
        >
          <Minus className="h-6 w-6" />
        </button>
        <div className="relative flex-1">
          <input
            inputMode="decimal"
            aria-label={label}
            value={value}
            onChange={(e) => onChange(Number(e.target.value.replace(",", ".")) || 0)}
            className="num h-14 w-full rounded-xl bg-surface text-center text-3xl outline-none focus:ring-2 focus:ring-ring"
          />
          {unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
        <button
          aria-label={`Increase ${label}`}
          onClick={() => onChange(+(value + step).toFixed(2))}
          className="btn btn-ghost h-14 w-14 shrink-0 p-0"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

function ExerciseLogger(props: {
  item: PlanDayExercise;
  ex: Exercise;
  alt: Exercise | null;
  isSwapped: boolean;
  onSwap: () => void;
  session: WorkoutSession;
  sessionLogs: SetLog[];
  history: SetLog[];
  onLogged: (l: SetLog) => void;
  onDeleted: () => void;
}) {
  const { item, ex, alt, isSwapped, onSwap, session, sessionLogs, history } = props;
  const last = useMemo(() => lastSessionWorkingSets(history, session.id), [history, session.id]);
  const ready = readyToIncrease(last, item.rep_max, ex.tracking);
  const timed = ex.tracking === "time";
  const workingDone = sessionLogs.filter((l) => !l.is_warmup).length;
  const prefill =
    last[workingDone] ?? last.at(-1) ?? sessionLogs.filter((l) => !l.is_warmup).at(-1);

  const [weight, setWeight] = useState(prefill?.weight_kg ?? 0);
  const [reps, setReps] = useState(
    timed ? (prefill?.duration_seconds ?? item.rep_min) : (prefill?.reps ?? item.rep_max),
  );
  const [rir, setRir] = useState<number | null>(null);
  const [warmup, setWarmup] = useState(false);
  const [note, setNote] = useState("");

  async function log() {
    const l = await repository.addSetLog({
      session_id: session.id,
      exercise_id: ex.id,
      set_number: sessionLogs.length + 1,
      weight_kg: ex.tracking === "weight_reps" ? weight : weight || null,
      reps: timed ? null : reps,
      duration_seconds: timed ? reps : null,
      reps_in_reserve: rir,
      is_warmup: warmup,
      note: note.trim() || null,
    });
    setNote("");
    setWarmup(false);
    setRir(null);
    props.onLogged(l);
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {isSwapped && <div className="text-xs font-bold uppercase text-primary">Alternate</div>}
            <h1 className="num text-3xl uppercase leading-tight">{ex.name}</h1>
            <div className="mt-1 text-sm text-muted-foreground">
              {formatTarget(item, ex.tracking)} · rest {item.rest_seconds}s
            </div>
          </div>
          <Link
            to="/exercise/$id"
            params={{ id: ex.id }}
            aria-label="Exercise info"
            className="tap flex items-center justify-center rounded-full bg-secondary"
          >
            <Info className="h-5 w-5" />
          </Link>
        </div>
        {last.length > 0 && (
          <p className="mt-3 text-sm">
            <span className="text-muted-foreground">Last time: </span>
            <span className="num text-base">
              {timed
                ? last.map((l) => `${l.duration_seconds}s`).join(", ")
                : `${last[0]?.weight_kg ? `${last[0]?.weight_kg} kg × ` : ""}${last.map((l) => l.reps).join(", ")}`}
            </span>
          </p>
        )}
        {ready && (
          <p className="mt-2 flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">
            <TrendingUp className="h-4 w-4" /> Ready to increase weight
          </p>
        )}
        {alt && (
          <button onClick={onSwap} className="btn btn-ghost mt-3 w-full text-sm">
            <ArrowLeftRight className="h-4 w-4" />{" "}
            {isSwapped ? `Back to ${alt.name}` : `Swap to ${alt.name}`}
          </button>
        )}
      </div>

      {sessionLogs.length > 0 && (
        <ul className="space-y-1">
          {sessionLogs.map((l, i) => (
            <li key={l.id} className="flex min-h-12 items-center gap-3 rounded-xl bg-surface px-4">
              <span className="num w-6 text-muted-foreground">
                {l.is_warmup ? "W" : sessionLogs.slice(0, i + 1).filter((x) => !x.is_warmup).length}
              </span>
              <span className="num flex-1 text-xl">
                {formatSet(l, ex.tracking)}
                {timed ? "" : ex.tracking === "weight_reps" ? "" : " reps"}
              </span>
              {l.reps_in_reserve != null && (
                <span className="text-xs text-muted-foreground">RIR {l.reps_in_reserve}</span>
              )}
              {l.note && (
                <span className="max-w-24 truncate text-xs text-muted-foreground">{l.note}</span>
              )}
              <button
                aria-label="Delete set"
                onClick={async () => {
                  await repository.deleteSetLog(l.id);
                  props.onDeleted();
                }}
                className="tap flex items-center justify-center text-muted-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="card space-y-4 p-4">
        <div className="text-sm font-semibold">
          {warmup ? "Warm-up set" : `Set ${workingDone + 1} of ${item.target_sets}`}
        </div>
        {ex.tracking !== "time" && (
          <Stepper
            label={ex.tracking === "bodyweight_reps" ? "Added weight" : "Weight"}
            unit="kg"
            value={weight}
            onChange={setWeight}
            step={2.5}
          />
        )}
        <Stepper
          label={timed ? "Seconds" : item.per_side ? "Reps (each side)" : "Reps"}
          value={reps}
          onChange={setReps}
          step={timed ? 5 : 1}
        />
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Reps in reserve
          </div>
          <div className="grid grid-cols-6 gap-1">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRir(rir === n ? null : n)}
                className={`num h-12 rounded-lg text-lg transition-colors ${rir === n ? "bg-primary text-primary-foreground" : "bg-surface"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <label className="flex min-h-12 items-center justify-between rounded-lg bg-surface px-4">
          <span className="font-semibold">Warm-up set</span>
          <input
            type="checkbox"
            checked={warmup}
            onChange={(e) => setWarmup(e.target.checked)}
            className="h-6 w-6 accent-primary"
          />
        </label>
        <input
          className="field"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button onClick={log} className="btn btn-primary w-full text-lg">
          Log set
        </button>
      </div>
    </div>
  );
}

function RestTimer({ end, onAdd, onDone }: { end: number; onAdd: () => void; onDone: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((end - now) / 1000));
  useEffect(() => {
    if (left === 0) {
      navigator.vibrate?.(300);
      const t = setTimeout(onDone, 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [left, onDone]);
  return (
    <div className="fade-in fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-primary/40 bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3">
        <Timer className="h-6 w-6 text-primary" />
        <div className="flex-1">
          <div className="text-xs font-bold uppercase text-muted-foreground">
            {left === 0 ? "Go!" : "Rest"}
          </div>
          <div className="num text-4xl">
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
          </div>
        </div>
        <button onClick={onAdd} className="btn btn-ghost">
          +30 s
        </button>
        <button onClick={onDone} aria-label="Skip rest" className="btn btn-primary px-4">
          <X className="h-5 w-5" /> Skip
        </button>
      </div>
    </div>
  );
}

function Summary({ s }: { s: ReturnType<typeof summarize> }) {
  return (
    <div className="fade-in space-y-6 py-8 text-center">
      <h1 className="num text-5xl uppercase text-primary">Workout done</h1>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Sets", s.totalSets],
          ["Volume kg", Math.round(s.volume)],
          ["Exercises", s.exercises],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <div className="num text-3xl">{v}</div>
            <div className="text-xs text-muted-foreground">{k}</div>
          </div>
        ))}
      </div>
      <Link to="/" className="btn btn-primary w-full">
        Back to Today
      </Link>
    </div>
  );
}
