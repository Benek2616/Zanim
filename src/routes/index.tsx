import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f3efe6] px-6 text-center">
      <h1 className="font-serif text-3xl font-medium text-[#1a1a1a]">Zanim</h1>
      <p className="max-w-md text-[#4a4a4a]">
        Poczekalnia zakupów. Odczekaj 48 godzin, zanim wydasz pieniądze.
      </p>
    </main>
  );
}
