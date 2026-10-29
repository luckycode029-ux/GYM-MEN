// TODO: replace with supabaseRepository.ts
// localStorage-backed prototype implementation. Only repository.ts imports this.
import { EXERCISES, PLAN, PLAN_DAYS } from "@/data/exercises";
import type { Repository, NewSetLog } from "./repository";
import type {
  CustomExerciseInput,
  Exercise,
  PlanDay,
  PlanDayExercise,
  SetLog,
  UserPlan,
  UserPlanDay,
  UserPlanDayExercise,
  UserProfile,
  UserProfileInput,
  WeightEntry,
  WorkoutSession,
} from "./types";

const KEY = "gt.db.v1";
const PROFILE_KEY = "gt.profiles.v1";
const WEIGHT_KEY = "gt.weight_entries.v1";

function loadProfiles(): Record<string, UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProfiles(data: Record<string, UserProfile>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

function loadWeightEntries(): WeightEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WEIGHT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWeightEntries(data: WeightEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WEIGHT_KEY, JSON.stringify(data));
}

interface Db {
  exercises: Exercise[];
  plan: PlanDayExercise[];
  planDays: PlanDay[];
  sessions: WorkoutSession[];
  setLogs: SetLog[];
  userPlans?: Record<string, UserPlan>;
  customExercises?: Exercise[];
}

function defaultUserPlan(userId: string): UserPlan {
  const days: UserPlanDay[] = [1, 2, 3, 4, 5, 6, 7].map((dow) => {
    const seedDay = PLAN_DAYS.find((d) => d.day_of_week === dow);
    const exercises: UserPlanDayExercise[] = PLAN.filter((p) => p.day_of_week === dow).map((p) => ({
      ...structuredClone(p),
      id: `plan-${dow}-${p.exercise_id}`,
    }));
    const isRest = seedDay?.title === null || exercises.length === 0;
    const title = seedDay?.title ?? "Rest";
    return {
      day_of_week: dow,
      title,
      is_rest: isRest,
      exercises,
    };
  });
  return {
    user_id: userId,
    days,
    updated_at: new Date().toISOString(),
  };
}

function seed(): Db {
  return {
    exercises: structuredClone(EXERCISES),
    plan: structuredClone(PLAN),
    planDays: PLAN_DAYS.map((d) => ({
      day_of_week: d.day_of_week,
      title: d.title ?? "Rest",
      is_rest: d.title === null,
    })),
    sessions: [],
    setLogs: [],
    userPlans: {},
    customExercises: [],
  };
}

function load(): Db {
  if (typeof window === "undefined") return seed();
  const raw = window.localStorage.getItem(KEY);
  if (raw) {
    try {
      const db = JSON.parse(raw) as Db;
      // Preserve existing sessions, setLogs, and user plans
      if (!Array.isArray(db.sessions)) db.sessions = [];
      if (!Array.isArray(db.setLogs)) db.setLogs = [];
      if (!Array.isArray(db.customExercises)) db.customExercises = [];
      if (!db.userPlans || typeof db.userPlans !== "object") db.userPlans = {};

      db.exercises = [...structuredClone(EXERCISES), ...db.customExercises];
      db.plan = structuredClone(PLAN);
      db.planDays = PLAN_DAYS.map((d) => ({
        day_of_week: d.day_of_week,
        title: d.title ?? "Rest",
        is_rest: d.title === null,
      }));
      return db;
    } catch {
      /* fall through to reseed */
    }
  }
  const db = seed();
  save(db);
  return db;
}

function save(db: Db) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(db));
}

const uuid = () => crypto.randomUUID();
const byLoggedAt = (a: SetLog, b: SetLog) => a.logged_at.localeCompare(b.logged_at);

function userSessionIds(db: Db, userId: string) {
  return new Set(db.sessions.filter((s) => s.user_id === userId).map((s) => s.id));
}

