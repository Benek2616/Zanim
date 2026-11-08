import { useState } from "react";
import { Button } from "@/components/ui/button";
import { analyzeItem } from "@/lib/ai-analysis";
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
import { formatUsd } from "@/lib/prices";

export function ItemCard({
  item,
  now,
  profile,
  onBuy,
  onSkip,
  onExtend,
  onRemove,
  showAnalysis,
}: {
  item: WaitItem;
  now: number;
  profile: Profile;
  onBuy: () => void;
  onSkip: (reason?: SkipReasonId) => void;
  onExtend: () => void;
  onRemove?: () => void;
  showAnalysis?: boolean;
}) {
  const [pickingReason, setPickingReason] = useState(false);
  const [openAnalysis, setOpenAnalysis] = useState(false);
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
  const analysis = showAnalysis ? analyzeItem(item) : null;

  const track = item.priceTrack;
  let priceDelta: { pct: number; label: string } | null = null;
  if (track && track.history.length >= 2) {
    const first = track.history[0].priceUsd;
    const last = track.lastPriceUsd;
    if (first > 0) {
      const pct = ((last - first) / first) * 100;
      if (Math.abs(pct) >= 1) {
        priceDelta = {
          pct,
          label:
            pct < 0
              ? `↓ ${Math.abs(pct).toFixed(0)}% od dodania`
              : `↑ ${pct.toFixed(0)}% od dodania`,
        };
      }
    }
  }

  const dealLabel =
    track?.source === "steam"
      ? "Zobacz na Steam →"
      : track?.source === "cheapshark"
        ? "Zobacz deal →"
        : track?.dealUrl
          ? "Zobacz ofertę →"
          : null;

  return (
    <article className="card-hover overflow-hidden rounded-2xl border border-line/60 bg-surface shadow-card">
      <div className="h-1 bg-elevated">
        <div
          className={`h-full transition-[width] duration-500 ${ready ? "bg-saved" : "bg-fg/80"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {track?.thumb ? (
        <div className="relative aspect-[460/215] w-full bg-elevated">
          <img
            src={track.thumb}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display = "none";
            }}
          />
        </div>
      ) : null}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">
              {categoryLabel(item.category)}
              {track ? " · śledzona cena" : ""}
            </p>
            <h3 className="mt-1 truncate font-serif text-xl font-medium">{item.title}</h3>
            <p className="mt-1 text-sm font-medium text-muted">
              {formatZl(item.amountGrosze)}
              {work != null ? (
                <span className="text-subtle"> · ok. {formatHours(work)} pracy</span>
              ) : null}
            </p>
            {track ? (
              <p className="mt-1 text-xs text-muted">
                Aktualnie: {formatZl(track.lastPriceGrosze)}
                {track.source !== "steam" ? (
                  <span> ({formatUsd(track.lastPriceUsd)})</span>
                ) : null}
                {priceDelta ? (
                  <span className={priceDelta.pct < 0 ? " text-saved" : " text-warn"}>
                    {" "}· {priceDelta.label}
                  </span>
                ) : null}
              </p>
            ) : null}
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

        {showAnalysis && analysis ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setOpenAnalysis((o) => !o)}
              className="text-xs font-medium text-fg underline-offset-2 hover:underline"
            >
              {openAnalysis ? "Ukryj analizę" : "Pokaż analizę"}
            </button>
            {openAnalysis ? (
              <div className="mt-2 space-y-2 rounded-lg bg-elevated p-3 text-sm">
                <p className="font-medium">
                  {analysis.verdict === "warto"
                    ? "Warto rozważyć"
                    : analysis.verdict === "poczekaj"
                      ? "Lepiej poczekać"
                      : "Zastanów się spokojnie"}
                </p>
                <p className="text-muted">{analysis.summary}</p>
                {analysis.questions.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-subtle">Pytania do siebie</p>
                    <ul className="mt-1 list-disc pl-4 text-muted">
                      {analysis.questions.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {analysis.alternatives.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-subtle">Alternatywy</p>
                    <ul className="mt-1 list-disc pl-4 text-muted">
                      {analysis.alternatives.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {track?.dealUrl && dealLabel ? (
          <a
            href={track.dealUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs font-medium text-fg underline-offset-2 hover:underline"
          >
            {dealLabel}
          </a>
        ) : null}

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
