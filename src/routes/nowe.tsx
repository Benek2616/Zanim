import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { isPlusActive, useZanim } from "@/lib/store";
import {
  CATEGORIES,
  FREE_WAIT_HOURS,
  parseAmountToGrosze,
  PSYCHO_TIPS,
  suggestedWaitHours,
  WAIT_OPTIONS,
  type CategoryId,
} from "@/lib/zanim";
import { cn } from "@/lib/utils";

type NoweSearch = {
  title?: string;
  amount?: string;
  category?: string;
};

export const Route = createFileRoute("/nowe")({
  validateSearch: (s: Record<string, unknown>): NoweSearch => ({
    title: typeof s.title === "string" ? s.title : undefined,
    amount: typeof s.amount === "string" ? s.amount : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
  }),
  component: NowePage,
});

function NowePage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const addItem = useZanim((s) => s.addItem);
  const items = useZanim((s) => s.items);
  const entitlements = useZanim((s) => s.entitlements);
  const plus = isPlusActive(entitlements);

  const initialCat = CATEGORIES.some((c) => c.id === search.category)
    ? (search.category as CategoryId)
    : "inne";

  const [title, setTitle] = useState(search.title ?? "");
  const [amount, setAmount] = useState(search.amount ?? "");
  const [category, setCategory] = useState<CategoryId>(initialCat);
  const [note, setNote] = useState("");
  const [waitHours, setWaitHours] = useState(FREE_WAIT_HOURS);
  const [error, setError] = useState<string | null>(null);
  const tip = useMemo(() => PSYCHO_TIPS[Math.floor(Math.random() * PSYCHO_TIPS.length)], []);

  const amountGroszePreview = parseAmountToGrosze(amount);
  const smartHours =
    amountGroszePreview != null ? suggestedWaitHours(amountGroszePreview) : FREE_WAIT_HOURS;

  const duplicate = useMemo(() => {
    const t = title.trim().toLowerCase();
    if (t.length < 2) return null;
    return items.find(
      (i) => i.status === "waiting" && i.title.trim().toLowerCase() === t,
    );
  }, [title, items]);

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
    const hours = plus ? waitHours : FREE_WAIT_HOURS;
    const result = addItem({
      title,
      amountGrosze,
      category,
      note,
      waitHours: hours,
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
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Nowe</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Do poczekalni</h1>
      </div>

      <div className="rounded-2xl border border-line/60 bg-elevated/40 px-4 py-3 text-sm text-muted">
        <span className="font-medium text-fg">Zatrzymaj się na chwilę. </span>
        {tip}
      </div>

      <label className="block">
        <span className="text-sm text-muted">Co chcesz kupić?</span>
        <input
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-3 text-base outline-none focus:ring-2 focus:ring-fg/20"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="np. AirPods"
        />
      </label>

      {duplicate ? (
        <p className="rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">
          Podobna rzecz już czeka w poczekalni („{duplicate.title}”).
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm text-muted">Kwota (zł)</span>
        <input
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-3 text-base outline-none focus:ring-2 focus:ring-fg/20"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            const g = parseAmountToGrosze(e.target.value);
            if (plus && g != null) setWaitHours(suggestedWaitHours(g));
          }}
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
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
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
          <p className="text-sm text-muted">
            Czas oddechu{" "}
            {amountGroszePreview != null && smartHours !== waitHours ? (
              <button
                type="button"
                className="text-fg underline"
                onClick={() => setWaitHours(smartHours)}
              >
                (sugerowane: {smartHours} h)
              </button>
            ) : null}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WAIT_OPTIONS.map((o) => (
              <button
                key={o.hours}
                type="button"
                onClick={() => setWaitHours(o.hours)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium",
                  waitHours === o.hours ? "bg-fg text-accent-fg" : "bg-elevated text-fg",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-xl bg-elevated/60 px-3 py-2.5 text-sm text-muted">
          Czas oddechu: <strong className="text-fg">48 godzin</strong> (w Plusie możesz zmienić).
        </p>
      )}

      <label className="block">
        <span className="text-sm text-muted">Notatka (opcjonalnie)</span>
        <textarea
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-3 text-base outline-none focus:ring-2 focus:ring-fg/20"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Dlaczego to chcesz? Kupujesz rzecz czy nastrój?"
        />
      </label>

      {error ? <p className="text-sm text-warn">{error}</p> : null}

      <Button type="submit" className="w-full" size="lg">
        Wrzuć do poczekalni
      </Button>
    </form>
  );
}
