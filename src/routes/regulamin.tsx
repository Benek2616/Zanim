import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/regulamin")({ component: RegulaminPage });

function RegulaminPage() {
  return (
    <div className="rise-in space-y-4 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Dokumenty</p>
        <h1 className="mt-1 font-serif text-3xl font-medium text-fg">Regulamin</h1>
      </div>
      <div className="space-y-3 rounded-2xl border border-line/70 bg-surface p-5 text-sm leading-relaxed text-muted shadow-card">
        <p>
          <strong className="text-fg">Zanim</strong> to narzędzie do odkładania decyzji zakupowych.
          Korzystasz z niego na własną odpowiedzialność.
        </p>
        <p>
          Dane (lista rzeczy, decyzje, ustawienia) są przechowywane lokalnie w przeglądarce / na
          urządzeniu. W tej wersji nie prowadzimy kont serwerowych.
        </p>
        <p>
          Plan <strong className="text-fg">Plus</strong> w aplikacji może być aktywowany lokalnie
          (mock) i nie musi oznaczać realnej płatności — zależnie od wdrożenia.
        </p>
        <p>Korzystając z aplikacji, akceptujesz lokalne przechowywanie swoich list i ustawień.</p>
      </div>
      <Link to="/konto" className="block text-sm font-medium text-fg">
        ← Wróć do Więcej
      </Link>
    </div>
  );
}
