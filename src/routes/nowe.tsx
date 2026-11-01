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
  searchPrices,
  shopSearchLinks,
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

function sourceLabel(source: PriceResult["source"]): string {
  if (source === "steam") return "Steam";
  if (source === "cheapshark") return "inne sklepy PC";
  return "katalog";
}

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

  const shopLinks = useMemo(() => shopSearchLinks(title), [title]);

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
      const results = await searchPrices(q, category);
      setPriceResults(results);
      if (results.length === 0) {
        setSearchError(
          "Brak wyników. Sprawdź Steam / Allegro / Ceneo poniżej albo wpisz cenę ręcznie.",
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd sieci";
      setSearchError(`Nie udało się pobrać cen: ${msg}`);
    } finally {
      setSearching(false);
    }
  }

  function selectResult(r: PriceResult) {
    const track = makePriceTrack(r);
    setSelectedTrack(track);
    setTitle(r.title);
    setAmount((r.priceGrosze / 100).toFixed(r.priceGrosze % 100 === 0 ? 0 : 2));
    if ((r.source === "steam" || r.source === "cheapshark") && category === "inne") {
      setCategory("hobby");
    }
    if (r.source === "upcitemdb" && category === "inne") {
      setCategory("elektronika");
    }
    if (plus) setWaitHours(suggestedWaitHours(r.priceGrosze));
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

      <div>
        <p className="text-sm text-muted">Kategoria</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategory(c.id);
                setPriceResults(null);
                setSelectedTrack(null);
              }}
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
          placeholder="np. Wiedźmin 3, GTA 5, AirPods"
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
          {searching ? "Szukam…" : "Sprawdź cenę"}
        </Button>
      </div>

      {shopLinks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {shopLinks.map((l) => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-elevated px-3 py-1.5 text-xs font-medium text-fg ring-1 ring-line"
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      ) : null}

      {searchError ? (
        <p className="rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">
          {searchError}
        </p>
      ) : null}

      {priceResults && priceResults.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">Wyniki (najtańsze najpierw):</p>
          <ul className="space-y-2">
            {priceResults.map((r) => {
              const selected = selectedTrack?.gameId === r.gameId;
              return (
                <li key={`${r.source}-${r.gameId}`}>
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-medium line-clamp-2">
                          {r.brand ? `${r.brand} · ` : ""}
                          {r.title}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-2xs",
                            selected ? "opacity-70" : "text-subtle",
                          )}
                        >
                          {sourceLabel(r.source)}
                          {r.discountPercent
                            ? ` · −${r.discountPercent}%`
                            : ""}
                        </span>
                      </div>
                      <span className="shrink-0 text-right text-sm font-semibold">
                        {formatZl(r.priceGrosze)}
                        {r.currency === "USD" ? (
                          <span
                            className={cn(
                              "mt-0.5 block text-2xs font-normal",
                              selected ? "opacity-70" : "text-muted",
                            )}
                          >
                            {formatUsd(r.cheapestPriceUsd)}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {selectedTrack ? (
            <p className="text-xs text-saved">
              {selectedTrack.source === "steam" || selectedTrack.source === "cheapshark"
                ? "Śledzenie ceny włączone — przy otwarciu aplikacji sprawdzimy spadki/wzrosty."
                : "Cena orientacyjna — porównaj w sklepach i popraw kwotę jeśli trzeba."}
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
          placeholder="np. 149,99"
        />
      </label>

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
        Gry: <strong>Steam</strong> (ceny w zł, sklep PL) + CheapShark (inne sklepy PC).
        Elektronika / ubrania: katalog orientacyjny. Link do oferty Steam przy śledzeniu.
      </p>
    </form>
  );
}
