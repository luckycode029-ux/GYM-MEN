// ALL exercise content lives here. Fill in steps, mistakes, cues, GIFs and videos
// without touching any component.
//
// HOW TO ADD MEDIA:
//   gif_url:  paste a full image URL, e.g. gif_url: "https://example.com/lat-pulldown.gif"
//   youtube_id: paste only the video id, e.g. youtube_id: "dQw4w9WgXcQ"
//   youtube_start_seconds: optional start time in seconds, e.g. 42
import type { Exercise, MovementType, PlanDay, PlanDayExercise, Tracking } from "@/lib/data/types";

// Rest defaults (seconds) — edit freely.
export const REST_DEFAULTS: Record<MovementType, number> = {
  compound: 150,
  isolation: 75,
  core: 60,
  timed: 60,
};

function ex(
  id: string,
  name: string,
  muscle_group: string,
  movement_type: MovementType,
  tracking: Tracking,
  alternate_of: string | null = null,
): Exercise {
  return {
    id,
    name,
    muscle_group,
    movement_type,
    tracking,
    is_alternate: alternate_of !== null,
    alternate_of,
    gif_url: null, // <- paste GIF URL here
    youtube_id: null, // <- paste YouTube id here
    youtube_start_seconds: null,
    steps: [],
    common_mistakes: [],
    cues: [],
    substitution_notes: null,
  };
}

