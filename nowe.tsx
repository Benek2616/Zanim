import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { isPlusActive, useZanim } from "@/lib/store";
import {
  CATEGORIES,
  parseAmountToGrosze,
  SUGGESTIONS,
  WAIT_OPTIONS,
  type CategoryId,
} from "@/lib/zanim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/nowe")({ component: Nowe });

function Nowe() {
  const navigate = useNavigate();
  const addItem = useZanim((s) => s.addItem);
  const entitlements = useZanim((s) => s.entitlements);
  const plus = isPlusActive(entitlements);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>("inne");
  const [note, setNote] = useState("");
  const [waitHours, setWaitHours] = useState(48);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<"limit" | "plus" | null>(null);
  const [busy, setBusy] = useState(false);

  function applySuggestion(s: (typeof SUGGESTIONS)[number]) {
    setTitle(s.title);
    setAmount(String(s.amountZl));
    setCategory(s.category);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const grosze = parseAmountToGrosze(amount);
    if (title.trim().length < 2) {
      setError("Wpisz, co kusi — choćby dwa znaki.");
      return;
    }
    if (grosze == null) {
      setError("Podaj kwotę w złotych, np. 249 albo 249,90.");
      return;
    }
    setBusy(true);
    const result = addItem({
      title,
      amountGrosze: grosze,
      category,
      note,
      waitHours,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setCode(result.code);
      return;
    }
    void navigate({ to: "/" });
  }

  return (
    <div className="rise-in mx-auto max-w-lg pb-10">
      <p className="text-2xs font-medium tracking-mark text-subtle uppercase">Nowa rzecz</p>
      <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight">Do poczekalni</h1>
      <p className="mt-2 text-sm text-muted">
        Nazwa, kwota, kategoria. Zostaje w poczekalni, nie w koszyku.
      </p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {SUGGESTIONS.slice(0, 6).map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => applySuggestion(s)}
            className="shrink-0 rounded-full bg-surface px-3 py-2 text-xs ring-1 ring-line"
          >
            {s.title} · {s.amountZl} zł
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-8 grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">Co kusi</span>
          <input
            className="h-11 rounded-md bg-surface px-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-fg/30"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="np. słuchawki, kurtka, bilet"
            required
            maxLength={80}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">Kwota (zł)</span>
          <input
            className="h-11 rounded-md bg-surface px-3 font-mono text-sm tabular-nums ring-1 ring-line outline-none focus:ring-2 focus:ring-fg/30"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="249,00"
            required
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">Kategoria</span>
          <select
            className="h-11 rounded-md bg-surface px-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-fg/30"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="grid gap-2">
          <legend className="text-xs font-medium text-muted">Czas oddechu</legend>
          <div className="flex flex-wrap gap-2">
            {WAIT_OPTIONS.map((opt) => {
              const locked = opt.plus && !plus;
              return (
                <button
                  key={opt.hours}
                  type="button"
                  disabled={locked}
                  onClick={() => setWaitHours(opt.hours)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm ring-1 transition-colors duration-150",
                    waitHours === opt.hours
                      ? "bg-fg text-accent-fg ring-fg"
                      : "bg-surface text-fg ring-line",
                    locked && "opacity-40",
                  )}
                >
                  {opt.label}
                  {locked ? " · Plus" : ""}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">Notatka (opcjonalnie)</span>
          <textarea
            className="min-h-20 rounded-md bg-surface px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-fg/30"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={280}
          />
        </label>
        {error ? (
          <p className="text-sm text-warn">
            {error}{" "}
            {(code === "limit" || code === "plus") && (
              <Link to="/cennik" className="font-medium underline">
                Zobacz Plus
              </Link>
            )}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Zapisuję…" : "Wrzuć i czekaj"}
        </Button>
      </form>
    </div>
  );
}
