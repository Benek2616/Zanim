import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/prywatnosc")({ component: Prywatnosc });

function Prywatnosc() {
  return (
    <article className="rise-in prose-legal pb-12">
      <p className="text-2xs font-medium tracking-mark text-subtle uppercase">RODO</p>
      <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight">
        Polityka prywatności
      </h1>
      <p className="mt-3 text-sm text-muted">Obowiązuje od 16 września 2026. Wersja na telefon.</p>

      <section className="mt-8 grid gap-3 text-sm leading-relaxed text-muted">
        <h2 className="font-serif text-xl font-medium text-fg">Kto odpowiada</h2>
        <p>
          Administratorem danych w rozumieniu RODO jest operator serwisu Zanim (zanim.com.pl).
          Kontakt w sprawach prywatności: przez formularz na zanim.com.pl.
        </p>
      </section>

      <section className="mt-8 grid gap-3 text-sm leading-relaxed text-muted">
        <h2 className="font-serif text-xl font-medium text-fg">Co zbieramy w aplikacji</h2>
        <p>
          Ta wersja Zanim na telefon zapisuje poczekalnię, werdykty, stawkę pracy, plan Plus i
          twoją ocenę wyłącznie lokalnie, na urządzeniu (pamięć przeglądarki / aplikacji). Nie
          wysyłamy tego na serwer. Nie tworzymy konta w chmurze. Nie sprzedajemy danych.
        </p>
        <p>
          Jeśli włączysz powiadomienia systemowe, przeglądarka zapyta o zgodę. Treść powiadomienia
          to nazwa rzeczy i kwota, które sama / sam wpisałaś / wpisałeś.
        </p>
      </section>

      <section className="mt-8 grid gap-3 text-sm leading-relaxed text-muted">
        <h2 className="font-serif text-xl font-medium text-fg">Czego nie robimy</h2>
        <ul className="grid gap-2">
          <li>Nie śledzimy cię reklamami ani pikselami.</li>
          <li>Nie udostępniamy listy zakupów stronom trzecim.</li>
          <li>Nie wymagamy numeru telefonu, PESEL-u ani karty, żeby korzystać z darmowego planu.</li>
        </ul>
      </section>

      <section className="mt-8 grid gap-3 text-sm leading-relaxed text-muted">
        <h2 className="font-serif text-xl font-medium text-fg">Twoje prawa</h2>
        <p>
          Masz prawo do wglądu, poprawienia i usunięcia danych. W tej aplikacji wystarczy wyczyścić
          dane strony w ustawieniach przeglądarki albo usunąć aplikację z ekranu początkowego —
          poczekalnia znika razem z nimi.
        </p>
        <p>
          Możesz złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2,
          00-193 Warszawa.
        </p>
      </section>

      <section className="mt-8 grid gap-3 text-sm leading-relaxed text-muted">
        <h2 className="font-serif text-xl font-medium text-fg">Dzieci</h2>
        <p>
          Aplikacja nie jest kierowana do osób poniżej 16. roku życia. Nie zbieramy świadomie
          danych dzieci.
        </p>
      </section>

      <p className="mt-10 text-sm">
        <Link to="/regulamin" className="font-medium text-fg underline-offset-2 hover:underline">
          Regulamin
        </Link>
      </p>
    </article>
  );
}
