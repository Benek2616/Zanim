import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/regulamin")({ component: RegulaminPage });

function RegulaminPage() {
  return (
    <div className="rise-in prose-sm space-y-3 pb-6 text-sm leading-relaxed text-muted">
      <h1 className="font-serif text-3xl font-medium text-fg">Regulamin</h1>
      <p>
        Zanim to narzędzie do odkładania decyzji zakupowych. Dane trzymane są lokalnie w twojej
        przeglądarce (localStorage). Plan Plus w tej wersji jest aktywowany lokalnie (mock) i nie
        stanowi realnej płatności.
      </p>
      <p>Korzystając z aplikacji, akceptujesz lokalne przechowywanie swoich list i ustawień.</p>
    </div>
  );
}
