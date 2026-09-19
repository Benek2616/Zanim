import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/prywatnosc")({
  component: () => (
    <main className="flex min-h-dvh items-center justify-center bg-[#f3efe6]">
      <h1 className="text-2xl">Prywatność</h1>
    </main>
  ),
});
