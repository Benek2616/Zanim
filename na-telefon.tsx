import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Share, Smartphone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ZMark } from "@/components/mark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/na-telefon")({ component: NaTelefon });

function NaTelefon() {
  return (
    <div className="rise-in pb-10">
      <p className="text-2xs font-medium tracking-mark text-subtle uppercase">Aplikacja</p>
      <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight">Zanim na telefonie.</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Ikona na ekranie głównym, pełny ekran, twoja poczekalnia. Bez paska przeglądarki. Tak
        wyglądają aplikacje na telefon — i tak działa Zanim.
      </p>

      <section className="mt-8 rounded-xl bg-fg p-5 text-accent-fg shadow-ink">
        <p className="text-2xs font-medium tracking-mark uppercase text-accent-fg/55">
          Google Play · App Store
        </p>
        <h2 className="mt-2 font-serif text-xl font-medium">Wejście do sklepów</h2>
        <p className="mt-2 text-sm leading-relaxed text-accent-fg/75">
          Aplikacja jest gotowa jako PWA: możesz ją zainstalować już teraz. Żeby pojawiła się w
          Google Play i App Store, potrzebne są konta dewelopera i pakiet natywny (TWA na Androida,
          Capacitor / wrapper na iOS) plus recenzja sklepu.
        </p>
        <ul className="mt-4 grid gap-2 text-sm text-accent-fg/80">
          <li>Google Play Console — 25 USD, jednorazowo</li>
          <li>Apple Developer Program — 99 USD / rok</li>
          <li>Ikona 1024×1024, zrzuty ekranu, polityka prywatności, regulamin</li>
          <li>Płatności Plus w sklepach: In-App Purchase (nie Stripe w przeglądarce)</li>
        </ul>
      </section>

      <section className="mt-8 grid gap-4">
        <article className="rounded-xl bg-surface p-5 ring-1 ring-line">
          <p className="text-2xs font-medium tracking-mark text-subtle uppercase">iPhone</p>
          <h2 className="mt-3 font-serif text-xl font-medium">Safari, trzy stuknięcia</h2>
          <ol className="mt-4 grid gap-3 text-sm leading-relaxed text-muted">
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-elevated text-fg">
                <Share className="size-4" strokeWidth={1.75} />
              </span>
              <span>Otwórz Zanim w Safari i stuknij Udostępnij.</span>
            </li>
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-elevated text-fg">
                <Plus className="size-4" strokeWidth={1.75} />
              </span>
              <span>Wybierz „Dodaj do ekranu początkowego”.</span>
            </li>
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-elevated">
                <ZMark className="size-8" />
              </span>
              <span>Potwierdź. Ikona Zanim ląduje obok reszty aplikacji.</span>
            </li>
          </ol>
        </article>

        <article className="rounded-xl bg-surface p-5 ring-1 ring-line">
          <p className="text-2xs font-medium tracking-mark text-subtle uppercase">Android</p>
          <h2 className="mt-3 font-serif text-xl font-medium">Chrome sam zaproponuje</h2>
          <ol className="mt-4 grid gap-3 text-sm leading-relaxed text-muted">
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-elevated text-fg">
                <Smartphone className="size-4" strokeWidth={1.75} />
              </span>
              <span>Otwórz adres w Chrome. Menu → „Zainstaluj aplikację”.</span>
            </li>
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-elevated">
                <ZMark className="size-8" />
              </span>
              <span>Albo poczekaj na pasek na dole i stuknij Zainstaluj.</span>
            </li>
          </ol>
        </article>
      </section>

      <section className="mt-8 border-t border-line pt-8">
        <h2 className="font-serif text-xl font-medium">Opis do sklepów</h2>
        <p className="mt-3 text-xs font-medium tracking-mark text-subtle uppercase">Krótki</p>
        <p className="mt-1 text-sm text-muted">
          48 godzin ciszy, potem decyzja. Poczekalnia zakupów — zanim kupisz, zanim żałujesz.
        </p>
        <p className="mt-4 text-xs font-medium tracking-mark text-subtle uppercase">Pełny</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Sklepy krzyczą „kup teraz”. Zanim jest pauzą. Wrzucasz rzecz do poczekalni, odczekujesz
          48 godzin (albo dłużej w Plusie) i dopiero wtedy decydujesz: kupuję albo odpuszczam.
          Widzisz, ile godzin twojej pracy to było i ile zostało w kieszeni. Darmowy plan: 5
          rzeczy i stałe 48 godzin. Plus: 9 zł / mies. albo 79 zł / rok — bez limitu, własny czas
          oddechu, raport oszczędności.
        </p>
        <p className="mt-4 text-xs text-subtle">Kategoria: Styl życia · Wiek: 4+</p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/prywatnosc" className={cn(buttonVariants({ variant: "secondary" }))}>
          Polityka prywatności
        </Link>
        <Link to="/regulamin" className={cn(buttonVariants({ variant: "ghost" }))}>
          Regulamin
        </Link>
      </div>
    </div>
  );
}
