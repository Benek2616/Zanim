import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useZanim } from "@/lib/store";
import { formatHours, formatZl, hoursOfWork } from "@/lib/zanim";

export const Route = createFileRoute("/raport")({ component: RaportPage });

function RaportPage() {
  const items = useZanim((s) => s.items);
  const profile = useZanim((s) => s.profile);

  const skipped = useMemo(() => items.filter((i) => i.status === "skipped"), [items]);
  const bought = useMemo(() => items.filter((i) => i.status === "bought"), [items]);
  const skippedSum = skipped.reduce((s, i) => s + i.amountGrosze, 0);
  const boughtSum = bought.reduce((s, i) => s + i.amountGrosze, 0);
  const hours = hoursOfWork(skippedSum, profile.monthlyIncomeGrosze, profile.monthlyHours);

  return (
    <div className="rise-in space-y-6 pb-6">
      <div>
        <p className="text-2xs font-medium uppercase tracking-mark text-subtle">Raport</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Ile nie wydałaś / nie wydałeś</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <p className="text-2xs uppercase tracking-mark text-subtle">Oszczędzone</p>
          <p className="mt-1 font-serif text-2xl text-saved">{formatZl(skippedSum)}</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-card">
          <p className="text-2xs uppercase tracking-mark text-subtle">Kupione</p>
          <p className="mt-1 font-serif text-2xl">{formatZl(boughtSum)}</p>
        </div>
      </div>

      {hours != null ? (
        <p className="text-sm text-muted">
          To ok. <strong className="text-fg">{formatHours(hours)}</strong> twojej pracy.
        </p>
      ) : (
        <p className="text-sm text-muted">
          Uzupełnij dochód w Koncie, żeby zobaczyć przelicznik na godziny pracy.
        </p>
      )}

      <section>
        <h2 className="font-serif text-lg font-medium">Ostatnie decyzje</h2>
        <ul className="mt-3 space-y-2">
          {[...skipped, ...bought].slice(0, 12).map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-surface px-3 py-3 text-sm shadow-card"
            >
              <span>
                {item.title}{" "}
                <span className="text-muted">
                  · {item.status === "skipped" ? "odpuszczone" : "kupione"}
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
