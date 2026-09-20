import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { openCustomerPortal, startCheckout } from "@/lib/billing-client";
import { billingConfigured, getSupabase, type RemoteProfile } from "@/lib/supabase";
import { isPlusActive, useZanim } from "@/lib/store";
import { PLANS, type PlanId } from "@/lib/zanim";

export const Route = createFileRoute("/cennik")({ component: CennikPage });

function CennikPage() {
  const entitlements = useZanim((s) => s.entitlements);
  const activatePlus = useZanim((s) => s.activatePlus);
  const setProfileEntitlements = useZanim((s) => s.activatePlus);
  const localPlus = isPlusActive(entitlements);
  const [email, setEmail] = useState<string | null>(null);
  const [remote, setRemote] = useState<RemoteProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void sb.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      if (data.session?.user) void loadProfile(data.session.user.id);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
      if (session?.user) void loadProfile(session.user.id);
      else setRemote(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // po powrocie z Stripe
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("checkout") === "success") {
      setMsg("Płatność przyjęta. Plan odświeży się za chwilę (webhook)." );
      const sb = getSupabase();
      void sb?.auth.getSession().then(({ data }) => {
        if (data.session?.user) void loadProfile(data.session.user.id);
      });
    }
  }, []);

  async function loadProfile(userId: string) {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) {
      setRemote(data as RemoteProfile);
      // zsynchronizuj lokalne benefity z serwerem
      if (data.plus) {
        const plan =
          data.plan === "plus_year" ? "plus_year" : "plus_month";
        useZanim.setState({
          entitlements: {
            plan,
            plus: true,
            periodEnd: data.period_end,
            cancelAtPeriodEnd: data.cancel_at_period_end,
          },
        });
      } else {
        useZanim.setState({
          entitlements: {
            plan: "free",
            plus: false,
            periodEnd: null,
            cancelAtPeriodEnd: false,
          },
        });
      }
    }
  }

  const plus = remote ? remote.plus : localPlus;

  async function buy(plan: "plus_month" | "plus_year") {
    setMsg(null);
    if (!billingConfigured) {
      // tryb deweloperski bez Stripe
      activatePlus(plan);
      setMsg("Tryb lokalny: Plus włączony bez płatności (brak env Stripe/Supabase).");
      return;
    }
    if (!email) {
      setMsg("Najpierw zaloguj się (Więcej → Konto / logowanie).");
      return;
    }
    setBusy(true);
    const res = await startCheckout(plan);
    setBusy(false);
    if (res.error) {
      setMsg(res.error);
      return;
    }
    if (res.url) window.location.href = res.url;
  }

  async function manage() {
    setBusy(true);
    const res = await openCustomerPortal();
    setBusy(false);
    if (res.error) setMsg(res.error);
    else if (res.url) window.location.href = res.url;
  }

  void setProfileEntitlements;

  return (
    <div className="rise-in space-y-6 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Plus</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Więcej spokoju</h1>
        <p className="mt-2 text-sm text-muted">
          {billingConfigured
            ? "Płatność przez Stripe. Anulujesz kiedy chcesz w panelu klienta."
            : "Płatności jeszcze niepodpięte (brak kluczy). Przycisk włącza Plus lokalnie do testów."}
        </p>
        {email ? (
          <p className="mt-1 text-sm text-muted">
            Zalogowano: <strong className="text-fg">{email}</strong>
          </p>
        ) : billingConfigured ? (
          <p className="mt-2 text-sm">
            <Link to="/konto" className="font-medium text-fg underline">
              Zaloguj się
            </Link>
            , żeby kupić Plus.
          </p>
        ) : null}
      </div>

      {msg ? (
        <p className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-muted">{msg}</p>
      ) : null}

      {(["free", "plus_month", "plus_year"] as PlanId[]).map((id) => {
        const plan = PLANS[id];
        const current =
          (id === "free" && !plus) ||
          (plus && (remote?.plan === id || entitlements.plan === id));
        return (
          <article key={id} className="rounded-2xl border border-line/60 bg-surface p-5 shadow-card">
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
                {billingConfigured && email ? (
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => void manage()}>
                    Zarządzaj subskrypcją
                  </Button>
                ) : (
                  <p className="text-sm text-saved">Aktywny (lokalnie)</p>
                )}
              </div>
            ) : (
              <Button
                className="mt-4"
                size="sm"
                disabled={busy}
                onClick={() => void buy(id as "plus_month" | "plus_year")}
              >
                {busy ? "Chwila…" : "Wybieram"}
              </Button>
            )}
          </article>
        );
      })}
    </div>
  );
}