export const EXERCISES: Exercise[] = [
  // Monday — Pull A
  ex("ex-wide-lat-pulldown", "Wide-grip lat pulldown", "Back", "compound", "weight_reps"),
  ex(
    "ex-single-arm-cable-pulldown",
    "Single-arm cable lat pulldown",
    "Back",
    "compound",
    "weight_reps",
    "ex-wide-lat-pulldown",
  ),
  ex("ex-cs-tbar-row", "Chest-supported T-bar row", "Back", "compound", "weight_reps"),
  ex(
    "ex-cs-db-row",
    "Chest-supported dumbbell row (incline bench)",
    "Back",
    "compound",
    "weight_reps",
    "ex-cs-tbar-row",
  ),
  ex("ex-seated-cable-row", "Seated cable row", "Back", "compound", "weight_reps"),
  ex(
    "ex-inverted-row-smith",
    "Inverted row (Smith bar)",
    "Back",
    "compound",
    "bodyweight_reps",
    "ex-seated-cable-row",
  ),
  ex("ex-face-pulls", "Face pulls", "Rear delts", "isolation", "weight_reps"),
  ex(
    "ex-band-pull-aparts",
    "Band pull-aparts",
    "Rear delts",
    "isolation",
    "bodyweight_reps",
    "ex-face-pulls",
  ),
  ex("ex-incline-db-curl", "Incline dumbbell curls", "Biceps", "isolation", "weight_reps"),
  ex(
    "ex-preacher-curl-machine",
    "Preacher curl (machine)",
    "Biceps",
    "isolation",
    "weight_reps",
    "ex-incline-db-curl",
  ),
  ex("ex-rope-hammer-curl", "Rope hammer curls", "Biceps", "isolation", "weight_reps"),
  ex(
    "ex-db-hammer-curl",
    "Dumbbell hammer curls",
    "Biceps",
    "isolation",
    "weight_reps",
    "ex-rope-hammer-curl",
  ),

  // Tuesday — Push A
  ex("ex-flat-db-press", "Flat dumbbell press", "Chest", "compound", "weight_reps"),
  ex(
    "ex-smith-bench",
    "Smith machine bench press",
    "Chest",
    "compound",
    "weight_reps",
    "ex-flat-db-press",
  ),
  ex("ex-incline-db-press", "Incline dumbbell press", "Chest", "compound", "weight_reps"),
  ex(
    "ex-incline-smith-press",
    "Incline Smith machine press",
    "Chest",
    "compound",
    "weight_reps",
    "ex-incline-db-press",
  ),
  ex("ex-machine-chest-press", "Machine chest press", "Chest", "compound", "weight_reps"),
  ex("ex-push-ups", "Push-ups", "Chest", "compound", "bodyweight_reps", "ex-machine-chest-press"),
  ex("ex-cable-chest-fly", "Cable chest fly", "Chest", "isolation", "weight_reps"),
  ex(
    "ex-db-chest-fly",
    "Dumbbell chest fly (flat bench)",
    "Chest",
    "isolation",
    "weight_reps",
    "ex-cable-chest-fly",
  ),
  ex("ex-cable-lateral-raise", "Cable lateral raises", "Shoulders", "isolation", "weight_reps"),
  ex(
    "ex-db-lateral-raise",
    "Dumbbell lateral raises",
    "Shoulders",
    "isolation",
    "weight_reps",
    "ex-cable-lateral-raise",
  ),
  ex("ex-rope-pushdown", "Rope triceps pushdown", "Triceps", "isolation", "weight_reps"),
  ex(
    "ex-straight-bar-pushdown",
    "Straight-bar cable pushdown",
    "Triceps",
    "isolation",
    "weight_reps",
    "ex-rope-pushdown",
  ),
  ex("ex-overhead-cable-ext", "Overhead cable extension", "Triceps", "isolation", "weight_reps"),
  ex(
    "ex-overhead-db-ext",
    "Overhead dumbbell triceps extension (seated)",
    "Triceps",
    "isolation",
    "weight_reps",
    "ex-overhead-cable-ext",
  ),

  // Wednesday — Core + Recovery
  ex("ex-dead-bugs", "Dead bugs", "Core", "core", "bodyweight_reps"),
  ex(
    "ex-hollow-hold-tuck",
    "Hollow body hold (tuck version)",
    "Core",
    "core",
    "time",
    "ex-dead-bugs",
  ),
  ex("ex-plank", "Plank", "Core", "timed", "time"),
  ex("ex-side-plank", "Side plank", "Core", "timed", "time", "ex-plank"),
  ex("ex-bird-dogs", "Bird dogs", "Core", "core", "bodyweight_reps"),
  ex(
    "ex-superman-hold",
    "Prone back extension hold (Superman)",
    "Lower back",
    "core",
    "time",
    "ex-bird-dogs",
  ),
  ex("ex-gentle-mobility", "Gentle mobility", "Full body", "timed", "time"),

  // Friday — Pull B
  ex("ex-neutral-lat-pulldown", "Neutral-grip lat pulldown", "Back", "compound", "weight_reps"),
  ex(
    "ex-close-underhand-pulldown",
    "Close-grip underhand lat pulldown",
    "Back",
    "compound",
    "weight_reps",
    "ex-neutral-lat-pulldown",
  ),
  ex("ex-cs-machine-row", "Chest-supported machine row", "Back", "compound", "weight_reps"),
  ex(
    "ex-plate-high-row",
    "Plate-loaded high row (machine)",
    "Back",
    "compound",
    "weight_reps",
    "ex-cs-machine-row",
  ),
  ex("ex-single-arm-cable-row", "Single-arm cable row", "Back", "compound", "weight_reps"),
  ex(
    "ex-single-arm-db-row",
    "Single-arm dumbbell row (standing, free hand supported on bench)",
    "Back",
    "compound",
    "weight_reps",
    "ex-single-arm-cable-row",
  ),
  ex("ex-reverse-pec-deck", "Reverse pec deck", "Rear delts", "isolation", "weight_reps"),
  ex(
    "ex-rear-delt-db-fly",
    "Rear delt dumbbell fly (chest-supported, incline bench)",
    "Rear delts",
    "isolation",
    "weight_reps",
    "ex-reverse-pec-deck",
  ),
  ex("ex-ez-bar-curl", "EZ-bar curls", "Biceps", "isolation", "weight_reps"),
  ex(
    "ex-standing-db-curl",
    "Standing dumbbell curls",
    "Biceps",
    "isolation",
    "weight_reps",
    "ex-ez-bar-curl",
  ),
  ex("ex-bayesian-curl", "Bayesian cable curls", "Biceps", "isolation", "weight_reps"),
  ex(
    "ex-single-arm-cable-curl",
    "Single-arm standing cable curl",
    "Biceps",
    "isolation",
    "weight_reps",
    "ex-bayesian-curl",
  ),

  // Saturday — Push B
  ex("ex-incline-machine-press", "Incline machine chest press", "Chest", "compound", "weight_reps"),
  ex(
    "ex-incline-cable-press",
    "Incline cable chest press",
    "Chest",
    "compound",
    "weight_reps",
    "ex-incline-machine-press",
  ),
  ex("ex-flat-machine-press", "Flat machine chest press", "Chest", "compound", "weight_reps"),
  ex(
    "ex-db-squeeze-press",
    "Dumbbell squeeze press (flat)",
    "Chest",
    "compound",
    "weight_reps",
    "ex-flat-machine-press",
  ),
  ex("ex-pec-deck", "Pec deck fly", "Chest", "isolation", "weight_reps"),
  ex(
    "ex-low-high-cable-fly",
    "Low-to-high cable fly",
    "Chest",
    "isolation",
    "weight_reps",
    "ex-pec-deck",
  ),
  ex("ex-machine-shoulder-press", "Machine shoulder press", "Shoulders", "compound", "weight_reps"),
  ex(
    "ex-seated-db-shoulder-press",
    "Seated dumbbell shoulder press",
    "Shoulders",
    "compound",
    "weight_reps",
    "ex-machine-shoulder-press",
  ),
  ex("ex-cable-crunch", "Cable crunch", "Abs", "core", "weight_reps"),
  ex(
    "ex-weighted-crunch",
    "Weighted crunch (plate on chest)",
    "Abs",
    "core",
    "weight_reps",
    "ex-cable-crunch",
  ),
  ex("ex-reverse-crunch", "Reverse crunch", "Abs", "core", "bodyweight_reps"),
  ex(
    "ex-lying-leg-raise-bent",
    "Lying leg raise (bent knees)",
    "Abs",
    "core",
    "bodyweight_reps",
    "ex-reverse-crunch",
  ),
];

