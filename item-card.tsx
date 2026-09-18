import { Button } from "@/components/ui/button";
import { categoryLabel, formatHours, formatRemaining, formatZl } from "@/lib/zanim";
import { cn } from "@/lib/utils";
import type { WaitItem } from "@/lib/zanim";

export function ItemCard({
  item,
  now,
  hours,
  onDecide,
  onExtend,
  onDelete,
}: {
  item: WaitItem;
  now: number;
  hours: number | null;
  onDecide: (id: string, status: "bought" | "skipped") => void;
  onExtend: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const readyAt = new Date(item.readyAt).getTime();
  const ready = Number.isFinite(readyAt) && now >= readyAt;
  const remaining = Number.isFinite(readyAt) ? Math.max(0, readyAt - now) : 0;

  return (
    <li className="rounded-xl bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">{categoryLabel(item.category)}</p>
          <h2 className="mt-1 font-serif text-xl font-medium leading-snug">{item.title}</h2>
        </div>
        <p className="shrink-0 font-mono text-lg tabular-nums">{formatZl(item.amountGrosze)}</p>
      </div>
      {item.note ? <p className="mt-2 text-sm text-muted">{item.note}</p> : null}
      <p className={cn("mt-3 text-sm", ready ? "text-warn" : "text-muted")}>
        {ready ? "Czas minął — zdecyduj." : `Jeszcze ${formatRemaining(remaining)}`}
        {hours != null ? ` · to ${formatHours(hours)} twojej pracy` : ""}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onDecide(item.id, "bought")}>
          Kupuję
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onDecide(item.id, "skipped")}>
          Odpuszczam
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onExtend(item.id)}>
          Jeszcze raz tyle
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)}>
          Usuń
        </Button>
      </div>
    </li>
  );
}
