import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { isPlusActive, useZanim } from "@/lib/store";
import {
  CATEGORIES,
  FREE_WAIT_HOURS,
  parseAmountToGrosze,
  WAIT_OPTIONS,
  type CategoryId,
} from "@/lib/zanim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/nowe")({ component: NowePage });

function NowePage() {
  const navigate = useNavigate();
  const addItem = useZanim((s) => s.addItem);
  const entitlements = useZanim((s) => s.entitlements);
  const plus = isPlusActive(entitlements);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>("inne");
  const [note, setNote] = useState("");
  const [waitHours, setWaitHours] = useState(FREE_WAIT_HOURS);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const amountGrosze = parseAmountToGrosze(amount);
    if (!title.trim()) {
      setError("Podaj nazwę.");
      return;
    }
    if (amountGrosze == null) {
      setError("Podaj poprawną kwotę.");
      return;
    }
    const result = addItem({
      title,
      amountGrosze,
      category,
      note,
      waitHours: plus ? waitHours : FREE_WAIT_HOURS,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    void navigate({ to: "/" });
  }

  return (
    <form onSubmit={onSubmit} className="rise-in space-y-5 pb-8">
      <div>
        <p className="text-2xs font-medium uppercase tracking-mark text-subtle">Nowe</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Do poczekalni</h1>
      </div>

      <label className="block">
        <span className="text-sm text-muted">Co chcesz kupić?</span>
        <input
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-3 text-base outline-none focus:ring-2 focus:ring-fg/20"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="np. AirPods"
        />
      </label>

      <label className="block">
        <span className="text-sm text-muted">Kwota (zł)</span>
        <input
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-3 text-base outline-none focus:ring-2 focus:ring-fg/20"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="np. 899"
        />
      </label>

      <div>
        <p className="text-sm text-muted">Kategoria</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm",
                category === c.id ? "bg-fg text-accent-fg" : "bg-elevated text-fg",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {plus ? (
        <div>
          <p className="text-sm text-muted">Czas oddechu</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WAIT_OPTIONS.map((o) => (
              <button
                key={o.hours}
                type="button"
                onClick={() => setWaitHours(o.hours)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm",
                  waitHours === o.hours ? "bg-fg text-accent-fg" : "bg-elevated text-fg",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Czas oddechu: 48 godzin (w Plusie możesz zmienić).</p>
      )}

      <label className="block">
        <span className="text-sm text-muted">Notatka (opcjonalnie)</span>
        <textarea
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-3 text-base outline-none focus:ring-2 focus:ring-fg/20"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Dlaczego to chcesz?"
        />
      </label>

      {error ? <p className="text-sm text-warn">{error}</p> : null}

      <Button type="submit" className="w-full" size="lg">
        Wrzuć do poczekalni
      </Button>
    </form>
  );
}
