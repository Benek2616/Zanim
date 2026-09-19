import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/raport")({
  component: () => (
    <main className="flex min-h-dvh items-center justify-center bg-[#f3efe6]">
      <h1 className="text-2xl">Raport</h1>
    </main>
  ),
});
