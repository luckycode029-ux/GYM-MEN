import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask — Gym Tracker" },
      { name: "description", content: "Exercise assistant coming soon." },
    ],
  }),
  component: () => (
    <AppShell title="Ask">
      {() => (
        <div className="flex flex-col items-center py-24 text-center text-muted-foreground">
          <MessageCircle className="h-10 w-10" />
          <p className="mt-4 text-lg font-semibold">Exercise assistant coming soon</p>
        </div>
      )}
    </AppShell>
  ),
});
