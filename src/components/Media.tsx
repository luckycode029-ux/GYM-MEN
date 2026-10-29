import type { Exercise } from "@/lib/data/types";

// Media comes from src/data/exercises.ts (gif_url / youtube_id). Blank until filled in.
export function ExerciseGif({ exercise }: { exercise: Exercise }) {
  if (exercise.gif_url) {
    return (
      <img
        src={exercise.gif_url}
        alt={`${exercise.name} demonstration`}
        className="aspect-square w-full rounded-xl object-cover"
      />
    );
  }
  return <div className="placeholder-box aspect-square w-full">GIF coming soon</div>;
}

export function ExerciseVideo({ exercise }: { exercise: Exercise }) {
  if (exercise.youtube_id) {
    const start = exercise.youtube_start_seconds ? `?start=${exercise.youtube_start_seconds}` : "";
    return (
      <iframe
        className="aspect-video w-full rounded-xl"
        src={`https://www.youtube-nocookie.com/embed/${exercise.youtube_id}${start}`}
        title={`${exercise.name} video`}
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return <div className="placeholder-box aspect-video w-full">Video coming soon</div>;
}
