import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/regulamin")({
  component: () => (
    <main className="flex min-h-dvh items-center justify-center bg-[#f3efe6]">
      <h1 className="text-2xl">Regulamin</h1>
    </main>
  ),
});
