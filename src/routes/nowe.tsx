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
  type PriceTrack,
  formatZl,
} from "@/lib/zanim";
import {
  formatUsd,
  makePriceTrack,
  searchGamePrices,
  usdToGrosze,
  type PriceResult,
} from "@/lib/prices";
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

  const [searching, setSearching] = useState(false);
  const [priceResults, setPriceResults] = useState<PriceResult[] | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<PriceTrack | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

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

  async function handleSearchPrice() {
    const q = title.trim();
    if (q.length < 2) {
      setSearchError("Wpisz co najmniej 2 znaki.");
      return;
    }
    setSearching(true);
    setSearchError(null);
    setPriceResults(null);
    setSelectedTrack(null);
    try {
      const results = await searchGamePrices(q);
      setPriceResults(results);
      if (results.length === 0) {
        setSearchError("Brak wyników w CheapShark (gry PC). Spróbuj innej nazwy lub wpisz cenę ręcznie.");
      }
    } catch {
      setSearchError("Nie udało się pobrać cen. Sprawdź internet i spróbuj ponownie.");
    } finally {
      setSearching(false);
    }
  }

  function selectResult(r: PriceResult) {
    const track = makePriceTrack(r);
    setSelectedTrack(track);
    setTitle(r.title);
    const grosze = usdToGrosze(r.cheapestPriceUsd);
    setAmount((grosze / 100).toFixed(grosze % 100 === 0 ? 0 : 2));
    if (category === "inne") setCategory("hobby");
    if (plus) setWaitHours(suggestedWaitHours(grosze));
  }

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
      priceTrack: selectedTrack ?? undefined,
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
          onChange={(e) => {
            setTitle(e.target.value);
            setSelectedTrack(null);
            setPriceResults(null);
          }}
          placeholder="np. GTA 5, AirPods"
        />
      </label>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={searching || title.trim().length < 2}
          onClick={() => void handleSearchPrice()}
        >
          {searching ? "Szukam…" : "Sprawdź cenę (gry PC)"}
        </Button>
      </div>

      {searchError ? (
        <p className="rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">
          {searchError}
        </p>
      ) : null}

      {priceResults && priceResults.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">Wyniki z CheapShark (najniższa cena):</p>
          <ul className="space-y-2">
            {priceResults.map((r) => {
              const selected = selectedTrack?.gameId === r.gameId;
              return (
                <li key={r.gameId}>
                  <button
                    type="button"
                    onClick={() => selectResult(r)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-left transition",
                      selected
                        ? "border-fg bg-fg text-accent-fg"
                        : "border-line bg-surface hover:bg-elevated",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium line-clamp-1">{r.title}</span>
                      <span className="shrink-0 text-sm font-semibold">
                        {formatUsd(r.cheapestPriceUsd)}
                        <span className={cn("ml-1 text-xs", selected ? "opacity-70" : "text-muted")}>
                          (~{formatZl(usdToGrosze(r.cheapestPriceUsd))})
                        </span>
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {selectedTrack ? (
            <p className="text-xs text-saved">
              Śledzenie ceny włączone — dostaniesz alert przy spadku/wzroście.
            </p>
          ) : null}
        </div>
      ) : null}

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

      <p className="text-2xs leading-relaxed text-subtle">
        Ceny gier pochodzą z CheapShark (Steam i inne sklepy PC). Kurs ~3,85 zł/$. Przy
        wyborze wyniku włączane jest śledzenie — przy następnym otwarciu aplikacji sprawdzimy
        zmianę i wyślemy powiadomienie.
      </p>
    </form>
  );
}
