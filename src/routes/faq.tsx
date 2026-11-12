import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/faq")({ component: FaqPage });

const ITEMS = [
  {
    q: "Jak działa Zanim?",
    a: "Dodajesz rzecz, którą chcesz kupić. Odczekujesz (domyślnie 48 godzin). Potem decydujesz: kupujesz albo odpuszczasz.",
  },
  {
    q: "Czy to kosztuje?",
    a: "Plan darmowy działa od razu. Plus odblokowujesz zakładając konto w aplikacji — bez karty i bez subskrypcji. W przyszłości płatności w sklepach (Google Play / App Store) będą przez ich systemy.",
  },
  {
    q: "Gdzie są moje dane?",
    a: "Lista zakupów, kwoty i decyzje zostają na tym urządzeniu. Imię i e-mail z konta oraz anonimowe dane o wizytach zapisujemy w bazie (Supabase). Możesz zrobić kopię lokalną w Więcej → Dane.",
  },
  {
    q: "Co daje konto / Plus?",
    a: "Bez limitu rzeczy w poczekalni oraz własny czas oddechu (od 24 h do 30 dni). Plus jest obecnie darmowy po założeniu konta.",
  },
  {
    q: "Czy to zastąpi psychoterapię?",
    a: "Nie. To proste narzędzie na impuls zakupowy, nie diagnoza ani leczenie.",
  },
];

function FaqPage() {
  return (
    <div className="rise-in space-y-5 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Pomoc</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Pytania</h1>
      </div>
      <ul className="space-y-3">
        {ITEMS.map((item) => (
          <li
            key={item.q}
            className="rounded-2xl border border-line/70 bg-surface px-4 py-4 shadow-card"
          >
            <p className="font-medium">{item.q}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.a}</p>
          </li>
        ))}
      </ul>
      <Link to="/konto" className="block text-sm font-medium text-fg">
        ← Wróć do Więcej
      </Link>
    </div>
  );
}
