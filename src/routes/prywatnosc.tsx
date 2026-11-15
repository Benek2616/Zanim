import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/prywatnosc")({ component: PrywatnoscPage });

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="font-medium text-fg">{title}</p>
      {children}
    </div>
  );
}

function PrywatnoscPage() {
  return (
    <div className="rise-in space-y-4 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Dokumenty</p>
        <h1 className="mt-1 font-serif text-3xl font-medium text-fg">Polityka prywatności</h1>
        <p className="mt-1 text-xs text-subtle">Ostatnia aktualizacja: 15 listopada 2026 r.</p>
      </div>
      <div className="space-y-4 rounded-2xl border border-line/70 bg-surface p-5 text-sm leading-relaxed text-muted shadow-card">
        <Section title="Administrator">
          <p>
            Administratorami danych są Beniamin Haręża i Bartosz Konik, prowadzący serwis i aplikację Zanim (zanim.com.pl).
            Kontakt w sprawach prywatności: <a className="font-medium text-fg" href="mailto:zanim.com.pl@gmail.com">zanim.com.pl@gmail.com</a>.
          </p>
        </Section>

        <Section title="Dane tylko na Twoim urządzeniu">
          <p>
            Lista rzeczy w poczekalni, kwoty, kategorie, notatki, decyzje, dochód i godziny pracy, cel oszczędności oraz
            ustawienia zapisujemy w pamięci urządzenia (localStorage). Nie wysyłamy ich na serwer — z wyjątkami opisanymi
            niżej, na które sam się decydujesz (powiadomienia, sprawdzanie ceny).
          </p>
        </Section>

        <Section title="Konto i plan Plus">
          <p>
            Gdy zakładasz konto, imię/nick i adres e-mail (oraz informacja o przeglądarce — user-agent) są zapisywane w naszej
            bazie danych Supabase. Cel: aktywacja i obsługa planu Plus, kontakt w sprawie konta (art. 6 ust. 1 lit. b RODO).
            Trzymamy je do czasu usunięcia konta — napisz do nas, a usuniemy je z bazy.
          </p>
        </Section>

        <Section title="Statystyki wizyt">
          <p>
            Przy otwieraniu stron zapisujemy w Supabase: losowy identyfikator przeglądarki (przechowywany lokalnie),
            odwiedzaną podstronę, adres strony odsyłającej i user-agent. Cel: statystyki i ochrona przed nadużyciami
            (prawnie uzasadniony interes, art. 6 ust. 1 lit. f RODO). Nie łączymy tych danych z imieniem ani e-mailem.
          </p>
        </Section>

        <Section title="Powiadomienia push">
          <p>
            Powiadomienia są dobrowolne i działają tylko po Twojej zgodzie (art. 6 ust. 1 lit. a RODO). Po ich włączeniu
            zapisujemy w Supabase: losowy identyfikator urządzenia, dane subskrypcji push przeglądarki (adres usługi push i
            klucze szyfrowania), strefę czasową, czas ostatniej aktywności, Twoje ustawienia powiadomień oraz dziennik
            wysłanych powiadomień (żeby nie wysyłać za często ani dwa razy tego samego). Dodatkowo, tylko gdy dana kategoria
            jest włączona:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-fg">Automatyczne</strong> — nazwa rzeczy i moment końca czasu oddechu (bez kwot i
              notatek), żeby przypomnieć „minęło 48 godzin”, także gdy aplikacja jest zamknięta;
            </li>
            <li>
              <strong className="text-fg">Motywacyjne</strong> — zbiorcze liczby: ile rzeczy czeka oraz ile i za jaką kwotę
              odpuszczono w tygodniu/miesiącu (do podsumowań);
            </li>
            <li>
              <strong className="text-fg">Marketingowe</strong> — domyślnie wyłączone; zapisujemy datę wyrażenia zgody.
            </li>
          </ul>
          <p>
            Treść powiadomienia trafia do Ciebie przez usługę push Twojej przeglądarki (np. Google Firebase Cloud Messaging
            w Chrome/Androidzie) w postaci zaszyfrowanej. Wyłączenie kategorii usuwa związane z nią dane, a „Wyłącz wszystkie”
            w ustawieniach Powiadomień usuwa z serwera wszystkie dane powiadomień tego urządzenia.
          </p>
        </Section>

        <Section title="Sprawdzanie ceny">
          <p>
            Gdy używasz „Sprawdź cenę”, wpisana nazwa produktu jest wysyłana przez nasz serwer do zewnętrznych wyszukiwarek
            cen (Steam, CheapShark, UPCitemdb). Nie zapisujemy jej w bazie.
          </p>
        </Section>

        <Section title="Płatności">
          <p>
            Plus jest obecnie dostępny za założenie konta, bez opłat. Jeśli w przyszłości uruchomimy płatności, na stronie
            obsłuży je Stripe, a w aplikacji z Google Play — Google Play Billing. Nie przechowujemy danych kart.
          </p>
        </Section>

        <Section title="Odbiorcy i przekazywanie danych">
          <p>
            Dane powierzamy dostawcom, bez których serwis nie działa: Vercel (hosting), Supabase (baza danych), dostawcy usług
            push przeglądarek (np. Google). Strona pobiera też czcionki z Google Fonts (przeglądarka łączy się wtedy z
            serwerami Google). Część dostawców może przetwarzać dane poza EOG na podstawie standardowych klauzul umownych lub
            programu EU-US Data Privacy Framework.
          </p>
        </Section>

        <Section title="Twoje prawa">
          <p>
            Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia, sprzeciwu oraz
            cofnięcia zgody w dowolnym momencie (bez wpływu na wcześniejsze przetwarzanie). Dane lokalne wyeksportujesz lub
            usuniesz w Więcej → Dane. W sprawie danych w bazie napisz na zanim.com.pl@gmail.com. Możesz też złożyć skargę do
            Prezesa UODO.
          </p>
        </Section>
      </div>
      <Link to="/konto" className="block text-sm font-medium text-fg">
        ← Wróć do Więcej
      </Link>
    </div>
  );
}
