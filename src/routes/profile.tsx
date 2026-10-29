import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, Scale } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { repository } from "@/lib/data/repository";
import type { UserProfile, WeightEntry } from "@/lib/data/types";
import { useLoad } from "@/lib/useLoad";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Gym Tracker" },
      { name: "description", content: "Your profile, BMI and weight history." },
    ],
  }),
  component: () => (
    <AppShell title="Profile">{(u) => <ProfilePage userId={u.id} email={u.email} />}</AppShell>
  ),
});

function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

function ProfilePage({ userId, email }: { userId: string; email: string }) {
  const navigate = useNavigate();
  const { data, reload } = useLoad(async () => {
    const [profile, weights] = await Promise.all([
      repository.getProfile(userId),
      repository.listWeightEntries(userId),
    ]);
    return { profile, weights };
  }, [userId]);

  const [name, setName] = useState("");
  const [ageStr, setAgeStr] = useState("");
  const [heightStr, setHeightStr] = useState("");
  const [weightStr, setWeightStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (data && !loaded) {
      if (data.profile) {
        setName(data.profile.name ?? "");
        setAgeStr(data.profile.age != null ? String(data.profile.age) : "");
        setHeightStr(data.profile.height_cm != null ? String(data.profile.height_cm) : "");
        setWeightStr(data.profile.weight_kg != null ? String(data.profile.weight_kg) : "");
      }
      setLoaded(true);
    }
  }, [data, loaded]);

  // Validation
  const trimmedName = name.trim();
  const nameError = !trimmedName
    ? "Name is required."
    : trimmedName.length > 50
      ? "Name must be 50 characters or less."
      : null;

  const ageNum = ageStr.trim() !== "" ? Number(ageStr) : null;
  const ageError =
    ageStr.trim() !== ""
      ? isNaN(Number(ageStr)) ||
        !Number.isInteger(Number(ageStr)) ||
        Number(ageStr) < 10 ||
        Number(ageStr) > 100
        ? "Age must be a whole number between 10 and 100."
        : null
      : null;

  const heightNum = heightStr.trim() !== "" ? Number(heightStr) : null;
  const heightError =
    heightStr.trim() !== ""
      ? isNaN(Number(heightStr)) || Number(heightStr) < 100 || Number(heightStr) > 250
        ? "Height must be between 100 and 250 cm."
        : null
      : null;

  const weightNum = weightStr.trim() !== "" ? Number(weightStr.replace(",", ".")) : null;
  const weightDecimals = weightStr.includes(".") ? (weightStr.split(".")[1]?.length ?? 0) : 0;
  const weightError =
    weightStr.trim() !== ""
      ? isNaN(Number(weightStr.replace(",", "."))) ||
        weightDecimals > 1 ||
        Number(weightStr.replace(",", ".")) < 25 ||
        Number(weightStr.replace(",", ".")) > 300
        ? "Weight must be between 25 and 300 kg (max 1 decimal)."
        : null
      : null;

  const isValid = !nameError && !ageError && !heightError && !weightError;

  // Live BMI calculation
  const bmiInfo = useMemo(() => {
    if (
      heightNum != null &&
      weightNum != null &&
      !heightError &&
      !weightError &&
      heightNum > 0 &&
      weightNum > 0
    ) {
      const bmi = calculateBmi(weightNum, heightNum);
      const isAdult = ageNum != null && ageNum >= 18;
      const category = isAdult ? getBmiCategory(bmi) : null;
      return { bmi, category, available: true };
    }
    return { bmi: null, category: null, available: false };
  }, [heightNum, weightNum, heightError, weightError, ageNum]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    try {
      const updatedProfile = await repository.saveProfile(userId, {
        name: trimmedName,
        age: ageNum,
        height_cm: heightNum,
        weight_kg: weightNum,
      });

      // Weight history tracking:
      // If weight is set and differs from the latest weight entry (or no entry exists yet)
      if (weightNum != null && !weightError) {
        const latestEntry = data?.weights?.[0];
        if (!latestEntry || latestEntry.weight_kg !== weightNum) {
          await repository.addWeightEntry(userId, weightNum);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      reload();
    } finally {
      setSaving(false);
    }
  }

  const recentWeights = (data?.weights ?? []).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link to="/settings" className="btn btn-ghost px-2 text-sm text-muted-foreground">
          <ChevronLeft className="h-5 w-5" /> Settings
        </Link>
        <span className="text-xs text-muted-foreground">{email}</span>
      </div>

      {/* BMI Card */}
      <div className="card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Body Mass Index (BMI)
          </span>
          {bmiInfo.available && bmiInfo.category && (
            <span className="rounded-lg bg-primary/20 px-2.5 py-1 text-xs font-bold text-primary">
              {bmiInfo.category}
            </span>
          )}
        </div>

        {bmiInfo.available ? (
          <div>
            <div className="num text-5xl font-bold text-primary">{bmiInfo.bmi}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              BMI doesn't account for muscle mass, so it can read high for people who lift.
            </p>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-muted-foreground">Add height and weight to see BMI</p>
            <p className="mt-1 text-xs text-muted-foreground">
              BMI doesn't account for muscle mass, so it can read high for people who lift.
            </p>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="card space-y-4 p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Personal Details
        </h2>

        {/* Name */}
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Name *
          </label>
          <input
            className={`field w-full ${nameError ? "border-destructive focus:ring-destructive" : ""}`}
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
          />
          {nameError && <p className="mt-1 text-xs text-destructive">{nameError}</p>}
        </div>

        {/* Age & Height */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Age (Years)
            </label>
            <input
              type="number"
              min={10}
              max={100}
              step={1}
              className={`field w-full ${ageError ? "border-destructive focus:ring-destructive" : ""}`}
              value={ageStr}
              onChange={(e) => setAgeStr(e.target.value)}
              placeholder="e.g. 28"
            />
            {ageError && <p className="mt-1 text-xs text-destructive">{ageError}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Height (cm)
            </label>
            <input
              type="number"
              min={100}
              max={250}
              step={1}
              className={`field w-full ${heightError ? "border-destructive focus:ring-destructive" : ""}`}
              value={heightStr}
              onChange={(e) => setHeightStr(e.target.value)}
              placeholder="e.g. 175"
            />
            {heightError && <p className="mt-1 text-xs text-destructive">{heightError}</p>}
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Weight (kg)
          </label>
          <input
            inputMode="decimal"
            className={`field w-full ${weightError ? "border-destructive focus:ring-destructive" : ""}`}
            value={weightStr}
            onChange={(e) => setWeightStr(e.target.value)}
            placeholder="e.g. 70.0"
          />
          {weightError && <p className="mt-1 text-xs text-destructive">{weightError}</p>}
        </div>

        {/* Save button & status */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isValid || saving}
            className="btn btn-primary w-full text-base font-bold disabled:opacity-40"
          >
            {saving ? (
              "Saving..."
            ) : saveSuccess ? (
              <span className="flex items-center justify-center gap-1.5">
                <Check className="h-4 w-4" /> Profile saved!
              </span>
            ) : (
              "Save profile"
            )}
          </button>
        </div>
      </form>

      {/* Weight History Section */}
      <div className="card space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Scale className="h-4 w-4 text-primary" />
          <span>Weight History</span>
        </div>

        {recentWeights.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">
            No weight entries logged yet. Save your body weight above to start tracking history.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentWeights.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between rounded-xl bg-surface px-4 py-2.5 text-sm"
              >
                <span className="text-muted-foreground">{formatDate(w.logged_at)}</span>
                <span className="num text-base font-bold text-foreground">{w.weight_kg} kg</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
