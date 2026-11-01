import { createFileRoute } from "@tanstack/react-router";

const CS_BASE = "https://www.cheapshark.com/api/1.0";
const CS_DEAL = "https://www.cheapshark.com/redirect?dealID=";
const STEAM_SEARCH = "https://store.steampowered.com/api/storesearch/";
const STEAM_DETAILS = "https://store.steampowered.com/api/appdetails";
const UPC_BASE = "https://api.upcitemdb.com/prod/trial/search";
const USD_TO_PLN = 3.85;

const UA = "Zanim/1.0 (https://github.com/Benek2616/Zanim; price-proxy)";

const QUERY_ALIASES: Record<string, string[]> = {
  gta: ["grand theft auto", "gta v", "gta 5"],
  "gta 5": ["grand theft auto v", "gta v enhanced"],
  "gta v": ["grand theft auto v", "gta v enhanced"],
  gta5: ["grand theft auto v"],
  rdr2: ["red dead redemption 2"],
  rdr: ["red dead redemption"],
  witcher: ["the witcher", "wiedźmin"],
  wiedźmin: ["the witcher", "wiedźmin"],
  "witcher 3": ["the witcher 3", "wiedźmin 3"],
  cyberpunk: ["cyberpunk 2077"],
  cs2: ["counter-strike 2"],
  csgo: ["counter-strike"],
  elden: ["elden ring"],
  hogwarts: ["hogwarts legacy"],
  fifa: ["ea sports fc", "fifa"],
  skyrim: ["the elder scrolls v skyrim"],
};

const GAME_HINT =
  /\b(gta|game|gra|steam|rpg|fps|xbox|playstation|nintendo|witcher|wiedźmin|cyberpunk|elden|minecraft|fortnite|valorant|cs2|csgo|hogwarts|red dead|rdr|fifa|skyrim|fallout)\b/i;

type PriceResult = {
  gameId: string;
  title: string;
  priceGrosze: number;
  cheapestPriceUsd: number;
  currency: "PLN" | "USD";
  cheapestDealId?: string;
  steamAppId?: string;
  thumb?: string;
  dealUrl?: string;
  source: "steam" | "cheapshark" | "upcitemdb";
  brand?: string;
  discountPercent?: number;
};

function usdToGrosze(usd: number) {
  return Math.round(usd * USD_TO_PLN * 100);
}

function steamCapsule(appId: string) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_231x87.jpg`;
}

function steamHeader(appId: string) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

function expandQueries(query: string): string[] {
  const q = query.trim();
  const lower = q.toLowerCase();
  const extra = QUERY_ALIASES[lower] ?? [];
  return [...new Set([q, ...extra])].slice(0, 4);
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function searchSteam(term: string): Promise<PriceResult[]> {
  const url = `${STEAM_SEARCH}?term=${encodeURIComponent(term)}&l=polish&cc=PL`;
  const data = (await fetchJson(url)) as {
    items?: Array<{
      id?: number;
      name?: string;
      tiny_image?: string;
      price?: { initial?: number; final?: number };
    }>;
  };

  const out: PriceResult[] = [];
  for (const item of data.items ?? []) {
    const appId = item.id != null ? String(item.id) : "";
    if (!appId) continue;
    const final = Number(item.price?.final);
    const hasPrice = Number.isFinite(final) && final > 0;
    const initial = Number(item.price?.initial) || final;
    const discount =
      hasPrice && initial > final && initial > 0
        ? Math.round(((initial - final) / initial) * 100)
        : 0;

    out.push({
      gameId: `steam:${appId}`,
      title: String(item.name || "Gra Steam"),
      priceGrosze: hasPrice ? final : 0,
      cheapestPriceUsd: hasPrice ? final / 100 / USD_TO_PLN : 0,
      currency: "PLN",
      steamAppId: appId,
      thumb: item.tiny_image || steamCapsule(appId),
      dealUrl: `https://store.steampowered.com/app/${appId}`,
      source: "steam",
      discountPercent: discount > 0 ? discount : undefined,
    });
  }
  return out;
}

async function fetchSteamPrice(appId: string): Promise<PriceResult | null> {
  const url = `${STEAM_DETAILS}?appids=${encodeURIComponent(appId)}&cc=PL&l=polish`;
  const data = (await fetchJson(url)) as Record<
    string,
    {
      success?: boolean;
      data?: {
        name?: string;
        header_image?: string;
        price_overview?: {
          final?: number;
          initial?: number;
          discount_percent?: number;
        };
      };
    }
  >;
  const entry = data[appId];
  if (!entry?.success || !entry.data) return null;
  const final = Number(entry.data.price_overview?.final);
  if (!Number.isFinite(final) || final <= 0) return null;
  return {
    gameId: `steam:${appId}`,
    title: entry.data.name ?? "Gra Steam",
    priceGrosze: final,
    cheapestPriceUsd: final / 100 / USD_TO_PLN,
    currency: "PLN",
    steamAppId: appId,
    thumb: entry.data.header_image || steamHeader(appId),
    dealUrl: `https://store.steampowered.com/app/${appId}`,
    source: "steam",
    discountPercent: entry.data.price_overview?.discount_percent || undefined,
  };
}

