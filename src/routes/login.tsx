import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Gym Tracker" },
      { name: "description", content: "Log in to Gym Tracker." },
    ],
  }),
  component: () => <AuthForm mode="login" />,
});
