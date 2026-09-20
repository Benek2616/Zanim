import { Button } from "@/components/ui/button";
import { categoryLabel, formatRemaining, formatZl } from "@/lib/zanim";
import type { WaitItem } from "@/lib/zanim";

export function ItemCard({
  item,
  now,
  onBuy,
  onSkip,
  onExtend,
}: {
  item: WaitItem;
  now: number;
  onBuy: () => void;
  onSkip: () => void;
  onExtend: () => void;
}) {
  const readyAt = new Date(item.readyAt).getTime();
  const ready = now >= readyAt;
  const remaining = readyAt - now;

  return (
    <article className="rounded-xl bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xs font-medium uppercase tracking-mark text-subtle">
            {categoryLabel(item.category)}
          </p>
          <h3 className="mt-1 font-serif text-xl font-medium">{item.title}</h3>
          <p className="mt-1 text-sm text-muted">{formatZl(item.amountGrosze)}</p>
        </div>
        <p className={`text-sm font-medium ${ready ? "text-saved" : "text-muted"}`}>
          {ready ? "Czas minął" : formatRemaining(remaining)}
        </p>
      </div>
      {item.note ? <p className="mt-3 text-sm text-muted">{item.note}</p> : null}
      {ready ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={onBuy}>
            Kupuję
          </Button>
          <Button size="sm" variant="secondary" onClick={onSkip}>
            Odpuszczam
          </Button>
          <Button size="sm" variant="ghost" onClick={onExtend}>
            Przedłuż
          </Button>
        </div>
      ) : null}
    </article>
  );
}
