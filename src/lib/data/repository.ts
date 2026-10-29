// The ONLY entry point for data access. Components import `repository` from here.
// Swap the implementation below for a Supabase one later without touching UI code.
import type {
  CustomExerciseInput,
  Exercise,
  PlanDay,
  PlanDayExercise,
  SetLog,
  UserPlan,
  UserProfile,
  UserProfileInput,
  WeightEntry,
  WorkoutSession,
} from "./types";
import { localRepository } from "./localRepository";

export type NewSetLog = Omit<SetLog, "id" | "logged_at">;

export interface Repository {
  getExercises(): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | null>;
  getAlternate(exerciseId: string): Promise<Exercise | null>;
  listExercises(userId?: string): Promise<Exercise[]>;
  createCustomExercise(userId: string, exercise: CustomExerciseInput): Promise<Exercise>;

  getPlanDays(userId: string): Promise<PlanDay[]>;
  getPlanForDay(userId: string, dayOfWeek: number): Promise<PlanDayExercise[]>;

  getUserPlan(userId: string): Promise<UserPlan>;
  saveUserPlan(userId: string, plan: UserPlan): Promise<void>;
  resetUserPlan(userId: string): Promise<UserPlan>;

  getProfile(userId: string): Promise<UserProfile | null>;
  saveProfile(userId: string, profile: UserProfileInput): Promise<UserProfile>;
  listWeightEntries(userId: string): Promise<WeightEntry[]>;
  addWeightEntry(userId: string, weightKg: number): Promise<WeightEntry>;

  getSessions(userId: string): Promise<WorkoutSession[]>;
  getActiveSession(userId: string): Promise<WorkoutSession | null>;
  getSessionForDate(userId: string, date: string): Promise<WorkoutSession | null>;
  startSession(userId: string, date: string, dayOfWeek: number): Promise<WorkoutSession>;
  endSession(sessionId: string): Promise<WorkoutSession | null>;

  getSetLogsForSession(sessionId: string): Promise<SetLog[]>;
  getSetLogsForExercise(userId: string, exerciseId: string): Promise<SetLog[]>;
  getAllSetLogs(userId: string): Promise<SetLog[]>;
  addSetLog(log: NewSetLog): Promise<SetLog>;
  deleteSetLog(id: string): Promise<void>;

  resetDemoData(): Promise<void>;
}

export const repository: Repository = localRepository;
