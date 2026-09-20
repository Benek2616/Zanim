import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  categoryLabel,
  formatHours,
  formatRemaining,
  formatZl,
  hoursOfWork,
  SKIP_REASONS,
  type Profile,
  type SkipReasonId,
  type WaitItem,
} from "@/lib/zanim";

export function ItemCard({
  item,
  now,
  profile,
  onBuy,
  onSkip,
  onExtend,
  onRemove,
}: {
  item: WaitItem;
  now: number;
  profile: Profile;
  onBuy: () => void;
  onSkip: (reason?: SkipReasonId) => void;
  onExtend: () => void;
  onRemove?: () => void;
}) {
  const [pickingReason, setPickingReason] = useState(false);
  const readyAt = new Date(item.readyAt).getTime();
  const ready = now >= readyAt;
  const remaining = readyAt - now;
  const total = Math.max(1, readyAt - new Date(item.createdAt).getTime());
  const progress = ready ? 100 : Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
  const work = hoursOfWork(
    item.amountGrosze,
    profile.monthlyIncomeGrosze,
    profile.monthlyHours,
  );

  return (
    <article className="card-hover overflow-hidden rounded-2xl border border-line/60 bg-surface shadow-card">
      <div className="h-1 bg-elevated">
        <div
          className={`h-full transition-[width] duration-500 ${ready ? "bg-saved" : "bg-fg/80"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">
              {categoryLabel(item.category)}
            </p>
            <h3 className="mt-1 truncate font-serif text-xl font-medium">{item.title}</h3>
            <p className="mt-1 text-sm font-medium text-muted">
              {formatZl(item.amountGrosze)}
              {work != null ? (
                <span className="text-subtle"> · ok. {formatHours(work)} pracy</span>
              ) : null}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              ready ? "bg-saved/15 text-saved" : "bg-elevated text-muted"
            }`}
          >
            {ready ? "Gotowe" : formatRemaining(remaining)}
          </span>
        </div>
        {item.note ? <p className="mt-3 text-sm leading-relaxed text-muted">{item.note}</p> : null}

        {ready && pickingReason ? (
          <div className="mt-4">
            <p className="text-sm font-medium">Dlaczego odpuszczasz?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SKIP_REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="rounded-full bg-elevated px-3 py-1.5 text-xs font-semibold text-fg"
                  onClick={() => {
                    setPickingReason(false);
                    onSkip(r.id);
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-2 text-xs text-muted"
              onClick={() => setPickingReason(false)}
            >
              Anuluj
            </button>
          </div>
        ) : null}

        {ready && !pickingReason ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button size="sm" className="rounded-xl" onClick={onBuy}>
              Kupuję
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl"
              onClick={() => setPickingReason(true)}
            >
              Odpuszczam
            </Button>
            <Button size="sm" variant="ghost" className="rounded-xl" onClick={onExtend}>
              Przedłuż
            </Button>
          </div>
        ) : null}

        {!ready && onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="mt-3 text-xs font-medium text-subtle underline-offset-2 hover:text-muted hover:underline"
          >
            Usuń z poczekalni
          </button>
        ) : null}
      </div>
    </article>
  );
}
