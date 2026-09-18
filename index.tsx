import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ItemCard } from "@/components/item-card";
import { PauseBars } from "@/components/pause-bars";
import { Button, buttonVariants } from "@/components/ui/button";
import { notificationPermission, notifyReady, requestNotifications, setAppBadge } from "@/lib/notify";
import { isPlusActive, useZanim } from "@/lib/store";
import { formatZl, hoursOfWork, PLANS } from "@/lib/zanim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const items = useZanim((s) => s.items);
  const profile = useZanim((s) => s.profile);
  const entitlements = useZanim((s) => s.entitlements);
  const decide = useZanim((s) => s.decide);
  const extend = useZanim((s) => s.extend);
  const remove = useZanim((s) => s.remove);
  const [now, setNow] = useState(() => Date.now());
  const [perm, setPerm] = useState(() =>
    typeof window === "undefined" ? "default" : notificationPermission(),
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const waiting = useMemo(() => items.filter((i) => i.status === "waiting"), [items]);
  const verdicts = useMemo(
    () => items.filter((i) => i.status !== "waiting").slice(0, 8),
    [items],
  );
  const skippedSum = useMemo(
    () => items.filter((i) => i.status === "skipped").reduce((s, i) => s + i.amountGrosze, 0),
    [items],
  );
  const ready = useMemo(
    () => waiting.filter((i) => now >= new Date(i.readyAt).getTime()),
    [waiting, now],
  );
  const plus = isPlusActive(entitlements);
  const planLabel = plus
    ? entitlements.plan === "plus_year"
      ? "Plus · rok"
      : "Plus"
    : "Darmowy";

  useEffect(() => {
    setAppBadge(ready.length);
    notifyReady(
      ready.map((item) => ({
        id: item.id,
        title: item.title,
        amountLabel: formatZl(item.amountGrosze),
      })),
    );
  }, [ready]);

  return (
    <div className="rise-in pb-6">
      <p className="text-2xs font-medium tracking-mark text-subtle uppercase">Poczekalnia</p>
      <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight">
        Rzeczy, które mogą poczekać
      </h1>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat label="W poczekalni" value={String(waiting.length)} />
        <Stat label="Odpuszczone" value={formatZl(skippedSum)} saved />
        <Stat label="Plan" value={planLabel} />
      </div>

      {perm === "default" ? (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-fg px-4 py-3 text-accent-fg">
          <p className="text-sm leading-snug">Włącz powiadomienia — damy znać, gdy czas minie.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void requestNotifications().then(() => setPerm(notificationPermission()))}
          >
            Włącz
          </Button>
        </div>
      ) : null}

      {ready.length > 0 ? (
        <div className="mt-5 rounded-lg bg-warn/10 px-4 py-3 text-warn">
          <p className="text-sm font-medium">
            {ready.length === 1
              ? `Czas minął: ${ready[0]!.title} — kupujesz albo odpuszczasz.`
              : `Czas minął na ${ready.length} rzeczach.`}
          </p>
        </div>
      ) : null}

      {waiting.length === 0 ? (
        <div className="mt-8 rounded-xl bg-fg px-5 py-12 text-center text-accent-fg">
          <PauseBars className="mx-auto h-12 justify-center text-accent-fg" />
          <p className="mt-6 font-serif text-2xl font-medium">Pusto. To dobrze.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-accent-fg/70">
            Gdy coś kusi, wrzuć to tutaj zamiast do koszyka. 48 godzin robi różnicę.
          </p>
          <Link
            to="/nowe"
            className={cn(buttonVariants({ variant: "secondary" }), "mt-6 inline-flex")}
          >
            Pierwsza rzecz
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3">
          {waiting.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              now={now}
              hours={
                plus
                  ? hoursOfWork(
                      item.amountGrosze,
                      profile.monthlyIncomeGrosze,
                      profile.monthlyHours,
                    )
                  : null
              }
              onDecide={decide}
              onExtend={extend}
              onDelete={remove}
            />
          ))}
        </ul>
      )}

      {verdicts.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-serif text-xl font-medium">Ostatnie werdykty</h2>
          <ul className="mt-4 grid gap-2">
            {verdicts.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-2 rounded-lg bg-surface px-4 py-3 ring-1 ring-line"
              >
                <span className="font-medium">{item.title}</span>
                <span className="text-sm text-muted">
                  {item.status === "skipped" ? "odpuszczone" : "kupione"} ·{" "}
                  {formatZl(item.amountGrosze)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!plus ? (
        <p className="mt-10 text-center text-xs text-subtle">
          {PLANS.free.features[0]} ·{" "}
          <Link to="/cennik" className="font-medium text-fg underline-offset-2 hover:underline">
            Plus 9 zł
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value, saved }: { label: string; value: string; saved?: boolean }) {
  return (
    <div className="rounded-lg bg-surface px-3 py-3 ring-1 ring-line">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-serif text-lg font-medium tabular-nums leading-tight",
          saved && "text-saved",
        )}
      >
        {value}
      </p>
    </div>
  );
}
