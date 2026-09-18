import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { isPlusActive, useZanim } from "@/lib/store";
import { formatZl, PLANS, type PlanId } from "@/lib/zanim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cennik")({ component: Cennik });

function Cennik() {
  const entitlements = useZanim((s) => s.entitlements);
  const activatePlus = useZanim((s) => s.activatePlus);
  const plus = isPlusActive(entitlements);
  const [notice, setNotice] = useState<string | null>(null);

  function buy(plan: Exclude<PlanId, "free">) {
    activatePlus(plan);
    const label = plan === "plus_year" ? "roczny" : "miesięczny";
    setNotice(
      `Plus ${label} jest aktywny na tym telefonie do ${new Date(
        Date.now() + PLANS[plan].periodDays * 86_400_000,
      ).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}.`,
    );
  }

  return (
    <div className="rise-in pb-10">
      <p className="text-2xs font-medium tracking-mark text-subtle uppercase">Cennik</p>
      <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight">
        Płać jak za kawę, nie jak za SaaS z Doliny.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Darmowy plan nie znika. Plus to 9 zł miesięcznie albo 79 zł za cały rok.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {["Karta", "Apple Pay", "Google Pay", "BLIK"].map((m) => (
          <li
            key={m}
            className="rounded-full bg-elevated px-3 py-1 text-2xs font-medium tracking-wide text-fg"
          >
            {m}
          </li>
        ))}
      </ul>
      {plus ? (
        <p className="mt-4 text-sm text-saved">
          Plus jest włączony
          {entitlements.periodEnd
            ? ` · do ${new Date(entitlements.periodEnd).toLocaleDateString("pl-PL")}`
            : ""}
          .
        </p>
      ) : null}
      {notice ? <p className="mt-3 text-sm text-saved">{notice}</p> : null}

      <div className="mt-8 grid gap-4">
        <PlanCard
          plan="free"
          cta={
            <Link to="/" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
              Otwórz poczekalnię
            </Link>
          }
        />
        <PlanCard
          plan="plus_month"
          highlight
          cta={
            <PayBlock
              label="Wykup Plus — 9 zł"
              busy={false}
              onPay={() => buy("plus_month")}
              ink
            />
          }
        />
        <PlanCard
          plan="plus_year"
          cta={
            <PayBlock
              label="Wykup rok — 79 zł"
              busy={false}
              onPay={() => buy("plus_year")}
            />
          }
        />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-subtle">
        W tej aplikacji na telefon Plus włącza się na urządzeniu — bez obciążenia karty. Przy
        publikacji w Google Play i App Store płatności przejdą przez sklep (in-app purchase). Na
        stronie zanim.com.pl działa Stripe: karta, Apple Pay, Google Pay albo BLIK.
      </p>

      <dl className="mt-10 grid gap-6 border-t border-line pt-8 text-sm">
        <div>
          <dt className="font-medium text-fg">Jak płacisz</dt>
          <dd className="mt-1 leading-relaxed text-muted">
            Karta, Apple Pay i Google Pay odnawiają Plus same. BLIK to jednorazowa wpłata — Plus
            działa do końca opłaconego okresu, bez automatycznego przedłużenia.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-fg">Rezygnacja</dt>
          <dd className="mt-1 leading-relaxed text-muted">
            W każdej chwili, w ustawieniach. Plus działa do końca opłaconego okresu.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-fg">Darmowy zostaje</dt>
          <dd className="mt-1 leading-relaxed text-muted">
            5 rzeczy i 48 godzin oddechu. Bez karty, bez haczyka, bez „trialu, który sam się
            przedłuża”.
          </dd>
        </div>
      </dl>
    </div>
  );
}

function PayBlock({
  label,
  onPay,
  busy,
  ink,
}: {
  label: string;
  onPay: () => void;
  busy: boolean;
  ink?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Button className="w-full" variant={ink ? "secondary" : "primary"} disabled={busy} onClick={onPay}>
        {label}
      </Button>
      <p className={ink ? "text-xs text-accent-fg/60" : "text-xs text-subtle"}>
        Na telefonie: aktywacja na urządzeniu · w sklepach: IAP
      </p>
    </div>
  );
}

function PlanCard({
  plan,
  highlight,
  cta,
}: {
  plan: PlanId;
  highlight?: boolean;
  cta: ReactNode;
}) {
  const p = PLANS[plan];
  return (
    <article
      className={cn(
        "flex flex-col rounded-xl p-5",
        highlight ? "bg-fg text-accent-fg shadow-card" : "bg-surface ring-1 ring-line",
      )}
    >
      <p className={highlight ? "text-xs text-accent-fg/70" : "text-xs text-muted"}>{p.name}</p>
      <p className="mt-3 font-serif text-4xl font-medium tracking-tight">
        {p.priceLabel}
        <span
          className={highlight ? "ml-1 text-base text-accent-fg/70" : "ml-1 text-base text-muted"}
        >
          / {p.periodLabel}
        </span>
      </p>
      <p className={highlight ? "mt-3 text-sm text-accent-fg/80" : "mt-3 text-sm text-muted"}>
        {p.blurb}
      </p>
      <ul className="mt-5 flex flex-1 flex-col gap-2">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">{cta}</div>
      {plan !== "free" ? (
        <p className={highlight ? "mt-3 text-xs text-accent-fg/60" : "mt-3 text-xs text-subtle"}>
          {formatZl(p.priceGrosze)} za {p.periodLabel}
        </p>
      ) : null}
    </article>
  );
}
