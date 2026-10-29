import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExerciseGif, ExerciseVideo } from "@/components/Media";
import { repository } from "@/lib/data/repository";
import { useLoad } from "@/lib/useLoad";
import { formatSet, groupBySession } from "@/lib/workout";

export const Route = createFileRoute("/exercise/$id")({
  head: () => ({
    meta: [
      { title: "Exercise — Gym Tracker" },
      { name: "description", content: "Form, cues and history for this exercise." },
    ],
  }),
  component: ExercisePage,
});

function BackButton() {
  const router = useRouter();
  return (
    <button
      aria-label="Back"
      onClick={() => router.history.back()}
      className="tap -ml-2 flex items-center justify-center"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}

function ExercisePage() {
  const { id } = Route.useParams();
  return (
    <AppShell title="Exercise" back={<BackButton />}>
      {(u) => <Detail id={id} userId={u.id} />}
    </AppShell>
  );
}

function Section({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm italic text-muted-foreground/70">Add later</p>
      ) : ordered ? (
        <ol className="space-y-2">
          {items.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="num text-primary">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc space-y-1 pl-5">
          {items.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Detail({ id, userId }: { id: string; userId: string }) {
  const { data } = useLoad(async () => {
    const ex = await repository.getExercise(id);
    if (!ex) return null;
    const alt = ex.alternate_of
      ? await repository.getExercise(ex.alternate_of)
      : await repository.getAlternate(ex.id);
    const logs = await repository.getSetLogsForExercise(userId, id);
    const sessions = await repository.getSessions(userId);
    return { ex, alt, logs, sessions };
  }, [id, userId]);

  if (data === undefined) return null;
  if (data === null) return <p className="text-muted-foreground">Exercise not found.</p>;
  const { ex, alt, logs, sessions } = data;
  const history = groupBySession(logs).slice(0, 6);

  return (
    <div className="space-y-6">
      <ExerciseGif exercise={ex} />
      <div>
        <h1 className="num text-3xl uppercase leading-tight">{ex.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
            {ex.muscle_group}
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 capitalize">{ex.movement_type}</span>
          {ex.is_alternate && (
            <span className="rounded-full bg-secondary px-3 py-1">Alternate</span>
          )}
        </div>
      </div>
      <Section title="Steps" items={ex.steps} ordered />
      <Section title="Common mistakes" items={ex.common_mistakes} />
      <Section title="Cues" items={ex.cues} />
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Video
        </h2>
        <ExerciseVideo exercise={ex} />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Substitution notes
        </h2>
        <p className={ex.substitution_notes ? "" : "text-sm italic text-muted-foreground/70"}>
          {ex.substitution_notes ?? "Add later"}
        </p>
      </section>
      {alt && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {ex.is_alternate ? "Main exercise" : "Alternate"}
          </h2>
          <Link
            to="/exercise/$id"
            params={{ id: alt.id }}
            className="card flex min-h-16 items-center gap-3 px-4"
          >
            <span className="flex-1 font-semibold">{alt.name}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </section>
      )}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Recent history
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sets logged yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((sets) => {
              const s = sessions.find((x) => x.id === sets[0]!.session_id);
              return (
                <li
                  key={sets[0]!.session_id}
                  className="card flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="text-sm text-muted-foreground">{s?.date}</span>
                  <span className="num text-right text-lg">
                    {sets
                      .filter((l) => !l.is_warmup)
                      .map((l) => formatSet(l, ex.tracking))
                      .join(", ") || "warm-ups only"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