export const localRepository: Repository = {
  async getExercises() {
    return load().exercises;
  },
  async getExercise(id) {
    return load().exercises.find((e) => e.id === id) ?? null;
  },
  async getAlternate(exerciseId) {
    return load().exercises.find((e) => e.alternate_of === exerciseId) ?? null;
  },
  async listExercises() {
    return load().exercises;
  },
  async createCustomExercise(_userId: string, input: CustomExerciseInput): Promise<Exercise> {
    const db = load();
    if (!db.customExercises) db.customExercises = [];
    const newEx: Exercise = {
      id: `custom-${uuid()}`,
      name: input.name.trim(),
      muscle_group: input.muscle_group.trim(),
      movement_type: input.movement_type,
      tracking: input.tracking,
      is_alternate: !!input.alternate_of,
      alternate_of: input.alternate_of ?? null,
      gif_url: null,
      youtube_id: null,
      youtube_start_seconds: null,
      steps: [],
      common_mistakes: [],
      cues: [],
      substitution_notes: null,
    };
    db.customExercises.push(newEx);
    db.exercises.push(newEx);
    save(db);
    return newEx;
  },

  async getUserPlan(userId: string): Promise<UserPlan> {
    const db = load();
    if (!db.userPlans) db.userPlans = {};
    if (!db.userPlans[userId]) {
      db.userPlans[userId] = defaultUserPlan(userId);
      save(db);
    }
    return structuredClone(db.userPlans[userId]);
  },
  async saveUserPlan(userId: string, plan: UserPlan): Promise<void> {
    const db = load();
    if (!db.userPlans) db.userPlans = {};
    db.userPlans[userId] = {
      ...structuredClone(plan),
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    save(db);
  },
  async resetUserPlan(userId: string): Promise<UserPlan> {
    const db = load();
    if (!db.userPlans) db.userPlans = {};
    const fresh = defaultUserPlan(userId);
    db.userPlans[userId] = fresh;
    save(db);
    return structuredClone(fresh);
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    const profiles = loadProfiles();
    return profiles[userId] ? structuredClone(profiles[userId]) : null;
  },
  async saveProfile(userId: string, input: UserProfileInput): Promise<UserProfile> {
    const profiles = loadProfiles();
    const updated: UserProfile = {
      user_id: userId,
      name: input.name.trim(),
      age: input.age != null && input.age !== ("" as unknown as number) ? Number(input.age) : null,
      height_cm:
        input.height_cm != null && input.height_cm !== ("" as unknown as number)
          ? Number(input.height_cm)
          : null,
      weight_kg:
        input.weight_kg != null && input.weight_kg !== ("" as unknown as number)
          ? Number(input.weight_kg)
          : null,
      updated_at: new Date().toISOString(),
    };
    profiles[userId] = updated;
    saveProfiles(profiles);
    return structuredClone(updated);
  },
  async listWeightEntries(userId: string): Promise<WeightEntry[]> {
    const all = loadWeightEntries();
    return all
      .filter((w) => w.user_id === userId)
      .sort((a, b) => b.logged_at.localeCompare(a.logged_at));
  },
  async addWeightEntry(userId: string, weightKg: number): Promise<WeightEntry> {
    const all = loadWeightEntries();
    const entry: WeightEntry = {
      id: uuid(),
      user_id: userId,
      weight_kg: Number(weightKg.toFixed(1)),
      logged_at: new Date().toISOString(),
    };
    all.push(entry);
    saveWeightEntries(all);
    return entry;
  },

  async getPlanDays(userId: string): Promise<PlanDay[]> {
    const plan = await this.getUserPlan(userId);
    return plan.days.map((d) => ({
      day_of_week: d.day_of_week,
      title: d.title,
      is_rest: d.is_rest || d.exercises.length === 0,
    }));
  },
  async getPlanForDay(userId: string, day: number): Promise<PlanDayExercise[]> {
    const plan = await this.getUserPlan(userId);
    const d = plan.days.find((x) => x.day_of_week === day);
    if (!d || d.is_rest || d.exercises.length === 0) return [];
    return structuredClone(d.exercises).sort((a, b) => a.sort_order - b.sort_order);
  },

  async getSessions(userId) {
    return load()
      .sessions.filter((s) => s.user_id === userId)
      .sort((a, b) => a.started_at.localeCompare(b.started_at));
  },
  async getActiveSession(userId) {
    return load().sessions.find((s) => s.user_id === userId && !s.ended_at) ?? null;
  },
  async getSessionForDate(userId, date) {
    const list = load().sessions.filter((s) => s.user_id === userId && s.date === date);
    return list.at(-1) ?? null;
  },
  async startSession(userId, date, day_of_week) {
    const db = load();
    const existing = db.sessions.find((s) => s.user_id === userId && !s.ended_at);
    if (existing) return existing;
    const planExercises = await this.getPlanForDay(userId, day_of_week);
    const s: WorkoutSession = {
      id: uuid(),
      user_id: userId,
      date,
      day_of_week,
      started_at: new Date().toISOString(),
      ended_at: null,
      planned_exercises: structuredClone(planExercises),
    };
    db.sessions.push(s);
    save(db);
    return s;
  },
  async endSession(id) {
    const db = load();
    const s = db.sessions.find((x) => x.id === id);
    if (!s) return null;
    s.ended_at = new Date().toISOString();
    save(db);
    return s;
  },

  async getSetLogsForSession(sessionId) {
    return load()
      .setLogs.filter((l) => l.session_id === sessionId)
      .sort(byLoggedAt);
  },
  async getSetLogsForExercise(userId, exerciseId) {
    const db = load();
    const ids = userSessionIds(db, userId);
    return db.setLogs
      .filter((l) => l.exercise_id === exerciseId && ids.has(l.session_id))
      .sort(byLoggedAt);
  },
  async getAllSetLogs(userId) {
    const db = load();
    const ids = userSessionIds(db, userId);
    return db.setLogs.filter((l) => ids.has(l.session_id)).sort(byLoggedAt);
  },
  async addSetLog(input: NewSetLog) {
    const db = load();
    const log: SetLog = { ...input, id: uuid(), logged_at: new Date().toISOString() };
    db.setLogs.push(log);
    save(db);
    return log;
  },
  async deleteSetLog(id) {
    const db = load();
    db.setLogs = db.setLogs.filter((l) => l.id !== id);
    save(db);
  },

  async resetDemoData() {
    save(seed());
  },
};
