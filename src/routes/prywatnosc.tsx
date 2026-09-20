import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/prywatnosc")({ component: PrywatnoscPage });

function PrywatnoscPage() {
  return (
    <div className="rise-in space-y-4 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Dokumenty</p>
        <h1 className="mt-1 font-serif text-3xl font-medium text-fg">Prywatność</h1>
      </div>
      <div className="space-y-3 rounded-2xl border border-line/70 bg-surface p-5 text-sm leading-relaxed text-muted shadow-card">
        <p>
          Twoje rzeczy, kwoty i decyzje zapisujemy <strong className="text-fg">tylko na tym
          urządzeniu</strong> (localStorage). W tej wersji nie wysyłamy ich na nasz serwer.
        </p>
        <p>
          Powiadomienia systemowe działają wyłącznie za Twoją zgodą i lokalnie na telefonie.
        </p>
        <p>
          W każdej chwili możesz wyeksportować albo usunąć dane w zakładce{" "}
          <strong className="text-fg">Więcej → Dane</strong>.
        </p>
      </div>
      <Link to="/konto" className="block text-sm font-medium text-fg">
        ← Wróć do Więcej
      </Link>
    </div>
  );
}
