/**
 * Price lookup & tracking.
 * - Gry PC: CheapShark (Steam i inne sklepy)
 * - Reszta (elektronika, ubrania…): UPCitemdb trial API (ceny orientacyjne USD)
 */

export type PriceSource = "cheapshark" | "upcitemdb";

export type PriceResult = {
  gameId: string; // external id (gameID or upc/ean/internal)
  title: string;
  cheapestPriceUsd: number;
  cheapestDealId?: string;
  steamAppId?: string;
  thumb?: string;
  dealUrl?: string;
  source: PriceSource;
  brand?: string;
};

export type PriceTrack = {
  source: PriceSource;
  gameId: string;
  title: string;
  lastPriceUsd: number;
  lastPriceGrosze: number;
  lastChecked: string;
  history: { at: string; priceUsd: number }[];
  dealUrl?: string;
  thumb?: string;
};

const CS_BASE = "https://www.cheapshark.com/api/1.0";
const CS_DEAL = "https://www.cheapshark.com/redirect?dealID=";
const UPC_BASE = "https://api.upcitemdb.com/prod/trial/search";

const USD_TO_PLN = 3.85;

const GAME_HINT =
  /\b(gta|game|gra|steam|rpg|fps|xbox|playstation|nintendo|witcher|cyberpunk|elden|minecraft|fortnite|valorant|cs2|csgo)\b/i;

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
  return GAME_HINT.test(query);
}

/** Unified search by category / keywords. */
export async function searchPrices(
  query: string,
  category?: string,
): Promise<PriceResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  if (looksLikeGame(q, category)) {
    const games = await searchGamePrices(q);
    if (games.length > 0) return games;
  }

  // Non-game categories (or game search with no hits) → general catalog
  return searchGeneralPrices(q);
}

/** Search PC games via CheapShark. */
export async function searchGamePrices(query: string): Promise<PriceResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = `${CS_BASE}/games?title=${encodeURIComponent(q)}&limit=12`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CheapShark: ${res.status}`);

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    const err = data as { error?: string };
    throw new Error(err.error || "Błąd CheapShark");
  }

  const results: PriceResult[] = [];
  for (const g of data as Array<Record<string, unknown>>) {
    const gameId = String(g.gameID ?? "");
    if (!gameId) continue;
    const price = Number(g.cheapest ?? g.cheapestPriceUSD);
    if (!Number.isFinite(price) || price <= 0) continue;
    const dealId = g.cheapestDealID != null ? String(g.cheapestDealID) : undefined;
    results.push({
      gameId,
      title: String(g.external ?? g.title ?? "Gra"),
      cheapestPriceUsd: price,
      cheapestDealId: dealId,
      steamAppId: g.steamAppID != null ? String(g.steamAppID) : undefined,
      thumb: g.thumb != null ? String(g.thumb) : undefined,
      dealUrl: dealId ? CS_DEAL + dealId : undefined,
      source: "cheapshark",
    });
  }
  return results.sort((a, b) => a.cheapestPriceUsd - b.cheapestPriceUsd).slice(0, 8);
}

/** General products (electronics, clothes, etc.) via UPCitemdb trial. */
export async function searchGeneralPrices(query: string): Promise<PriceResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = `${UPC_BASE}?s=${encodeURIComponent(q)}&match_mode=0&type=product`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 429) throw new Error("Limit zapytań API — spróbuj za chwilę.");
    throw new Error(`UPCitemdb: ${res.status}`);
  }

  const data: {
    items?: Array<{
      ean?: string;
      upc?: string;
      title?: string;
      brand?: string;
      lowest_recorded_price?: number;
      highest_recorded_price?: number;
      images?: string[];
      offers?: Array<{ link?: string; price?: number }>;
    }>;
  } = await res.json();

  const items = data.items ?? [];
  const results: PriceResult[] = [];

  for (const item of items) {
    const low = Number(item.lowest_recorded_price);
    const high = Number(item.highest_recorded_price);
    // Prefer lowest sane price; skip garbage outliers
    let price = Number.isFinite(low) && low > 0 ? low : NaN;
    if (!Number.isFinite(price) && Number.isFinite(high) && high > 0 && high < 50_000) {
      price = high;
    }
    // Filter absurd outliers (bad catalog data)
    if (!Number.isFinite(price) || price <= 0 || price > 20_000) continue;

    const id = String(item.ean || item.upc || item.title || Math.random());
    const offerLink = item.offers?.find((o) => o.link)?.link;

    results.push({
      gameId: id,
      title: String(item.title || "Produkt").slice(0, 120),
      cheapestPriceUsd: price,
      thumb: item.images?.[0],
      dealUrl: offerLink,
      source: "upcitemdb",
      brand: item.brand,
    });
  }

  return results.sort((a, b) => a.cheapestPriceUsd - b.cheapestPriceUsd).slice(0, 8);
}

export async function fetchGameDeal(gameId: string): Promise<PriceResult | null> {
  const url = `${CS_BASE}/games?id=${encodeURIComponent(gameId)}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data: {
    info?: { title?: string; steamAppID?: string; thumb?: string };
    cheapestPriceUSD?: string;
    deals?: Array<{ dealID: string; price: string }>;
  } = await res.json();

  const price = Number(data.cheapestPriceUSD ?? data.deals?.[0]?.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  const dealId = data.deals?.[0]?.dealID;

  return {
    gameId,
    title: data.info?.title ?? "Gra",
    cheapestPriceUsd: price,
    cheapestDealId: dealId,
    steamAppId: data.info?.steamAppID,
    thumb: data.info?.thumb,
    dealUrl: dealId ? CS_DEAL + dealId : undefined,
    source: "cheapshark",
  };
}

