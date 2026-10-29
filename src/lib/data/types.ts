// Types mirror the future Supabase tables 1:1.
export type MovementType = "compound" | "isolation" | "core" | "timed";
export type Tracking = "weight_reps" | "bodyweight_reps" | "time";

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  movement_type: MovementType;
  tracking: Tracking;
  is_alternate: boolean;
  alternate_of: string | null;
  gif_url: string | null;
  youtube_id: string | null;
  youtube_start_seconds: number | null;
  steps: string[];
  common_mistakes: string[];
  cues: string[];
  substitution_notes: string | null;
}

export interface PlanDayExercise {
  id: string;
  day_of_week: number; // 1-7, Mon=1
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  rep_min: number; // for time tracking: seconds
  rep_max: number;
  rest_seconds: number;
  per_side: boolean;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  day_of_week: number;
  started_at: string;
  ended_at: string | null;
  planned_exercises?: PlanDayExercise[];
}

export interface SetLog {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  reps_in_reserve: number | null;
  is_warmup: boolean;
  note: string | null;
  logged_at: string;
}

export interface PlanDay {
  day_of_week: number;
  title: string | null;
  is_rest?: boolean;
}

export type UserPlanDayExercise = PlanDayExercise;

export interface UserPlanDay {
  day_of_week: number; // 1-7, Mon=1
  title: string;
  is_rest: boolean;
  exercises: UserPlanDayExercise[];
}

export interface UserPlan {
  user_id: string;
  days: UserPlanDay[];
  updated_at: string;
}

export interface CustomExerciseInput {
  name: string;
  muscle_group: string;
  movement_type: MovementType;
  tracking: Tracking;
  alternate_of?: string | null;
}

export interface UserProfile {
  user_id: string;
  name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  updated_at: string;
}

export interface UserProfileInput {
  name: string;
  age?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string;
}
