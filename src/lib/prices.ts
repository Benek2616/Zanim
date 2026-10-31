/**
 * Price lookup & tracking via CheapShark (PC games).
 * Free public API – use CheapShark deal links when sending users to stores.
 * https://apidocs.cheapshark.com/
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

/** Approx USD → PLN (updated periodically; can later fetch from frankfurter.app). */
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

  const url = `${CS_BASE}/games?title=${encodeURIComponent(q)}&limit=8`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CheapShark search failed: ${res.status}`);

  const data: Array<{
    gameID: string;
    external: string;
    title: string;
    cheapestPriceUSD: string;
    thumb?: string;
    steamAppID?: string;
  }> = await res.json();

  return data
    .map((g) => {
      const price = Number(g.cheapestPriceUSD);
      if (!Number.isFinite(price) || price <= 0) return null;
      return {
        gameId: g.gameID,
        title: g.title || g.external,
        cheapestPriceUsd: price,
        steamAppId: g.steamAppID,
        thumb: g.thumb,
        dealUrl: undefined as string | undefined,
      } satisfies PriceResult;
    })
    .filter((x): x is PriceResult => x != null)
    .sort((a, b) => a.cheapestPriceUsd - b.cheapestPriceUsd);
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
    dealUrl: dealId ? CS_DEAL + encodeURIComponent(dealId) : undefined,
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
  const changed = Math.abs(changePct) >= 3; // threshold 3%

  const history = [...track.history, { at: now, priceUsd: next }].slice(-30); // keep last 30

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