async function searchCheapShark(term: string): Promise<PriceResult[]> {
  const url = `${CS_BASE}/games?title=${encodeURIComponent(term)}&limit=20`;
  const data = await fetchJson(url);
  if (!Array.isArray(data)) return [];

  const out: PriceResult[] = [];
  for (const g of data as Array<Record<string, unknown>>) {
    const gameId = String(g.gameID ?? "");
    if (!gameId) continue;
    const price = Number(g.cheapest ?? g.cheapestPriceUSD);
    if (!Number.isFinite(price) || price <= 0) continue;
    const dealId = g.cheapestDealID != null ? String(g.cheapestDealID) : undefined;
    const steamAppId = g.steamAppID != null ? String(g.steamAppID) : undefined;
    out.push({
      gameId,
      title: String(g.external ?? g.title ?? "Gra"),
      priceGrosze: usdToGrosze(price),
      cheapestPriceUsd: price,
      currency: "USD",
      cheapestDealId: dealId,
      steamAppId,
      thumb:
        (g.thumb != null ? String(g.thumb) : undefined) ||
        (steamAppId ? steamCapsule(steamAppId) : undefined),
      dealUrl: dealId ? CS_DEAL + dealId : undefined,
      source: "cheapshark",
    });
  }
  return out;
}

async function searchUpc(term: string): Promise<PriceResult[]> {
  const url = `${UPC_BASE}?s=${encodeURIComponent(term)}&match_mode=0&type=product`;
  const data = (await fetchJson(url)) as {
    items?: Array<{
      ean?: string;
      upc?: string;
      title?: string;
      brand?: string;
      lowest_recorded_price?: number;
      highest_recorded_price?: number;
      images?: string[];
      offers?: Array<{ link?: string }>;
    }>;
  };

  const out: PriceResult[] = [];
  for (const item of data.items ?? []) {
    const low = Number(item.lowest_recorded_price);
    const high = Number(item.highest_recorded_price);
    let price = Number.isFinite(low) && low > 0 ? low : NaN;
    if (!Number.isFinite(price) && Number.isFinite(high) && high > 0 && high < 50_000) {
      price = high;
    }
    if (!Number.isFinite(price) || price <= 0 || price > 20_000) continue;
    const id = String(item.ean || item.upc || item.title || Math.random());
    out.push({
      gameId: id,
      title: String(item.title || "Produkt").slice(0, 120),
      priceGrosze: usdToGrosze(price),
      cheapestPriceUsd: price,
      currency: "USD",
      thumb: item.images?.[0],
      dealUrl: item.offers?.find((o) => o.link)?.link,
      source: "upcitemdb",
      brand: item.brand,
    });
  }
  return out.sort((a, b) => a.priceGrosze - b.priceGrosze).slice(0, 8);
}

async function searchGames(query: string): Promise<PriceResult[]> {
  const terms = expandQueries(query);
  const steamBatches = await Promise.all(
    terms.map((t) => searchSteam(t).catch(() => [] as PriceResult[])),
  );
  const cheap = await searchCheapShark(query).catch(() => [] as PriceResult[]);

  const byApp = new Map<string, PriceResult>();
  for (const batch of steamBatches) {
    for (const r of batch) {
      const key = r.steamAppId || r.gameId;
      if (!byApp.has(key)) byApp.set(key, r);
    }
  }
  let steam = [...byApp.values()];

  const missing = steam.filter((r) => !r.priceGrosze || r.priceGrosze <= 0);
  if (missing.length > 0) {
    const filled = await Promise.all(
      missing.slice(0, 6).map(async (r) => {
        if (!r.steamAppId) return r;
        return (await fetchSteamPrice(r.steamAppId).catch(() => null)) ?? r;
      }),
    );
    const fillMap = new Map(filled.map((r) => [r.steamAppId || r.gameId, r]));
    steam = steam
      .map((r) => fillMap.get(r.steamAppId || r.gameId) ?? r)
      .filter((r) => r.priceGrosze > 0);
  } else {
    steam = steam.filter((r) => r.priceGrosze > 0);
  }

  const seen = new Set(steam.map((r) => r.steamAppId).filter(Boolean) as string[]);
  return [...steam, ...cheap.filter((r) => !r.steamAppId || !seen.has(r.steamAppId))]
    .sort((a, b) => a.priceGrosze - b.priceGrosze)
    .slice(0, 12);
}

export const Route = createFileRoute("/api/prices/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").trim();
        const category = (url.searchParams.get("category") ?? "").trim();

        if (q.length < 2) {
          return Response.json({ results: [] });
        }

        try {
          const isGame = category === "hobby" || GAME_HINT.test(q);
          let results: PriceResult[] = [];

          if (isGame) {
            results = await searchGames(q);
          }
          if (results.length === 0) {
            results = await searchUpc(q).catch(() => []);
          }

          return Response.json({ results });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          console.error("[prices/search]", msg);
          return Response.json(
            { results: [], error: `Nie udało się pobrać cen (${msg})` },
            { status: 502 },
          );
        }
      },
    },
  },
});