export function makePriceTrack(result: PriceResult): PriceTrack {
  const now = new Date().toISOString();
  return {
    source: result.source,
    gameId: result.gameId,
    title: result.title,
    lastPriceUsd: result.cheapestPriceUsd,
    lastPriceGrosze: usdToGrosze(result.cheapestPriceUsd),
    lastChecked: now,
    history: [{ at: now, priceUsd: result.cheapestPriceUsd }],
    dealUrl: result.dealUrl,
    thumb: result.thumb,
  };
}

export async function refreshPriceTrack(
  track: PriceTrack,
): Promise<{ track: PriceTrack; changePct: number; changed: boolean } | null> {
  // Only CheapShark supports reliable re-fetch by id
  if (track.source !== "cheapshark") return null;

  const fresh = await fetchGameDeal(track.gameId);
  if (!fresh) return null;

  const now = new Date().toISOString();
  const prev = track.lastPriceUsd;
  const next = fresh.cheapestPriceUsd;
  const changePct = prev > 0 ? ((next - prev) / prev) * 100 : 0;
  const changed = Math.abs(changePct) >= 3;
  const history = [...track.history, { at: now, priceUsd: next }].slice(-30);

  return {
    track: {
      ...track,
      title: fresh.title || track.title,
      lastPriceUsd: next,
      lastPriceGrosze: usdToGrosze(next),
      lastChecked: now,
      history,
      dealUrl: fresh.dealUrl ?? track.dealUrl,
      thumb: fresh.thumb ?? track.thumb,
    },
    changePct,
    changed,
  };
}

/** Deep links to Polish shops for manual check. */
export function shopSearchLinks(query: string): { label: string; url: string }[] {
  const q = encodeURIComponent(query.trim());
  if (!query.trim()) return [];
  return [
    { label: "Allegro", url: `https://allegro.pl/listing?string=${q}` },
    { label: "Ceneo", url: `https://www.ceneo.pl/;szukaj-${q}` },
    { label: "OLX", url: `https://www.olx.pl/oferty/q-${q}/` },
  ];
}
