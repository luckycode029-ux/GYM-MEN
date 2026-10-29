import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Gym Tracker" },
      { name: "description", content: "Create a Gym Tracker account." },
    ],
  }),
  component: () => <AuthForm mode="signup" />,
});
