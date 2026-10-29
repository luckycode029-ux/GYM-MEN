## Rules

- All data access goes through `src/lib/data/repository.ts` (async interface); never touch localStorage from components — so the local implementation can be swapped for the user's own Supabase later.
- Use Supabase for auth and data. Do not introduce any other backend or database service.
- Auth is a UI-only stub in `src/lib/auth/useAuth.ts`; app pages guard via `AppShell`.
- Exercise content, plan, rest defaults and media URLs live only in `src/data/exercises.ts`.
- No third-party branding/favicon; favicon is an inline SVG data URI in `__root.tsx`.
