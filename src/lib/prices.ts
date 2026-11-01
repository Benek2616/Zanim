/**
 * Price lookup & tracking (client).
 * External APIs are called via /api/prices/* to avoid browser CORS.
 */

export type PriceSource = "steam" | "cheapshark" | "upcitemdb";

export type PriceResult = {
  gameId: string;
  title: string;
  priceGrosze: number;
  cheapestPriceUsd: number;
  currency: "PLN" | "USD";
  cheapestDealId?: string;
  steamAppId?: string;
  thumb?: string;
  dealUrl?: string;
  source: PriceSource;
  brand?: string;
  discountPercent?: number;
};

export type PriceTrack = {
  source: PriceSource;
  gameId: string;
  title: string;
  lastPriceUsd: number;
  lastPriceGrosze: number;
  lastChecked: string;
  history: { at: string; priceUsd: number; priceGrosze?: number }[];
  dealUrl?: string;
  thumb?: string;
  steamAppId?: string;
};

const USD_TO_PLN = 3.85;

export function usdToGrosze(usd: number): number {
  return Math.round(usd * USD_TO_PLN * 100);
}

export function formatUsd(usd: number): string {
  return (
    usd.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " $"
  );
}

export function looksLikeGame(query: string, category?: string): boolean {
  if (category === "hobby") return true;
  return /\b(gta|game|gra|steam|rpg|witcher|wiedźmin|cyberpunk|elden|minecraft)\b/i.test(
    query,
  );
}

/** Unified search — goes through our server proxy. */
export async function searchPrices(
  query: string,
  category?: string,
): Promise<PriceResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({ q });
  if (category) params.set("category", category);

  const res = await fetch(`/api/prices/search?${params.toString()}`);
  const data = (await res.json()) as { results?: PriceResult[]; error?: string };

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  if (data.error && (!data.results || data.results.length === 0)) {
    throw new Error(data.error);
  }
  return data.results ?? [];
}

/** @deprecated kept for imports that still reference it */
export async function searchGamePrices(query: string): Promise<PriceResult[]> {
  return searchPrices(query, "hobby");
}

export function makePriceTrack(result: PriceResult): PriceTrack {
  const now = new Date().toISOString();
  return {
    source: result.source,
    gameId: result.gameId,
    title: result.title,
    lastPriceUsd: result.cheapestPriceUsd,
    lastPriceGrosze: result.priceGrosze,
    lastChecked: now,
    history: [
      { at: now, priceUsd: result.cheapestPriceUsd, priceGrosze: result.priceGrosze },
    ],
    dealUrl: result.dealUrl,
    thumb: result.thumb,
    steamAppId: result.steamAppId,
  };
}

export async function refreshPriceTrack(
  track: PriceTrack,
): Promise<{ track: PriceTrack; changePct: number; changed: boolean } | null> {
  if (track.source !== "steam" && track.source !== "cheapshark") return null;

  const params = new URLSearchParams({
    source: track.source,
    id: track.gameId,
  });
  if (track.steamAppId) params.set("steamAppId", track.steamAppId);

  const res = await fetch(`/api/prices/refresh?${params.toString()}`);
  if (!res.ok) return null;

  const data = (await res.json()) as { result?: PriceResult | null };
  const fresh = data.result;
  if (!fresh) return null;

  const now = new Date().toISOString();
  const prev = track.lastPriceGrosze;
  const next = fresh.priceGrosze;
  const changePct = prev > 0 ? ((next - prev) / prev) * 100 : 0;
  const changed = Math.abs(changePct) >= 3;
  const history = [
    ...track.history,
    { at: now, priceUsd: fresh.cheapestPriceUsd, priceGrosze: next },
  ].slice(-30);

  return {
    track: {
      ...track,
      title: fresh.title || track.title,
      lastPriceUsd: fresh.cheapestPriceUsd,
      lastPriceGrosze: next,
      lastChecked: now,
      history,
      dealUrl: fresh.dealUrl ?? track.dealUrl,
      thumb: fresh.thumb ?? track.thumb,
      steamAppId: fresh.steamAppId ?? track.steamAppId,
    },
    changePct,
    changed,
  };
}

export function shopSearchLinks(query: string): { label: string; url: string }[] {
  const q = encodeURIComponent(query.trim());
  if (!query.trim()) return [];
  return [
    {
      label: "Steam",
      url: `https://store.steampowered.com/search/?term=${q}&cc=PL`,
    },
    { label: "Allegro", url: `https://allegro.pl/listing?string=${q}` },
    { label: "Ceneo", url: `https://www.ceneo.pl/;szukaj-${q}` },
    { label: "OLX", url: `https://www.olx.pl/oferty/q-${q}/` },
  ];
}
