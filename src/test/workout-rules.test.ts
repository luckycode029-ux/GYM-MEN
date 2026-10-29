import { describe, expect, it } from "vitest";
import { EXERCISES, PLAN } from "@/data/exercises";
import { readyToIncrease, dayOfWeek } from "@/lib/workout";
import type { SetLog } from "@/lib/data/types";

const log = (reps: number, warm = false): SetLog => ({
  id: String(Math.random()),
  session_id: "s",
  exercise_id: "e",
  set_number: 1,
  weight_kg: 40,
  reps,
  duration_seconds: null,
  reps_in_reserve: null,
  is_warmup: warm,
  note: null,
  logged_at: "",
});

describe("workout rules", () => {
  it("ready to increase only when every working set hit rep_max", () => {
    expect(readyToIncrease([log(12), log(12), log(12)], 12, "weight_reps")).toBe(true);
    expect(readyToIncrease([log(12), log(12), log(11)], 12, "weight_reps")).toBe(false);
  });
  it("rest defaults: compound 150 s, isolation 75 s, core 60 s", () => {
    const rest = (id: string) => PLAN.find((p) => p.exercise_id === id)!.rest_seconds;
    expect(rest("ex-wide-lat-pulldown")).toBe(150);
    expect(rest("ex-face-pulls")).toBe(75);
    expect(rest("ex-dead-bugs")).toBe(60);
  });
  it("Saturday reuses Tuesday's lateral raise and pushdown records", () => {
    expect(EXERCISES.filter((e) => e.name === "Cable lateral raises")).toHaveLength(1);
    expect(
      PLAN.filter((p) => p.exercise_id === "ex-rope-pushdown").map((p) => p.day_of_week),
    ).toEqual([2, 6]);
  });
  it("Thursday and Sunday are rest days", () => {
    expect(PLAN.some((p) => p.day_of_week === 4 || p.day_of_week === 7)).toBe(false);
  });
  it("Monday is day 1, Sunday day 7", () => {
    expect(dayOfWeek(new Date(2026, 9, 26))).toBe(1);
    expect(dayOfWeek(new Date(2026, 10, 1))).toBe(7);
  });
  it("all media starts blank", () => {
    expect(EXERCISES.every((e) => e.gif_url === null && e.youtube_id === null)).toBe(true);
  });
});
