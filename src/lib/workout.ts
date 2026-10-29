import type { PlanDayExercise, SetLog, Tracking } from "./data/types";

export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Mon=1 … Sun=7 */
export function dayOfWeek(d = new Date()) {
  return ((d.getDay() + 6) % 7) + 1;
}

export function isoDate(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Monday (YYYY-MM-DD) of the week containing the date string. */
export function weekKey(date: string) {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() - (dayOfWeek(d) - 1));
  return isoDate(d);
}

export function formatTarget(p: PlanDayExercise, tracking: Tracking) {
  const range = p.rep_min === p.rep_max ? `${p.rep_min}` : `${p.rep_min}-${p.rep_max}`;
  if (tracking === "time") {
    if (p.rep_min >= 120) return `${p.target_sets} × ${p.rep_min / 60}-${p.rep_max / 60} min`;
    return `${p.target_sets} × ${range} s`;
  }
  return `${p.target_sets} × ${range}${p.per_side ? " each side" : ""}`;
}

/** Group logs by session, newest session first. */
export function groupBySession(logs: SetLog[]) {
  const map = new Map<string, SetLog[]>();
  for (const l of logs) {
    if (!map.has(l.session_id)) map.set(l.session_id, []);
    map.get(l.session_id)!.push(l);
  }
  return [...map.values()]
    .map((sets) => sets.sort((a, b) => a.set_number - b.set_number))
    .sort((a, b) => b[0]!.logged_at.localeCompare(a[0]!.logged_at));
}

/** Working sets from the most recent session other than `excludeSessionId`. */
export function lastSessionWorkingSets(logs: SetLog[], excludeSessionId?: string) {
  const groups = groupBySession(logs.filter((l) => l.session_id !== excludeSessionId));
  return (groups[0] ?? []).filter((l) => !l.is_warmup);
}

/** True when every working set in the last session reached rep_max (or seconds max for timed). */
export function readyToIncrease(lastWorking: SetLog[], repMax: number, tracking: Tracking) {
  if (lastWorking.length === 0) return false;
  return lastWorking.every((l) => {
    const v = tracking === "time" ? l.duration_seconds : l.reps;
    return v != null && v >= repMax;
  });
}

export function summarize(logs: SetLog[]) {
  const working = logs.filter((l) => !l.is_warmup);
  return {
    totalSets: working.length,
    volume: working.reduce((s, l) => s + (l.weight_kg ?? 0) * (l.reps ?? 0), 0),
    exercises: new Set(logs.map((l) => l.exercise_id)).size,
  };
}

export function formatSet(l: SetLog, tracking: Tracking) {
  if (tracking === "time") return `${l.duration_seconds ?? 0}s`;
  if (tracking === "bodyweight_reps" && !l.weight_kg) return `${l.reps ?? 0}`;
  return `${l.weight_kg ?? 0} × ${l.reps ?? 0}`;
}
