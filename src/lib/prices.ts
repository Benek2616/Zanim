/**
 * Price lookup & tracking via CheapShark (PC games).
 * Free public API – use CheapShark deal links when sending users to stores.
 * https://apidocs.cheapshark.com/
 *
 * Search response fields: gameID, external, cheapest, cheapestDealID, steamAppID, thumb
 * Detail response: info.title, deals[].price / dealID
 */

export type PriceResult = {
  gameId: string;
  title: string;
  cheapestPriceUsd: number;
  cheapestDealId?: string;
  steamAppId?: string;
  thumb?: string;
  dealUrl?: string;
};

export type PriceTrack = {
  source: "cheapshark";
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

/** Approx USD → PLN. */
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

/** Search games by title. Returns up to 8 matches sorted by cheapest price. */
export async function searchGamePrices(query: string): Promise<PriceResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = `${CS_BASE}/games?title=${encodeURIComponent(q)}&limit=12`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CheapShark search failed: ${res.status}`);

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    // API may return { error: "..." }
    const err = data as { error?: string };
    throw new Error(err.error || "Nieoczekiwana odpowiedź CheapShark");
  }

  const results: PriceResult[] = [];
  for (const g of data as Array<Record<string, unknown>>) {
    const gameId = String(g.gameID ?? g.gameId ?? "");
    if (!gameId) continue;

    // API uses "cheapest" (string), not cheapestPriceUSD
    const rawPrice = g.cheapest ?? g.cheapestPriceUSD ?? g.cheapestPriceUsd;
    const price = Number(rawPrice);
    if (!Number.isFinite(price) || price <= 0) continue;

    const title = String(g.external ?? g.title ?? g.internalName ?? "Gra");
    const dealId = g.cheapestDealID != null ? String(g.cheapestDealID) : undefined;

    results.push({
      gameId,
      title,
      cheapestPriceUsd: price,
      cheapestDealId: dealId,
      steamAppId: g.steamAppID != null ? String(g.steamAppID) : undefined,
      thumb: g.thumb != null ? String(g.thumb) : undefined,
      dealUrl: dealId ? CS_DEAL + dealId : undefined,
    });
  }

  return results.sort((a, b) => a.cheapestPriceUsd - b.cheapestPriceUsd).slice(0, 8);
}

/** Fetch current cheapest deal for a known gameID. */
export async function fetchGameDeal(gameId: string): Promise<PriceResult | null> {
  const url = `${CS_BASE}/games?id=${encodeURIComponent(gameId)}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data: {
    info?: { title?: string; steamAppID?: string; thumb?: string };
    cheapestPriceUSD?: string;
    deals?: Array<{ dealID: string; price: string; storeID: string }>;
  } = await res.json();

  if (!data || typeof data !== "object") return null;

  const fromDeal = data.deals?.[0]?.price;
  const price = Number(data.cheapestPriceUSD ?? fromDeal);
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
  };
}

/** Build initial PriceTrack from a search result. */
export function makePriceTrack(result: PriceResult): PriceTrack {
  const now = new Date().toISOString();
  return {
    source: "cheapshark",
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

/**
 * Refresh a track. Returns updated track + change info.
 * changePct > 0 = increase, < 0 = drop.
 */
export async function refreshPriceTrack(
  track: PriceTrack,
): Promise<{ track: PriceTrack; changePct: number; changed: boolean } | null> {
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
