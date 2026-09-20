import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/na-telefon")({ component: NaTelefonPage });

function NaTelefonPage() {
  return (
    <div className="rise-in space-y-4 pb-6">
      <p className="text-2xs font-medium uppercase tracking-mark text-subtle">Aplikacja</p>
      <h1 className="font-serif text-3xl font-medium">Na telefon</h1>
      <p className="text-sm leading-relaxed text-muted">
        Zanim działa w przeglądarce jak aplikacja. Na iPhonie: udostępnij → „Dodaj do ekranu
        początkowego”. Na Androidzie: menu przeglądarki → „Zainstaluj aplikację” / „Dodaj do
        ekranu głównego".
      </p>
      <p className="text-sm text-muted">
        Po instalacji możesz włączyć powiadomienia na ekranie poczekalni — damy znać, gdy czas
        minie.
      </p>
    </div>
  );
}
