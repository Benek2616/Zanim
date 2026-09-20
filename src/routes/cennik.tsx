import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { isPlusActive, useZanim } from "@/lib/store";
import { PLANS, type PlanId } from "@/lib/zanim";

export const Route = createFileRoute("/cennik")({ component: CennikPage });

function CennikPage() {
  const entitlements = useZanim((s) => s.entitlements);
  const activatePlus = useZanim((s) => s.activatePlus);
  const cancelPlus = useZanim((s) => s.cancelPlus);
  const resumePlus = useZanim((s) => s.resumePlus);
  const plus = isPlusActive(entitlements);

  return (
    <div className="rise-in space-y-6 pb-6">
      <div>
        <p className="text-2xs font-medium uppercase tracking-mark text-subtle">Plus</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Więcej spokoju</h1>
        <p className="mt-2 text-sm text-muted">
          Bez limitu rzeczy i z własnym czasem oddechu. Płatność mockowa — aktywuje się lokalnie.
        </p>
      </div>

      {(["free", "plus_month", "plus_year"] as PlanId[]).map((id) => {
        const plan = PLANS[id];
        const current =
          (id === "free" && !plus) ||
          (plus && entitlements.plan === id);
        return (
          <article key={id} className="rounded-xl bg-surface p-5 shadow-card">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-serif text-xl font-medium">{plan.name}</h2>
              <p className="text-sm font-medium">
                {plan.priceLabel}
                {id !== "free" ? (
                  <span className="text-muted"> / {plan.periodLabel}</span>
                ) : null}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted">{plan.blurb}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {plan.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            {id === "free" ? null : current ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {entitlements.cancelAtPeriodEnd ? (
                  <Button size="sm" onClick={resumePlus}>
                    Wznów
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={cancelPlus}>
                    Anuluj na koniec okresu
                  </Button>
                )}
              </div>
            ) : (
              <Button
                className="mt-4"
                size="sm"
                onClick={() => activatePlus(id as "plus_month" | "plus_year")}
              >
                Wybieram
              </Button>
            )}
          </article>
        );
      })}
    </div>
  );
}
