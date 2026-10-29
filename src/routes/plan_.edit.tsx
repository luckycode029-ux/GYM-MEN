import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { REST_DEFAULTS } from "@/data/exercises";
import { repository } from "@/lib/data/repository";
import type {
  CustomExerciseInput,
  Exercise,
  MovementType,
  Tracking,
  UserPlan,
  UserPlanDay,
  UserPlanDayExercise,
} from "@/lib/data/types";
import { useLoad } from "@/lib/useLoad";
import { DAY_NAMES } from "@/lib/workout";

export const Route = createFileRoute("/plan_/edit")({
  head: () => ({
    meta: [
      { title: "Edit Plan — Gym Tracker" },
      { name: "description", content: "Customize your weekly workout plan." },
    ],
  }),
  component: () => (
    <AppShell title="Edit plan" hideTabs>
      {(user) => <PlanEditor userId={user.id} />}
    </AppShell>
  ),
});

interface PlanValidationError {
  dayIndex: number;
  message: string;
}

function validatePlan(plan: UserPlan): PlanValidationError[] {
  const errors: PlanValidationError[] = [];
  plan.days.forEach((day, dayIndex) => {
    if (!day.title.trim()) {
      errors.push({ dayIndex, message: `${DAY_NAMES[dayIndex]}: Day title is required.` });
    }
    if (day.exercises.length > 12) {
      errors.push({
        dayIndex,
        message: `${DAY_NAMES[dayIndex]}: Max 12 exercises per day (currently ${day.exercises.length}).`,
      });
    }
    day.exercises.forEach((ex, exIndex) => {
      const prefix = `${DAY_NAMES[dayIndex]} exercise #${exIndex + 1}`;
      if (ex.target_sets < 1 || ex.target_sets > 10) {
        errors.push({ dayIndex, message: `${prefix}: Sets must be between 1 and 10.` });
      }
      if (ex.rep_min < 1 || ex.rep_min > 100) {
        errors.push({
          dayIndex,
          message: `${prefix}: Min reps/seconds must be between 1 and 100.`,
        });
      }
      if (ex.rep_max < 1 || ex.rep_max > 100) {
        errors.push({
          dayIndex,
          message: `${prefix}: Max reps/seconds must be between 1 and 100.`,
        });
      }
      if (ex.rep_min > ex.rep_max) {
        errors.push({ dayIndex, message: `${prefix}: Min reps cannot exceed max reps.` });
      }
      if (ex.rest_seconds < 0 || ex.rest_seconds > 600) {
        errors.push({ dayIndex, message: `${prefix}: Rest must be between 0 and 600 seconds.` });
      }
    });
  });
  return errors;
}

