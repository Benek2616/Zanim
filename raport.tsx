import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button, buttonVariants } from "@/components/ui/button";
import { isPlusActive, useZanim } from "@/lib/store";
import { formatZl } from "@/lib/zanim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/raport")({ component: Raport });

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y ?? 2026, (m ?? 1) - 1, 1).toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y ?? 2026, (m ?? 1) - 1 + delta, 1));
}

function Raport() {
  const items = useZanim((s) => s.items);
  const entitlements = useZanim((s) => s.entitlements);
  const plus = isPlusActive(entitlements);
  const [month, setMonth] = useState(() => monthKey(new Date()));

  const stats = useMemo(() => {
    const decided = items.filter((i) => i.status !== "waiting");
    const skipped = decided.filter((i) => i.status === "skipped");
    const bought = decided.filter((i) => i.status === "bought");
    const byMonth = new Map<string, { name: string; odpuszczone: number; kupione: number }>();
    for (const item of decided) {
      const d = new Date(item.verdictAt ?? item.createdAt);
      const key = monthKey(d);
      const row = byMonth.get(key) ?? {
        name: d.toLocaleDateString("pl-PL", { month: "short" }),
        odpuszczone: 0,
        kupione: 0,
      };
      if (item.status === "skipped") row.odpuszczone += item.amountGrosze / 100;
      else row.kupione += item.amountGrosze / 100;
      byMonth.set(key, row);
    }
    const chart = [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, row]) => row)
      .slice(-6);
    const inMonth = decided
      .filter((i) => monthKey(new Date(i.verdictAt ?? i.createdAt)) === month)
      .sort((a, b) => {
        const ta = new Date(a.verdictAt ?? a.createdAt).getTime();
        return new Date(b.verdictAt ?? b.createdAt).getTime() - ta;
      });
    const monthSkipped = inMonth.filter((i) => i.status === "skipped");
    const monthBought = inMonth.filter((i) => i.status === "bought");
    return {
      skipped: skipped.length,
      bought: bought.length,
      skippedSum: skipped.reduce((s, i) => s + i.amountGrosze, 0),
      boughtSum: bought.reduce((s, i) => s + i.amountGrosze, 0),
      chart,
      inMonth,
      monthSkipped,
      monthBought,
      monthSkippedSum: monthSkipped.reduce((s, i) => s + i.amountGrosze, 0),
      monthBoughtSum: monthBought.reduce((s, i) => s + i.amountGrosze, 0),
    };
  }, [items, month]);

  if (!plus) {
    return (
      <div className="rise-in mx-auto max-w-lg rounded-xl bg-surface px-5 py-12 text-center ring-1 ring-line">
        <h1 className="font-serif text-2xl font-medium">Raport jest w Plusie</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Bilans miesiąca: co kupiłaś / kupiłeś, co odpuściłaś / odpuściłeś, i ile zostało w
          kieszeni.
        </p>
        <Link to="/cennik" className={cn(buttonVariants(), "mt-6 inline-flex")}>
          Plus za 9 zł
        </Link>
      </div>
    );
  }

  return (
    <div className="rise-in pb-8">
      <p className="text-2xs font-medium tracking-mark text-subtle uppercase">Raport</p>
      <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight">Bilans decyzji</h1>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-medium capitalize">{monthLabel(month)}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
            Poprzedni
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMonth(monthKey(new Date()))}>
            Dziś
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
            Następny
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-lg bg-surface px-4 py-4 ring-1 ring-line">
          <p className="text-xs text-muted">Odpuszczone</p>
          <p className="mt-1 font-serif text-3xl font-medium text-saved tabular-nums">
            {formatZl(stats.monthSkippedSum)}
          </p>
          <p className="mt-1 text-xs text-subtle">{stats.monthSkipped.length} rzeczy</p>
        </div>
        <div className="rounded-lg bg-surface px-4 py-4 ring-1 ring-line">
          <p className="text-xs text-muted">Kupione</p>
          <p className="mt-1 font-serif text-3xl font-medium tabular-nums">
            {formatZl(stats.monthBoughtSum)}
          </p>
          <p className="mt-1 text-xs text-subtle">{stats.monthBought.length} rzeczy</p>
        </div>
        <div className="rounded-lg bg-fg px-4 py-4 text-accent-fg">
          <p className="text-xs text-accent-fg/70">Zostaje w kieszeni</p>
          <p className="mt-1 font-serif text-3xl font-medium tabular-nums">
            {formatZl(stats.monthSkippedSum)}
          </p>
          <p className="mt-1 text-xs text-accent-fg/60">to, czego nie kupiłaś / nie kupiłeś</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-serif text-lg font-medium">Co zdecydowałaś / zdecydowałeś</h2>
        {stats.inMonth.length === 0 ? (
          <p className="mt-4 rounded-lg bg-surface px-4 py-8 text-center text-sm text-muted ring-1 ring-line">
            W tym miesiącu nie ma jeszcze werdyktów. Odczekaj i zdecyduj — tu pojawi się lista.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {stats.inMonth.map((item) => {
              const skipped = item.status === "skipped";
              const date = new Date(item.verdictAt ?? item.createdAt).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "short",
              });
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 ring-1 ring-line"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-xs text-muted">{date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm tabular-nums">{formatZl(item.amountGrosze)}</p>
                    <p className={skipped ? "text-xs text-saved" : "text-xs text-muted"}>
                      {skipped ? "odpuszczone" : "kupione"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-10 grid gap-3">
        <div className="rounded-lg bg-surface px-4 py-4 ring-1 ring-line">
          <p className="text-xs text-muted">Odpuszczone łącznie</p>
          <p className="mt-1 font-serif text-2xl font-medium text-saved tabular-nums">
            {formatZl(stats.skippedSum)}
          </p>
          <p className="mt-1 text-xs text-subtle">{stats.skipped} rzeczy</p>
        </div>
        <div className="rounded-lg bg-surface px-4 py-4 ring-1 ring-line">
          <p className="text-xs text-muted">Kupione łącznie</p>
          <p className="mt-1 font-serif text-2xl font-medium tabular-nums">
            {formatZl(stats.boughtSum)}
          </p>
          <p className="mt-1 text-xs text-subtle">{stats.bought} rzeczy</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-surface p-4 ring-1 ring-line">
        <h2 className="font-serif text-lg font-medium">Ostatnie miesiące</h2>
        {stats.chart.length === 0 ? (
          <p className="mt-6 py-8 text-center text-sm text-muted">
            Za mało werdyktów, żeby narysować wykres.
          </p>
        ) : (
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chart} barGap={4}>
                <CartesianGrid stroke="var(--color-line)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-elevated)" }}
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-line)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [
                    `${Number(value ?? 0).toLocaleString("pl-PL")} zł`,
                    "",
                  ]}
                />
                <Bar dataKey="odpuszczone" name="Odpuszczone" fill="var(--color-saved)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kupione" name="Kupione" fill="var(--color-fg)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
