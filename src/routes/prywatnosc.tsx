import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/prywatnosc")({ component: PrywatnoscPage });

function PrywatnoscPage() {
  return (
    <div className="rise-in space-y-4 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Dokumenty</p>
        <h1 className="mt-1 font-serif text-3xl font-medium text-fg">Polityka prywatności</h1>
      </div>
      <div className="space-y-3 rounded-2xl border border-line/70 bg-surface p-5 text-sm leading-relaxed text-muted shadow-card">
        <p>
          Administratorem danych w rozumieniu RODO jest operator serwisu Zanim (zanim.com.pl).
          Kontakt: przez formularz na stronie lub e-mail wskazany w regulaminie.
        </p>
        <p>
          <strong className="text-fg">Dane lokalne (na urządzeniu):</strong> Lista rzeczy w poczekalni, kwoty, kategorie, decyzje, notatki, stawka pracy, cele i ustawienia zapisujemy wyłącznie lokalnie (localStorage / pamięć aplikacji). Nie wysyłamy ich na żaden serwer.
        </p>
        <p>
          <strong className="text-fg">Konto i plan Plus:</strong> Jeśli założysz konto (imię/nick oraz e-mail), te dane są wysyłane i zapisywane w naszej bazie danych (Supabase) w celu aktywacji planu Plus, identyfikacji i ewentualnej przyszłej synchronizacji. E-mail jest wymagany do konta.
        </p>
        <p>
          <strong className="text-fg">Statystyki wizyt:</strong> Zbieramy anonimowe dane o wizytach (identyfikator przeglądarki przechowywany lokalnie, ścieżka, referrer, user-agent) i zapisujemy je w Supabase w celach statystycznych oraz ochrony przed nadużyciami. Nie łączymy ich automatycznie z imieniem lub e-mailem.
        </p>
        <p>
          <strong className="text-fg">Płatności:</strong> Na stronie internetowej (jeśli włączone) płatności za Plus obsługuje Stripe. W aplikacji dystrybuowanej przez Google Play subskrypcje będą realizowane przez Google Play Billing.
        </p>
        <p>
          Powiadomienia systemowe działają wyłącznie za Twoją zgodą i lokalnie na urządzeniu.
        </p>
        <p>
          Możesz wyeksportować lub usunąć dane lokalne w Wicej → Dane. Do usunięcia konta i danych w bazie skontaktuj się z nami.
        </p>
        <p>
          Masz prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, sprzeciwu i przenoszenia danych. Możesz złożyć skargę do Prezesa UODO.
        </p>
      </div>
      <Link to="/konto" className="block text-sm font-medium text-fg">
        ← Wróć do Więcej
      </Link>
    </div>
  );
}
