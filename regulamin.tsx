import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/regulamin")({ component: Regulamin });

function Regulamin() {
  return (
    <article className="rise-in pb-12">
      <p className="text-2xs font-medium tracking-mark text-subtle uppercase">Umowa</p>
      <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight">Regulamin</h1>
      <p className="mt-3 text-sm text-muted">Zanim — poczekalnia zakupów. Wersja na telefon.</p>

      <ol className="mt-8 grid gap-6 text-sm leading-relaxed text-muted">
        <li>
          <h2 className="font-serif text-lg font-medium text-fg">1. Czym jest Zanim</h2>
          <p className="mt-2">
            Zanim to narzędzie do odkładania decyzji zakupowych. Wrzucasz rzecz do poczekalni,
            odczekujesz, potem kupujesz albo odpuszczasz. Nie jesteśmy sklepem, porównywarką ani
            pośrednikiem płatności za towary, które odkładasz.
          </p>
        </li>
        <li>
          <h2 className="font-serif text-lg font-medium text-fg">2. Plany</h2>
          <p className="mt-2">
            Plan darmowy: do 5 rzeczy naraz i stałe 48 godzin oddechu. Plan Plus: 9 zł / miesiąc
            albo 79 zł / rok — bez limitu rzeczy, czas oddechu od 24 godzin do 30 dni, raport
            oszczędności i przelicznik na godziny pracy.
          </p>
        </li>
        <li>
          <h2 className="font-serif text-lg font-medium text-fg">3. Płatności</h2>
          <p className="mt-2">
            Na zanim.com.pl Plus rozlicza Stripe (karta, Apple Pay, Google Pay, BLIK). W tej
            aplikacji na telefon Plus można aktywować na urządzeniu; po publikacji w Google Play i
            App Store płatności cyfrowe muszą iść przez system sklepu. Rezygnacja w każdej chwili —
            Plus działa do końca opłaconego okresu.
          </p>
        </li>
        <li>
          <h2 className="font-serif text-lg font-medium text-fg">4. Twoje dane</h2>
          <p className="mt-2">
            Lista rzeczy i werdykty w tej wersji zostają na telefonie. Szczegóły:{" "}
            <Link to="/prywatnosc" className="font-medium text-fg underline-offset-2 hover:underline">
              polityka prywatności
            </Link>
            .
          </p>
        </li>
        <li>
          <h2 className="font-serif text-lg font-medium text-fg">5. Odpowiedzialność</h2>
          <p className="mt-2">
            Zanim nie gwarantuje, że odczekanie powstrzyma zakup, ani że ceny w sklepach nie
            wzrosną. Korzystasz na własną odpowiedzialność. Serwis dostarczamy „tak jak jest”.
          </p>
        </li>
        <li>
          <h2 className="font-serif text-lg font-medium text-fg">6. Prawo</h2>
          <p className="mt-2">
            Prawem właściwym jest prawo polskie. Spory rozstrzygają sądy właściwe według siedziby
            administratora, z zastrzeżeniem bezwzględnie obowiązujących przepisów o konsumencie.
            Konsument może skorzystać z platformy ODR Komisji Europejskiej.
          </p>
        </li>
      </ol>
    </article>
  );
}
