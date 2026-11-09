import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useZanim } from "@/lib/store";
import {
  CATEGORIES,
  categoryLabel,
  formatHours,
  formatZl,
  hoursOfWork,
  SKIP_REASONS,
  skipStreakDays,
} from "@/lib/zanim";

export const Route = createFileRoute("/raport")({ component: RaportPage });

function RaportPage() {
  const items = useZanim((s) => s.items);
  const profile = useZanim((s) => s.profile);
  const [copied, setCopied] = useState(false);

  const skipped = useMemo(() => items.filter((i) => i.status === "skipped"), [items]);
  const bought = useMemo(() => items.filter((i) => i.status === "bought"), [items]);
  const skippedSum = skipped.reduce((s, i) => s + i.amountGrosze, 0);
  const boughtSum = bought.reduce((s, i) => s + i.amountGrosze, 0);
  const hours = hoursOfWork(skippedSum, profile.monthlyIncomeGrosze, profile.monthlyHours);
  const streak = skipStreakDays(items);
  const goal = profile.savingsGoalGrosze;
  const goalPct =
    goal && goal > 0 ? Math.min(100, Math.round((skippedSum / goal) * 100)) : null;
  const remaining = goal ? Math.max(0, goal - skippedSum) : null;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of skipped) {
      map.set(i.category, (map.get(i.category) ?? 0) + i.amountGrosze);
    }
    return CATEGORIES.map((c) => ({ id: c.id, label: c.label, sum: map.get(c.id) ?? 0 }))
      .filter((c) => c.sum > 0)
      .sort((a, b) => b.sum - a.sum);
  }, [skipped]);

  const byReason = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of skipped) {
      if (i.skipReason) map.set(i.skipReason, (map.get(i.skipReason) ?? 0) + 1);
    }
    return SKIP_REASONS.map((r) => ({ id: r.id, label: r.label, count: map.get(r.id) ?? 0 }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [skipped]);

  const topReason = byReason[0];
  const shareText = `Dzięki Zanim odpuściłem zakupy na ${formatZl(skippedSum)}${
    hours != null ? ` (ok. ${formatHours(hours)} pracy)` : ""
  }.${topReason ? ` Najczęściej: ${topReason.label.toLowerCase()}.` : ""} Passa: ${streak} d.`;

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Zanim", text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="rise-in space-y-6 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Raport</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Ile nie wydałaś / nie wydałeś</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line/50 bg-surface p-4 shadow-card">
          <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Oszczędzone</p>
          <p className="mt-1 font-serif text-2xl text-saved">{formatZl(skippedSum)}</p>
        </div>
        <div className="rounded-2xl border border-line/50 bg-surface p-4 shadow-card">
          <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Kupione</p>
          <p className="mt-1 font-serif text-2xl">{formatZl(boughtSum)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line/50 bg-surface p-4 shadow-card">
          <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Passa</p>
          <p className="mt-1 font-serif text-2xl">{streak} d.</p>
        </div>
        <div className="rounded-2xl border border-line/50 bg-surface p-4 shadow-card">
          <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Werdykty</p>
          <p className="mt-1 font-serif text-2xl">{skipped.length + bought.length}</p>
        </div>
      </div>

      {hours != null ? (
        <p className="text-sm text-muted">
          Oszczędzone to ok. <strong className="text-fg">{formatHours(hours)}</strong> twojej pracy.
        </p>
      ) : (
        <p className="text-sm text-muted">
          Uzupełnij dochód w Więcej → Profil, żeby zobaczyć przelicznik na godziny pracy.
        </p>
      )}

      {goalPct != null && goal ? (
        <div className="rounded-2xl border border-line/60 bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Cel oszczędności</span>
            <span className="text-muted">
              {formatZl(skippedSum)} / {formatZl(goal)}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-elevated">
            <div className="h-full rounded-full bg-saved" style={{ width: `${goalPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">
            {goalPct >= 100
              ? "Cel osiągnięty — pięknie."
              : `Zostało ${formatZl(remaining!)}`}
          </p>
        </div>
      ) : null}

      {byReason.length > 0 ? (
        <section>
          <h2 className="font-serif text-lg font-medium">Dlaczego odpuszczasz</h2>
          <ul className="mt-3 space-y-2">
            {byReason.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-surface px-3 py-3 text-sm shadow-card"
              >
                <span>{r.label}</span>
                <span className="font-medium text-muted">{r.count}×</span>
              </li>
            ))}
          </ul>
          {topReason ? (
            <p className="mt-2 text-xs text-muted">
              Najczęściej: <strong className="text-fg">{topReason.label}</strong>
            </p>
          ) : null}
        </section>
      ) : null}

      {byCategory.length > 0 ? (
        <section>
          <h2 className="font-serif text-lg font-medium">Odpuszczone wg kategorii</h2>
          <ul className="mt-3 space-y-2">
            {byCategory.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl bg-surface px-3 py-3 text-sm shadow-card"
              >
                <span>{c.label}</span>
                <span className="font-medium text-saved">{formatZl(c.sum)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Button variant="secondary" className="w-full" onClick={() => void share()}>
        {copied ? "Skopiowano do schowka" : "Udostępnij wynik"}
      </Button>

      <section>
        <h2 className="font-serif text-lg font-medium">Ostatnie decyzje</h2>
        <ul className="mt-3 space-y-2">
          {[...skipped, ...bought]
            .sort((a, b) => (b.verdictAt ?? "").localeCompare(a.verdictAt ?? ""))
            .slice(0, 12)
            .map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-surface px-3 py-3 text-sm shadow-card"
              >
                <span>
                  {item.title}{" "}
                  <span className="text-muted">
                    · {categoryLabel(item.category)} ·{" "}
                    {item.status === "skipped" ? "odpuszczone" : "kupione"}
                  </span>
                </span>
                <span className={item.status === "skipped" ? "text-saved" : ""}>
                  {formatZl(item.amountGrosze)}
                </span>
              </li>
            ))}
          {skipped.length + bought.length === 0 ? (
            <li className="text-sm text-muted">Jeszcze brak werdyktów.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