export const PLAN_DAYS: PlanDay[] = [
  { day_of_week: 1, title: "Pull A — Back + Biceps" },
  { day_of_week: 2, title: "Push A — Chest + Shoulders + Triceps" },
  { day_of_week: 3, title: "Core + Recovery" },
  { day_of_week: 4, title: null },
  { day_of_week: 5, title: "Pull B — Back + Biceps" },
  { day_of_week: 6, title: "Push B — Chest + Shoulders + Triceps + Abs" },
  { day_of_week: 7, title: null },
];

type Row = [
  exercise_id: string,
  sets: number,
  rep_min: number,
  rep_max: number,
  per_side?: boolean,
];

const DAY_ROWS: Record<number, Row[]> = {
  1: [
    ["ex-wide-lat-pulldown", 3, 10, 12],
    ["ex-cs-tbar-row", 3, 8, 12],
    ["ex-seated-cable-row", 3, 10, 12],
    ["ex-face-pulls", 2, 15, 15],
    ["ex-incline-db-curl", 3, 10, 12],
    ["ex-rope-hammer-curl", 3, 10, 12],
  ],
  2: [
    ["ex-flat-db-press", 3, 8, 12],
    ["ex-incline-db-press", 3, 8, 12],
    ["ex-machine-chest-press", 2, 10, 12],
    ["ex-cable-chest-fly", 2, 12, 15],
    ["ex-cable-lateral-raise", 3, 12, 15],
    ["ex-rope-pushdown", 3, 10, 12],
    ["ex-overhead-cable-ext", 2, 12, 12],
  ],
  3: [
    ["ex-dead-bugs", 3, 10, 10, true],
    ["ex-plank", 3, 30, 45],
    ["ex-bird-dogs", 2, 10, 10, true],
    ["ex-gentle-mobility", 1, 300, 600],
  ],
  5: [
    ["ex-neutral-lat-pulldown", 3, 10, 12],
    ["ex-cs-machine-row", 3, 10, 12],
    ["ex-single-arm-cable-row", 2, 12, 12],
    ["ex-reverse-pec-deck", 3, 12, 15],
    ["ex-ez-bar-curl", 3, 10, 12],
    ["ex-bayesian-curl", 2, 12, 12],
  ],
  6: [
    ["ex-incline-machine-press", 3, 8, 12],
    ["ex-flat-machine-press", 3, 10, 12],
    ["ex-pec-deck", 2, 12, 15],
    ["ex-machine-shoulder-press", 2, 10, 12],
    ["ex-cable-lateral-raise", 3, 12, 15], // same record as Tuesday
    ["ex-rope-pushdown", 3, 10, 12], // same record as Tuesday
    ["ex-cable-crunch", 3, 12, 15],
    ["ex-reverse-crunch", 2, 12, 15],
  ],
};

export const PLAN: PlanDayExercise[] = Object.entries(DAY_ROWS).flatMap(([day, rows]) =>
  rows.map(([exercise_id, sets, rep_min, rep_max, per_side], i) => {
    const e = EXERCISES.find((x) => x.id === exercise_id)!;
    return {
      id: `plan-${day}-${i + 1}`,
      day_of_week: Number(day),
      exercise_id,
      sort_order: i + 1,
      target_sets: sets,
      rep_min,
      rep_max,
      rest_seconds: REST_DEFAULTS[e.movement_type],
      per_side: per_side ?? false,
    };
  }),
);

export const TRAINING_RULES = [
  "Warm up 5-10 minutes, then lighter warm-up sets for the first exercise.",
  "Rest 2-3 min for compounds, 60-90 s for isolation.",
  "Increase weight only when all sets are completed with good form.",
  "Finish most sets with 1-3 reps still possible.",
  "Stop any movement that causes pain.",
];
