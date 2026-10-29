-- Gym Tracker Schema & Row Level Security Migration
-- Tables: custom_exercises, user_plan_days, user_plan_exercises, profiles, weight_entries

-- 1. Custom exercises (user-created exercises)
create table if not exists public.custom_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text not null,
  movement_type text not null check (movement_type in ('compound', 'isolation', 'core', 'timed')),
  tracking text not null check (tracking in ('weight_reps', 'bodyweight_reps', 'time')),
  alternate_of text,
  created_at timestamptz not null default now()
);

alter table public.custom_exercises enable row level security;

create policy "Users can view their own custom exercises"
  on public.custom_exercises for select
  using (auth.uid() = user_id);

create policy "Users can insert their own custom exercises"
  on public.custom_exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own custom exercises"
  on public.custom_exercises for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own custom exercises"
  on public.custom_exercises for delete
  using (auth.uid() = user_id);

-- 2. User weekly plan days
create table if not exists public.user_plan_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  title text not null,
  is_rest boolean not null default false,
  unique (user_id, day_of_week)
);

alter table public.user_plan_days enable row level security;

create policy "Users can view their own plan days"
  on public.user_plan_days for select
  using (auth.uid() = user_id);

create policy "Users can insert their own plan days"
  on public.user_plan_days for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own plan days"
  on public.user_plan_days for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own plan days"
  on public.user_plan_days for delete
  using (auth.uid() = user_id);

-- 3. User weekly plan exercises
create table if not exists public.user_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  exercise_id text not null,
  sort_order smallint not null check (sort_order between 1 and 12),
  target_sets smallint not null check (target_sets between 1 and 10),
  rep_min smallint not null check (rep_min between 1 and 100),
  rep_max smallint not null check (rep_max >= rep_min and rep_max <= 100),
  rest_seconds smallint not null check (rest_seconds between 0 and 600),
  per_side boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.user_plan_exercises enable row level security;

create policy "Users can view their own plan exercises"
  on public.user_plan_exercises for select
  using (auth.uid() = user_id);

create policy "Users can insert their own plan exercises"
  on public.user_plan_exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own plan exercises"
  on public.user_plan_exercises for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own plan exercises"
  on public.user_plan_exercises for delete
  using (auth.uid() = user_id);

-- 4. User profile
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name varchar(50) not null,
  age smallint check (age between 10 and 100),
  height_cm numeric(5,1) check (height_cm between 100 and 250),
  weight_kg numeric(5,1) check (weight_kg between 25 and 300),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. User weight history
create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(5,1) not null check (weight_kg between 25 and 300),
  logged_at timestamptz not null default now()
);

alter table public.weight_entries enable row level security;

create policy "Users can view their own weight entries"
  on public.weight_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own weight entries"
  on public.weight_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own weight entries"
  on public.weight_entries for delete
  using (auth.uid() = user_id);
