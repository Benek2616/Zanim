import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { isPlusActive, useZanim } from "@/lib/store";

export const Route = createFileRoute("/cennik")({ component: CennikPage });

function CennikPage() {
  const entitlements = useZanim((s) => s.entitlements);
  const profile = useZanim((s) => s.profile);
  const plus = isPlusActive(entitlements);
  const hasAccount = profile.accountCreated;

  return (
    <div className="rise-in space-y-6 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Plus</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Więcej spokoju</h1>
        <p className="mt-2 text-sm text-muted">
          Na start Plus jest <strong className="text-fg">darmowy za założenie konta</strong> — bez
          karty i bez subskrypcji. Płatności możemy dodać później.
        </p>
      </div>

      <article className="rounded-2xl border border-line/60 bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-medium">Darmowy</h2>
          <p className="text-sm font-medium">0 zł</p>
        </div>
        <p className="mt-2 text-sm text-muted">Bez konta — szybki start.</p>
        <ul className="mt-4 space-y-1.5 text-sm">
          <li>• 5 rzeczy naraz w poczekalni</li>
          <li>• Stałe 48 godzin oddechu</li>
          <li>• Werdykt: kupuję albo odpuszczam</li>
        </ul>
        {!plus ? (
          <p className="mt-4 text-sm font-medium text-saved">Twój obecny plan</p>
        ) : null}
      </article>

      <article className="rounded-2xl border border-fg/20 bg-fg p-5 text-accent-fg shadow-soft">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-medium">Plus</h2>
          <p className="text-sm font-medium">0 zł · za konto</p>
        </div>
        <p className="mt-2 text-sm text-accent-fg/75">
          Załóż konto w apce — od razu bez limitu i z własnym czasem oddechu.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-accent-fg/90">
          <li>• Bez limitu rzeczy w poczekalni</li>
          <li>• Czas oddechu od 24 h do 30 dni</li>
          <li>• Raport, cel, passa, godziny pracy</li>
        </ul>
        {plus && hasAccount ? (
          <p className="mt-4 text-sm font-medium">Aktywny dzięki Twojemu kontu</p>
        ) : (
          <Link
            to="/konto"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-accent-fg px-4 text-sm font-semibold text-fg"
          >
            Załóż konto i weź Plus
          </Link>
        )}
      </article>

      <p className="text-xs leading-relaxed text-muted">
        Konto jest zapisywane lokalnie na tym urządzeniu. Nie pobieramy opłat. Gdy będziesz gotów na
        płatny plan i firmę — podłączymy to osobno.
      </p>
    </div>
  );
}