function PlanEditor({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { data } = useLoad(async () => {
    const [userPlan, exercises] = await Promise.all([
      repository.getUserPlan(userId),
      repository.listExercises(userId),
    ]);
    return { userPlan, exercises };
  }, [userId]);

  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (data && !plan) {
      setPlan(structuredClone(data.userPlan));
      setExercisesList(data.exercises);
    }
  }, [data, plan]);

  // Browser navigation safety
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  if (!plan) return null;

  const currentDay: UserPlanDay = plan.days[selectedDayIndex]!;
  const errors = validatePlan(plan);
  const currentDayErrors = errors.filter((e) => e.dayIndex === selectedDayIndex);
  const isValid = errors.length === 0;

  function updateCurrentDay(updater: (prev: UserPlanDay) => UserPlanDay) {
    setPlan((prev) => {
      if (!prev) return prev;
      const nextDays = [...prev.days];
      nextDays[selectedDayIndex] = updater(nextDays[selectedDayIndex]!);
      return { ...prev, days: nextDays };
    });
    setIsDirty(true);
  }

  function handleDayTitleChange(title: string) {
    updateCurrentDay((day) => ({ ...day, title }));
  }

  function handleToggleRest(isRest: boolean) {
    if (isRest && currentDay.exercises.length > 0) {
      const ok = window.confirm(
        "Mark this day as a rest day? Its exercises will be kept in your plan but hidden from your active workout schedule.",
      );
      if (!ok) return;
    }
    updateCurrentDay((day) => ({ ...day, is_rest: isRest }));
  }

  function handleExerciseChange(index: number, updates: Partial<UserPlanDayExercise>) {
    updateCurrentDay((day) => {
      const exercises = [...day.exercises];
      exercises[index] = { ...exercises[index]!, ...updates };
      return { ...day, exercises };
    });
  }

  function handleMoveExercise(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= currentDay.exercises.length) return;
    updateCurrentDay((day) => {
      const exercises = [...day.exercises];
      const [item] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, item!);
      // re-assign sort_orders
      return {
        ...day,
        exercises: exercises.map((ex, i) => ({ ...ex, sort_order: i + 1 })),
      };
    });
  }

  function handleRemoveExercise(index: number) {
    const ex = currentDay.exercises[index]!;
    const exData = exercisesList.find((e) => e.id === ex.exercise_id);
    const name = exData ? exData.name : "this exercise";
    const ok = window.confirm(
      `Remove "${name}" from this day's plan?\n\n(This only removes it from your routine. It does NOT delete the exercise or past workout history.)`,
    );
    if (!ok) return;

    updateCurrentDay((day) => {
      const exercises = day.exercises
        .filter((_, i) => i !== index)
        .map((e, i) => ({ ...e, sort_order: i + 1 }));
      return { ...day, exercises };
    });
  }

  function handleAddExerciseToPlan(exerciseId: string, alternateId?: string | null) {
    if (currentDay.exercises.length >= 12) {
      alert("A day can have a maximum of 12 exercises.");
      return;
    }
    const exData = exercisesList.find((e) => e.id === exerciseId);
    if (!exData) return;

    const isTimed = exData.tracking === "time";
    const restSeconds = REST_DEFAULTS[exData.movement_type] ?? 90;

    const newPlanExercise: UserPlanDayExercise = {
      id: `user-plan-${currentDay.day_of_week}-${exerciseId}-${Date.now()}`,
      day_of_week: currentDay.day_of_week,
      exercise_id: exerciseId,
      sort_order: currentDay.exercises.length + 1,
      target_sets: 3,
      rep_min: isTimed ? 30 : 8,
      rep_max: isTimed ? 45 : 12,
      rest_seconds: restSeconds,
      per_side: false,
    };

    updateCurrentDay((day) => ({
      ...day,
      exercises: [...day.exercises, newPlanExercise],
    }));
    setPickerOpen(false);
  }

  async function handleResetToDefault() {
    const ok = window.confirm(
      "Reset your weekly plan to the default seed plan?\n\nAny customizations you made will be replaced by the default routine. Past logged sessions and history will remain intact.",
    );
    if (!ok) return;

    const fresh = await repository.resetUserPlan(userId);
    setPlan(fresh);
    setIsDirty(false);
    alert("Weekly plan reset to default.");
  }

  async function handleSave() {
    if (!plan || !isValid) return;
    setSaving(true);
    try {
      await repository.saveUserPlan(userId, plan);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => {
        navigate({ to: "/plan" });
      }, 500);
    } finally {
      setSaving(false);
    }
  }

  function handleLeave() {
    if (isDirty) {
      const ok = window.confirm("You have unsaved changes in your plan. Discard them?");
      if (!ok) return;
    }
    navigate({ to: "/plan" });
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Top action header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <button onClick={handleLeave} className="btn btn-ghost px-2 text-sm text-muted-foreground">
          <ChevronLeft className="h-5 w-5" /> Back to plan
        </button>
        <button
          onClick={handleResetToDefault}
          className="btn btn-ghost flex items-center gap-1.5 px-3 text-xs text-muted-foreground hover:text-destructive"
        >
          <RotateCcw className="h-4 w-4" /> Reset to default
        </button>
      </div>

      {/* Days navigation bar */}
      <div className="grid grid-cols-7 gap-1">
        {plan.days.map((d, i) => {
          const isSelected = i === selectedDayIndex;
          const hasError = errors.some((e) => e.dayIndex === i);
          const isDayRest = d.is_rest || d.exercises.length === 0;
          return (
            <button
              key={d.day_of_week}
              onClick={() => setSelectedDayIndex(i)}
              className={`flex flex-col items-center justify-center rounded-xl py-2 text-xs font-semibold transition-colors ${
                isSelected
                  ? "border border-primary bg-primary/10 text-primary"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              } ${hasError ? "ring-2 ring-destructive" : ""}`}
            >
              <span className="num uppercase">{DAY_NAMES[i]!.slice(0, 3)}</span>
              <span className="mt-0.5 text-[10px] opacity-75">
                {isDayRest ? "Rest" : `${d.exercises.length} ex`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Day Details */}
      <div className="card space-y-4 p-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Day Title
          </label>
          <input
            className={`field w-full ${!currentDay.title.trim() ? "border-destructive focus:ring-destructive" : ""}`}
            value={currentDay.title}
            onChange={(e) => handleDayTitleChange(e.target.value)}
            placeholder="e.g. Pull A — Back + Biceps"
          />
          {!currentDay.title.trim() && (
            <p className="mt-1 text-xs text-destructive">Day title is required.</p>
          )}
        </div>

        <label className="flex min-h-12 items-center justify-between rounded-xl bg-surface px-4">
          <div>
            <span className="block font-semibold">Rest day</span>
            <span className="block text-xs text-muted-foreground">
              {currentDay.is_rest ? "Scheduled as recovery day" : "Scheduled workout day"}
            </span>
          </div>
          <input
            type="checkbox"
            checked={currentDay.is_rest}
            onChange={(e) => handleToggleRest(e.target.checked)}
            className="h-6 w-6 accent-primary"
          />
        </label>

        {currentDay.is_rest && (
          <div className="rounded-lg bg-surface/50 p-3 text-xs text-muted-foreground">
            💡 This day is marked as a rest day. Exercises configured below are retained and will
            reactivate whenever Rest day is untoggled.
          </div>
        )}
      </div>

      {/* Exercises Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Exercises ({currentDay.exercises.length}/12)
          </h2>
          <button
            onClick={() => setPickerOpen(true)}
            disabled={currentDay.exercises.length >= 12}
            className="btn btn-primary px-3 py-1.5 text-xs"
          >
            <Plus className="h-4 w-4" /> Add exercise
          </button>
        </div>

        {currentDay.exercises.length === 0 ? (
          <div className="card flex flex-col items-center px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No exercises added for this day.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Days with no exercises count as rest days.
            </p>
            <button
              onClick={() => setPickerOpen(true)}
              className="btn btn-ghost mt-3 border border-border text-xs"
            >
              <Plus className="h-4 w-4" /> Add an exercise
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {currentDay.exercises.map((item, index) => {
              const ex = exercisesList.find((e) => e.id === item.exercise_id);
              const alt = ex?.alternate_of
                ? exercisesList.find((e) => e.id === ex.alternate_of)
                : exercisesList.find((e) => e.alternate_of === ex?.id);
              const timed = ex?.tracking === "time";

              const setsErr = item.target_sets < 1 || item.target_sets > 10;
              const repMinErr = item.rep_min < 1 || item.rep_min > 100;
              const repMaxErr = item.rep_max < 1 || item.rep_max > 100;
              const repOrderErr = item.rep_min > item.rep_max;
              const restErr = item.rest_seconds < 0 || item.rest_seconds > 600;

              return (
                <li key={item.id} className="card space-y-3 p-4">
                  {/* Item header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs text-muted-foreground">
                          {index + 1}
                        </span>
                        <h3 className="truncate font-semibold">{ex ? ex.name : "Exercise"}</h3>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {ex?.muscle_group} · {ex?.movement_type} · {ex?.tracking}
                        {alt && ` (Alternate: ${alt.name})`}
                      </div>
                    </div>

                    {/* Up / Down / Delete actions */}
                    <div className="flex items-center gap-1">
                      <button
                        aria-label="Move up"
                        disabled={index === 0}
                        onClick={() => handleMoveExercise(index, index - 1)}
                        className="btn btn-ghost h-8 w-8 p-0 text-muted-foreground disabled:opacity-20"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        aria-label="Move down"
                        disabled={index === currentDay.exercises.length - 1}
                        onClick={() => handleMoveExercise(index, index + 1)}
                        className="btn btn-ghost h-8 w-8 p-0 text-muted-foreground disabled:opacity-20"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        aria-label="Remove exercise"
                        onClick={() => handleRemoveExercise(index)}
                        className="btn btn-ghost h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Config fields grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    {/* Target sets */}
                    <div>
                      <label className="mb-1 block font-bold text-muted-foreground">
                        Sets (1-10)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={item.target_sets}
                        onChange={(e) =>
                          handleExerciseChange(index, { target_sets: Number(e.target.value) || 0 })
                        }
                        className={`field h-10 w-full text-center ${setsErr ? "border-destructive focus:ring-destructive" : ""}`}
                      />
                      {setsErr && <p className="mt-0.5 text-[10px] text-destructive">1–10</p>}
                    </div>

                    {/* Rep / Second min */}
                    <div>
                      <label className="mb-1 block font-bold text-muted-foreground">
                        {timed ? "Min Sec (1-100)" : "Min Reps (1-100)"}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={item.rep_min}
                        onChange={(e) =>
                          handleExerciseChange(index, { rep_min: Number(e.target.value) || 0 })
                        }
                        className={`field h-10 w-full text-center ${repMinErr || repOrderErr ? "border-destructive focus:ring-destructive" : ""}`}
                      />
                      {repMinErr && <p className="mt-0.5 text-[10px] text-destructive">1–100</p>}
                    </div>

                    {/* Rep / Second max */}
                    <div>
                      <label className="mb-1 block font-bold text-muted-foreground">
                        {timed ? "Max Sec (1-100)" : "Max Reps (1-100)"}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={item.rep_max}
                        onChange={(e) =>
                          handleExerciseChange(index, { rep_max: Number(e.target.value) || 0 })
                        }
                        className={`field h-10 w-full text-center ${repMaxErr || repOrderErr ? "border-destructive focus:ring-destructive" : ""}`}
                      />
                      {repMaxErr && <p className="mt-0.5 text-[10px] text-destructive">1–100</p>}
                      {repOrderErr && !repMaxErr && (
                        <p className="mt-0.5 text-[10px] text-destructive">&gt;= min</p>
                      )}
                    </div>

                    {/* Rest seconds */}
                    <div>
                      <label className="mb-1 block font-bold text-muted-foreground">
                        Rest s (0-600)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={600}
                        step={5}
                        value={item.rest_seconds}
                        onChange={(e) =>
                          handleExerciseChange(index, { rest_seconds: Number(e.target.value) || 0 })
                        }
                        className={`field h-10 w-full text-center ${restErr ? "border-destructive focus:ring-destructive" : ""}`}
                      />
                      {restErr && <p className="mt-0.5 text-[10px] text-destructive">0–600s</p>}
                    </div>
                  </div>

                  {/* Per side toggle */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={item.per_side}
                      onChange={(e) => handleExerciseChange(index, { per_side: e.target.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>Per side (reps apply to each side)</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Validation banner */}
      {currentDayErrors.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <div className="font-bold">Please correct the following:</div>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {currentDayErrors.map((err, i) => (
              <li key={i}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Fixed bottom Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-border bg-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLeave}
            className="btn btn-ghost flex-1 text-sm text-muted-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isValid || saving}
            onClick={handleSave}
            className="btn btn-primary flex-1 text-base font-bold disabled:opacity-40"
          >
            {saving ? (
              "Saving..."
            ) : saveSuccess ? (
              <>
                <Check className="h-4 w-4" /> Saved!
              </>
            ) : (
              "Save plan"
            )}
          </button>
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {pickerOpen && (
        <ExercisePickerModal
          userId={userId}
          exercises={exercisesList}
          onSelect={handleAddExerciseToPlan}
          onCustomCreated={(newEx) => {
            setExercisesList((prev) => [...prev, newEx]);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function ExercisePickerModal({
  userId,
  exercises,
  onSelect,
  onCustomCreated,
  onClose,
}: {
  userId: string;
  exercises: Exercise[];
  onSelect: (exerciseId: string, alternateId?: string | null) => void;
  onCustomCreated: (newEx: Exercise) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string>("All");
  const [selectedExId, setSelectedExId] = useState<string | null>(null);
  const [alternateId, setAlternateId] = useState<string>("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  const muscleGroups = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((e) => {
      if (e.muscle_group) set.add(e.muscle_group);
    });
    return ["All", ...Array.from(set).sort()];
  }, [exercises]);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (e.is_alternate) return false; // Show main exercises in primary picker list
      const matchesSearch =
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.muscle_group.toLowerCase().includes(query.toLowerCase());
      const matchesMuscle = muscleFilter === "All" || e.muscle_group === muscleFilter;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, query, muscleFilter]);

  const selectedExercise = exercises.find((e) => e.id === selectedExId);

  // Available alternates for the chosen exercise
  const availableAlternates = useMemo(() => {
    if (!selectedExercise) return [];
    return exercises.filter(
      (e) =>
        e.id !== selectedExercise.id &&
        (e.muscle_group === selectedExercise.muscle_group ||
          e.alternate_of === selectedExercise.id),
    );
  }, [exercises, selectedExercise]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="fade-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-card p-4 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-bold">
            {showCustomForm ? "Create custom exercise" : "Choose an exercise"}
          </h2>
          <button onClick={onClose} className="tap text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {showCustomForm ? (
          <CustomExerciseForm
            userId={userId}
            existingExercises={exercises}
            onCreated={(newEx) => {
              onCustomCreated(newEx);
              setShowCustomForm(false);
              onSelect(newEx.id);
            }}
            onCancel={() => setShowCustomForm(false)}
          />
        ) : (
          <div className="space-y-4 pt-3">
            {/* Search and action bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="field pl-9"
                  placeholder="Search exercise or muscle..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowCustomForm(true)}
                className="btn btn-ghost shrink-0 border border-border text-xs"
              >
                + Custom
              </button>
            </div>

            {/* Muscle group filter chips */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
              {muscleGroups.map((g) => (
                <button
                  key={g}
                  onClick={() => setMuscleFilter(g)}
                  className={`shrink-0 rounded-full px-3 py-1 font-semibold transition-colors ${
                    muscleFilter === g
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Exercises list */}
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filtered.map((e) => {
                const isSelected = e.id === selectedExId;
                return (
                  <button
                    key={e.id}
                    onClick={() => {
                      setSelectedExId(e.id);
                      // default alternate if configured in seed
                      const defaultAlt = exercises.find((alt) => alt.alternate_of === e.id);
                      setAlternateId(defaultAlt ? defaultAlt.id : "");
                    }}
                    className={`flex min-h-12 w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? "border border-primary bg-primary/10 text-primary"
                        : "bg-surface text-foreground hover:bg-surface/80"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm">{e.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.muscle_group} · {e.movement_type} · {e.tracking}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No matching exercises found.
                </div>
              )}
            </div>

            {/* Optional alternate selector when an exercise is picked */}
            {selectedExercise && (
              <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Optional Alternate (swap-in during workout)
                </label>
                <select
                  value={alternateId}
                  onChange={(e) => setAlternateId(e.target.value)}
                  className="field h-10 w-full text-xs"
                >
                  <option value="">None</option>
                  {availableAlternates.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.muscle_group})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="btn btn-ghost flex-1 text-sm text-muted-foreground"
              >
                Cancel
              </button>
              <button
                disabled={!selectedExId}
                onClick={() => {
                  if (selectedExId) onSelect(selectedExId, alternateId || null);
                }}
                className="btn btn-primary flex-1 text-sm font-semibold disabled:opacity-40"
              >
                Add to day
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomExerciseForm({
  userId,
  existingExercises,
  onCreated,
  onCancel,
}: {
  userId: string;
  existingExercises: Exercise[];
  onCreated: (ex: Exercise) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("Chest");
  const [movementType, setMovementType] = useState<MovementType>("compound");
  const [tracking, setTracking] = useState<Tracking>("weight_reps");
  const [alternateOf, setAlternateOf] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Exercise name is required.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const input: CustomExerciseInput = {
        name: name.trim(),
        muscle_group: muscleGroup.trim(),
        movement_type: movementType,
        tracking,
        alternate_of: alternateOf || null,
      };
      const created = await repository.createCustomExercise(userId, input);
      onCreated(created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create custom exercise.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Exercise Name *
        </label>
        <input
          className="field w-full"
          placeholder="e.g. Incline Smith Press"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Muscle Group
          </label>
          <select
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            className="field h-10 w-full text-xs"
          >
            {[
              "Chest",
              "Back",
              "Shoulders",
              "Biceps",
              "Triceps",
              "Abs",
              "Quads",
              "Hamstrings",
              "Glutes",
              "Calves",
              "Full Body",
            ].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Movement Type
          </label>
          <select
            value={movementType}
            onChange={(e) => setMovementType(e.target.value as MovementType)}
            className="field h-10 w-full text-xs"
          >
            <option value="compound">Compound (2:30 rest)</option>
            <option value="isolation">Isolation (1:15 rest)</option>
            <option value="core">Core (1:00 rest)</option>
            <option value="timed">Timed (1:00 rest)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Tracking Type
          </label>
          <select
            value={tracking}
            onChange={(e) => setTracking(e.target.value as Tracking)}
            className="field h-10 w-full text-xs"
          >
            <option value="weight_reps">Weight + Reps</option>
            <option value="bodyweight_reps">Bodyweight Reps</option>
            <option value="time">Time (Seconds)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Alternate Of (Optional)
          </label>
          <select
            value={alternateOf}
            onChange={(e) => setAlternateOf(e.target.value)}
            className="field h-10 w-full text-xs"
          >
            <option value="">None</option>
            {existingExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost flex-1 text-sm text-muted-foreground"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="btn btn-primary flex-1 text-sm font-semibold disabled:opacity-40"
        >
          {creating ? "Creating..." : "Save & add"}
        </button>
      </div>
    </form>
  );
}
