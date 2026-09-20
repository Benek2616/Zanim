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
import { formatZl, SUGGESTIONS } from "@/lib/zanim";

export const Route = createFileRoute("/")({ component: Home });

type Filter = "all" | "ready" | "waiting";

const TIPS = [
  {
    tag: "Nowość",
    title: "Zakładki w poczekalni",
    body: "Filtruj: Wszystkie, Gotowe, Czekają — szybciej znajdziesz werdykty.",
  },
  {
    tag: "Wskazówka",
    title: "48 godzin to nie kara",
    body: "To przerwa na oddech. Większość impulsów mija, zanim skończy się timer.",
  },
  {
    tag: "Plus",
    title: "Własny czas oddechu",
    body: "Od 24 h do 30 dni — w planie Plus ustawiasz tempo pod siebie.",
  },
  {
    tag: "Na telefon",
    title: "Zainstaluj na ekranie",
    body: "Działa jak aplikacja, także offline. Zobacz Więcej → Na telefon.",
  },
];

function Home() {
  const items = useZanim((s) => s.items);
  const entitlements = useZanim((s) => s.entitlements);
  const decide = useZanim((s) => s.decide);
  const extend = useZanim((s) => s.extend);
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState<Filter>("all");
  const [tipIndex, setTipIndex] = useState(0);
  const [perm, setPerm] = useState(() =>
    typeof window === "undefined" ? "default" : notificationPermission(),
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 6000);
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
  const stillWaiting = useMemo(
    () => waiting.filter((i) => now < new Date(i.readyAt).getTime()),
    [waiting, now],
  );
  const plus = isPlusActive(entitlements);

  const visible = useMemo(() => {
    if (filter === "ready") return ready;
    if (filter === "waiting") return stillWaiting;
    return waiting;
  }, [filter, ready, stillWaiting, waiting]);

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

  const tip = TIPS[tipIndex];

  return (
    <div className="pb-4">
      <div className="rise-in">
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Poczekalnia</p>
        <h1 className="mt-1 font-serif text-[1.85rem] font-medium leading-tight tracking-tight">
          Rzeczy, które mogą poczekać
        </h1>
      </div>

      {/* Rotating tip / news card */}
      <div className="rise-in-2 mt-4 overflow-hidden rounded-2xl border border-line/60 bg-fg px-4 py-4 text-accent-fg shadow-soft">
        <p className="text-2xs font-semibold uppercase tracking-mark text-accent-fg/60">{tip.tag}</p>
        <p className="mt-1 font-serif text-lg font-medium">{tip.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-accent-fg/75">{tip.body}</p>
        <div className="mt-3 flex gap-1.5">
          {TIPS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Wskazówka ${i + 1}`}
              onClick={() => setTipIndex(i)}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i === tipIndex ? "bg-accent-fg" : "bg-accent-fg/25"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="rise-in-3 mt-4 grid grid-cols-3 gap-2.5">
        <Stat label="W poczekalni" value={String(waiting.length)} />
        <Stat label="Odpuszczone" value={formatZl(skippedSum)} saved />
        <Stat label="Plan" value={plus ? "Plus" : "Darmowy"} />
      </div>

      {ready.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-saved/30 bg-saved/10 px-4 py-3.5">
          <p className="text-sm font-semibold text-saved">
            {ready.length === 1
              ? "1 rzecz czeka na werdykt"
              : `${ready.length} rzeczy czekają na werdykt`}
          </p>
          <p className="mt-0.5 text-xs text-muted">Czas minął — kupujesz albo odpuszczasz.</p>
        </div>
      ) : null}

      {perm === "default" ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-card">
          <p className="text-sm leading-snug text-muted">
            Włącz powiadomienia — damy znać, gdy czas minie.
          </p>
          <Button
            size="sm"
            onClick={() => void requestNotifications().then(() => setPerm(notificationPermission()))}
          >
            Włącz
          </Button>
        </div>
      ) : null}

      {waiting.length > 0 ? (
        <div className="mt-5 flex gap-1.5 rounded-xl bg-elevated/70 p-1">
          {(
            [
              { id: "all", label: "Wszystkie", n: waiting.length },
              { id: "ready", label: "Gotowe", n: ready.length },
              { id: "waiting", label: "Czekają", n: stillWaiting.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cnTab(filter === tab.id)}
            >
              {tab.label}
              <span className="ml-1 opacity-60">{tab.n}</span>
            </button>
          ))}
        </div>
      ) : null}

      {waiting.length === 0 ? (
        <div className="mt-8">
          <div className="flex flex-col items-center text-center">
            <div className="float-soft text-fg">
              <PauseBars />
            </div>
            <p className="mt-6 font-serif text-2xl font-medium">Pusto i spokojnie</p>
            <p className="mt-2 max-w-[17rem] text-sm leading-relaxed text-muted">
              Dodaj rzecz z listy poniżej albo wpisz własną. Odczekaj 48 godzin.
            </p>
          </div>

          <p className="mt-8 text-2xs font-semibold uppercase tracking-mark text-subtle">
            Szybki start — przykłady
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {SUGGESTIONS.slice(0, 6).map((s) => (
              <li key={s.title}>
                <Link
                  to="/nowe"
                  search={{ title: s.title, amount: String(s.amountZl), category: s.category }}
                  className="block rounded-2xl border border-line/70 bg-surface px-3 py-3 text-left shadow-card transition active:scale-[0.98]"
                >
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{s.amountZl} zł</p>
                </Link>
              </li>
            ))}
          </ul>

          <Link
            to="/nowe"
            className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-fg text-sm font-semibold text-accent-fg shadow-soft"
          >
            Dodaj własną rzecz
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((item, i) => (
            <li
              key={item.id}
              className="rise-in"
              style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
            >
              <ItemCard
                item={item}
                now={now}
                onBuy={() => decide(item.id, "bought")}
                onSkip={() => decide(item.id, "skipped")}
                onExtend={() => extend(item.id)}
              />
            </li>
          ))}
          {visible.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
              Brak rzeczy w tej zakładce.
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

function cnTab(active: boolean) {
  return [
    "flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-colors",
    active ? "bg-surface text-fg shadow-card" : "text-muted",
  ].join(" ");
}

function Stat({ label, value, saved }: { label: string; value: string; saved?: boolean }) {
  return (
    <div className="rounded-2xl border border-line/50 bg-surface/90 px-3 py-3.5 shadow-card">
      <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">{label}</p>
      <p className={`mt-1.5 font-serif text-lg font-medium ${saved ? "text-saved" : ""}`}>{value}</p>
    </div>
  );
}
