import { createFileRoute, redirect } from "@tanstack/react-router";

/** Alias público: /client → área do cliente existente (/painel). */
export const Route = createFileRoute("/client")({
  beforeLoad: () => {
    throw redirect({ to: "/painel", replace: true });
  },
});
