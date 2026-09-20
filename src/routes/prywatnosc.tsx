import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/prywatnosc")({ component: PrywatnoscPage });

function PrywatnoscPage() {
  return (
    <div className="rise-in space-y-3 pb-6 text-sm leading-relaxed text-muted">
      <h1 className="font-serif text-3xl font-medium text-fg">Prywatność</h1>
      <p>
        Twoje rzeczy, kwoty i decyzje zapisujemy tylko w tej przeglądarce (localStorage). Nie
        wysyłamy ich na serwer w tej wersji aplikacji.
      </p>
      <p>
        Powiadomienia systemowe działają wyłącznie za twoją zgodą i lokalnie na urządzeniu.
      </p>
    </div>
  );
}
