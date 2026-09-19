import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/na-telefon")({
  component: () => (
    <main className="flex min-h-dvh items-center justify-center bg-[#f3efe6]">
      <h1 className="text-2xl">Na telefon</h1>
    </main>
  ),
});
