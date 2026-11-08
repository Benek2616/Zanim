import { createFileRoute, Link } from "@tanstack/react-router";
import { isPlusActive, useZanim } from "@/lib/store";
import { PLANS } from "@/lib/zanim";

export const Route = createFileRoute("/cennik")({ component: CennikPage });

function CennikPage() {
  const entitlements = useZanim((s) => s.entitlements);
  const plus = isPlusActive(entitlements);

  return (
    <div className="rise-in space-y-6 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Cennik</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Więcej spokoju</h1>
        <p className="mt-2 text-sm text-muted">
          Darmowy plan zostaje. Plus to 9,99 zł miesięcznie albo 79,99 zł za cały rok —
          z analizą AI przed decyzją.
        </p>
      </div>

      <article className="rounded-2xl border border-line/60 bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-medium">{PLANS.free.name}</h2>
          <p className="text-sm font-medium">{PLANS.free.priceLabel}</p>
        </div>
        <p className="mt-2 text-sm text-muted">{PLANS.free.blurb}</p>
        <ul className="mt-4 space-y-1.5 text-sm">
          {PLANS.free.features.map((f) => (
            <li key={f}>• {f}</li>
          ))}
        </ul>
        {!plus ? <p className="mt-4 text-sm font-medium text-saved">Twój obecny plan</p> : null}
      </article>

      <article className="rounded-2xl border border-fg/20 bg-fg p-5 text-accent-fg shadow-soft">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-medium">{PLANS.plus_month.name}</h2>
          <p className="text-sm font-medium">{PLANS.plus_month.priceLabel} / {PLANS.plus_month.periodLabel}</p>
        </div>
        <p className="mt-2 text-sm text-accent-fg/75">{PLANS.plus_month.blurb}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-accent-fg/90">
          {PLANS.plus_month.features.map((f) => (
            <li key={f}>• {f}</li>
          ))}
        </ul>
        <div className="mt-4">
          <Link
            to="/konto"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-accent-fg px-4 text-sm font-semibold text-fg"
          >
            Wybierz Plus
          </Link>
        </div>
      </article>

      <article className="rounded-2xl border border-line/60 bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-medium">{PLANS.plus_year.name}</h2>
          <p className="text-sm font-medium">{PLANS.plus_year.priceLabel} / {PLANS.plus_year.periodLabel}</p>
        </div>
        <p className="mt-2 text-sm text-muted">{PLANS.plus_year.blurb}</p>
        <ul className="mt-4 space-y-1.5 text-sm">
          {PLANS.plus_year.features.map((f) => (
            <li key={f}>• {f}</li>
          ))}
        </ul>
        <div className="mt-4">
          <Link
            to="/konto"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-fg px-4 text-sm font-semibold text-accent-fg"
          >
            Wybierz rok
          </Link>
        </div>
      </article>

      <p className="text-xs leading-relaxed text-muted">
        Płatności (Stripe / BLIK / Apple Pay) podłączymy, gdy będziesz gotowy. Na razie plany są opisane
        — funkcje AI działają lokalnie dla testów.
      </p>
    </div>
  );
}
