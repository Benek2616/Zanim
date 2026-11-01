/**
 * Price lookup & tracking.
 * - Gry: Steam (ceny PLN) + CheapShark (inne sklepy PC)
 * - Reszta: UPCitemdb (orientacyjne USD)
 */

export type PriceSource = "steam" | "cheapshark" | "upcitemdb";

export type PriceResult = {
  /** External id: Steam appId, CheapShark gameID, or UPC/EAN */
  gameId: string;
  title: string;
  /** Always set — for UI and tracking in grosze (1 zł = 100). */
  priceGrosze: number;
  /** USD equivalent when source is not PLN-native. */
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

const CS_BASE = "https://www.cheapshark.com/api/1.0";
const CS_DEAL = "https://www.cheapshark.com/redirect?dealID=";
const STEAM_SEARCH = "https://store.steampowered.com/api/storesearch/";
const STEAM_DETAILS = "https://store.steampowered.com/api/appdetails";
const UPC_BASE = "https://api.upcitemdb.com/prod/trial/search";

const USD_TO_PLN = 3.85;

const GAME_HINT =
  /\b(gta|game|gra|steam|rpg|fps|xbox|playstation|nintendo|witcher|wiedźmin|cyberpunk|elden|minecraft|fortnite|valorant|cs2|csgo|hogwarts|red dead)\b/i;

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

  return searchGeneralPrices(q);
}

/**
 * Games: Steam first (real PLN), then CheapShark for other store deals.
 * Results are merged — Steam apps preferred, CheapShark fills gaps / other deals.
 */
export async function searchGamePrices(query: string): Promise<PriceResult[]> {
  const [steam, cheap] = await Promise.all([
    searchSteamPrices(query).catch(() => [] as PriceResult[]),
    searchCheapSharkPrices(query).catch(() => [] as PriceResult[]),
  ]);

  // Prefer Steam (PLN), then CheapShark; dedupe by steamAppId when possible
  const seenSteam = new Set(
    steam.map((r) => r.steamAppId).filter(Boolean) as string[],
  );
  const merged = [
    ...steam,
    ...cheap.filter((r) => !r.steamAppId || !seenSteam.has(r.steamAppId)),
  ];

  return merged
    .sort((a, b) => a.priceGrosze - b.priceGrosze)
    .slice(0, 10);
}

/** Steam Store search — prices in PLN (cc=PL). */
export async function searchSteamPrices(query: string): Promise<PriceResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url =
    `${STEAM_SEARCH}?term=${encodeURIComponent(q)}&l=polish&cc=PL`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam search: ${res.status}`);

  const data: {
    items?: Array<{
      id?: number;
      name?: string;
      tiny_image?: string;
      price?: {
        currency?: string;
        initial?: number;
        final?: number;
      };
    }>;
  } = await res.json();

  const results: PriceResult[] = [];
  for (const item of data.items ?? []) {
    const appId = item.id != null ? String(item.id) : "";
    if (!appId) continue;
    // Steam returns price in smallest unit (grosze for PLN)
    const final = Number(item.price?.final);
    if (!Number.isFinite(final) || final <= 0) continue; // free / no price — skip

    const initial = Number(item.price?.initial) || final;
    const discount =
      initial > final && initial > 0
        ? Math.round(((initial - final) / initial) * 100)
        : 0;

    results.push({
      gameId: `steam:${appId}`,
      title: String(item.name || "Gra Steam"),
      priceGrosze: final,
      cheapestPriceUsd: final / 100 / USD_TO_PLN,
      currency: "PLN",
      steamAppId: appId,
      thumb: item.tiny_image,
      dealUrl: `https://store.steampowered.com/app/${appId}`,
      source: "steam",
      discountPercent: discount > 0 ? discount : undefined,
    });
  }
  return results;
}

/** CheapShark — multi-store PC deals in USD. */
export async function searchCheapSharkPrices(query: string): Promise<PriceResult[]> {
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
    const grosze = usdToGrosze(price);
    results.push({
      gameId,
      title: String(g.external ?? g.title ?? "Gra"),
      priceGrosze: grosze,
      cheapestPriceUsd: price,
      currency: "USD",
      cheapestDealId: dealId,
      steamAppId: g.steamAppID != null ? String(g.steamAppID) : undefined,
      thumb: g.thumb != null ? String(g.thumb) : undefined,
      dealUrl: dealId ? CS_DEAL + dealId : undefined,
      source: "cheapshark",
    });
  }
  return results;
}

/** @deprecated use searchGamePrices */
export async function searchGamePricesLegacy(query: string) {
  return searchCheapSharkPrices(query);
}

/** General products via UPCitemdb trial. */
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

  const results: PriceResult[] = [];
  for (const item of data.items ?? []) {
    const low = Number(item.lowest_recorded_price);
    const high = Number(item.highest_recorded_price);
    let price = Number.isFinite(low) && low > 0 ? low : NaN;
    if (!Number.isFinite(price) && Number.isFinite(high) && high > 0 && high < 50_000) {
      price = high;
    }
    if (!Number.isFinite(price) || price <= 0 || price > 20_000) continue;

    const id = String(item.ean || item.upc || item.title || Math.random());
    const offerLink = item.offers?.find((o) => o.link)?.link;
    const grosze = usdToGrosze(price);

    results.push({
      gameId: id,
      title: String(item.title || "Produkt").slice(0, 120),
      priceGrosze: grosze,
      cheapestPriceUsd: price,
      currency: "USD",
      thumb: item.images?.[0],
      dealUrl: offerLink,
      source: "upcitemdb",
      brand: item.brand,
    });
  }

  return results.sort((a, b) => a.priceGrosze - b.priceGrosze).slice(0, 8);
}

/** Refresh Steam price by app id. */
export async function fetchSteamPrice(appId: string): Promise<PriceResult | null> {
  const url = `${STEAM_DETAILS}?appids=${encodeURIComponent(appId)}&cc=PL&l=polish`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data: Record<
    string,
    {
      success?: boolean;
      data?: {
        name?: string;
        header_image?: string;
        price_overview?: {
          currency?: string;
          initial?: number;
          final?: number;
          discount_percent?: number;
        };
      };
    }
  > = await res.json();

  const entry = data[appId];
  if (!entry?.success || !entry.data) return null;
  const overview = entry.data.price_overview;
  const final = Number(overview?.final);
  if (!Number.isFinite(final) || final <= 0) return null;

  return {
    gameId: `steam:${appId}`,
    title: entry.data.name ?? "Gra Steam",
    priceGrosze: final,
    cheapestPriceUsd: final / 100 / USD_TO_PLN,
    currency: "PLN",
    steamAppId: appId,
    thumb: entry.data.header_image,
    dealUrl: `https://store.steampowered.com/app/${appId}`,
    source: "steam",
    discountPercent: overview?.discount_percent || undefined,
  };
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
  const grosze = usdToGrosze(price);

  return {
    gameId,
    title: data.info?.title ?? "Gra",
    priceGrosze: grosze,
    cheapestPriceUsd: price,
    currency: "USD",
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
  let fresh: PriceResult | null = null;

  if (track.source === "steam") {
    const appId = track.steamAppId || track.gameId.replace(/^steam:/, "");
    if (appId) fresh = await fetchSteamPrice(appId);
  } else if (track.source === "cheapshark") {
    fresh = await fetchGameDeal(track.gameId);
  } else {
    // upcitemdb — no reliable re-fetch by id
    return null;
  }

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

/** Deep links to shops for manual check. */
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
