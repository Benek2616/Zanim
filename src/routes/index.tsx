import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ItemCard } from "@/components/item-card";
import { PauseBars } from "@/components/pause-bars";
import { Button } from "@/components/ui/button";
import {
  notificationPermission,
  notifyReady,
  requestNotifications,
  setAppBadge,
} from "@/lib/notify";
import { isPlusActive, useZanim } from "@/lib/store";
import { formatZl } from "@/lib/zanim";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const items = useZanim((s) => s.items);
  const entitlements = useZanim((s) => s.entitlements);
  const decide = useZanim((s) => s.decide);
  const extend = useZanim((s) => s.extend);
  const [now, setNow] = useState(() => Date.now());
  const [perm, setPerm] = useState(() =>
    typeof window === "undefined" ? "default" : notificationPermission(),
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const waiting = useMemo(() => items.filter((i) => i.status === "waiting"), [items]);
  const skippedSum = useMemo(
    () => items.filter((i) => i.status === "skipped").reduce((s, i) => s + i.amountGrosze, 0),
    [items],
  );
  const ready = useMemo(
    () => waiting.filter((i) => now >= new Date(i.readyAt).getTime()),
    [waiting, now],
  );
  const plus = isPlusActive(entitlements);

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
      <p className="text-2xs font-medium uppercase tracking-mark text-subtle">Poczekalnia</p>
      <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight">
        Rzeczy, które mogą poczekać
      </h1>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat label="W poczekalni" value={String(waiting.length)} />
        <Stat label="Odpuszczone" value={formatZl(skippedSum)} saved />
        <Stat label="Plan" value={plus ? "Plus" : "Darmowy"} />
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

      {waiting.length === 0 ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="text-fg">
            <PauseBars />
          </div>
          <p className="mt-6 font-serif text-xl">Pusto i spokojnie</p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Dodaj rzecz, którą chcesz kupić. Odczekaj 48 godzin. Potem zdecyduj.
          </p>
          <Link
            to="/nowe"
            className="mt-6 inline-flex h-11 items-center rounded-md bg-fg px-5 text-sm font-medium text-accent-fg"
          >
            Dodaj pierwszą rzecz
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {waiting.map((item) => (
            <li key={item.id}>
              <ItemCard
                item={item}
                now={now}
                onBuy={() => decide(item.id, "bought")}
                onSkip={() => decide(item.id, "skipped")}
                onExtend={() => extend(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, saved }: { label: string; value: string; saved?: boolean }) {
  return (
    <div className="rounded-lg bg-surface px-3 py-3 shadow-card">
      <p className="text-2xs uppercase tracking-mark text-subtle">{label}</p>
      <p className={`mt-1 font-serif text-lg font-medium ${saved ? "text-saved" : ""}`}>{value}</p>
    </div>
  );
}
