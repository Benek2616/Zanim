import { createFileRoute } from "@tanstack/react-router";

const CS_BASE = "https://www.cheapshark.com/api/1.0";
const CS_DEAL = "https://www.cheapshark.com/redirect?dealID=";
const STEAM_DETAILS = "https://store.steampowered.com/api/appdetails";
const USD_TO_PLN = 3.85;
const UA = "Zanim/1.0 (https://github.com/Benek2616/Zanim; price-proxy)";

type PriceResult = {
  gameId: string;
  title: string;
  priceGrosze: number;
  cheapestPriceUsd: number;
  currency: "PLN" | "USD";
  steamAppId?: string;
  thumb?: string;
  dealUrl?: string;
  source: "steam" | "cheapshark";
  discountPercent?: number;
};

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function fetchSteam(appId: string): Promise<PriceResult | null> {
  const url = `${STEAM_DETAILS}?appids=${encodeURIComponent(appId)}&cc=PL&l=polish`;
  const data = (await fetchJson(url)) as Record<
    string,
    {
      success?: boolean;
      data?: {
        name?: string;
        header_image?: string;
        price_overview?: { final?: number; discount_percent?: number };
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
    thumb:
      entry.data.header_image ||
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
    dealUrl: `https://store.steampowered.com/app/${appId}`,
    source: "steam",
    discountPercent: entry.data.price_overview?.discount_percent || undefined,
  };
}

async function fetchCheapShark(gameId: string): Promise<PriceResult | null> {
  const url = `${CS_BASE}/games?id=${encodeURIComponent(gameId)}`;
  const data = (await fetchJson(url)) as {
    info?: { title?: string; steamAppID?: string; thumb?: string };
    cheapestPriceUSD?: string;
    deals?: Array<{ dealID: string; price: string }>;
  };
  const price = Number(data.cheapestPriceUSD ?? data.deals?.[0]?.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  const dealId = data.deals?.[0]?.dealID;
  return {
    gameId,
    title: data.info?.title ?? "Gra",
    priceGrosze: Math.round(price * USD_TO_PLN * 100),
    cheapestPriceUsd: price,
    currency: "USD",
    steamAppId: data.info?.steamAppID,
    thumb: data.info?.thumb,
    dealUrl: dealId ? CS_DEAL + dealId : undefined,
    source: "cheapshark",
  };
}

export const Route = createFileRoute("/api/prices/refresh")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const source = (url.searchParams.get("source") ?? "").trim();
        const id = (url.searchParams.get("id") ?? "").trim();
        const steamAppId = (url.searchParams.get("steamAppId") ?? "").trim();

        if (!id && !steamAppId) {
          return Response.json({ error: "missing id" }, { status: 400 });
        }

        try {
          let result: PriceResult | null = null;
          if (source === "steam") {
            const appId = steamAppId || id.replace(/^steam:/, "");
            result = await fetchSteam(appId);
          } else if (source === "cheapshark") {
            result = await fetchCheapShark(id);
          } else {
            return Response.json({ error: "unsupported source" }, { status: 400 });
          }

          if (!result) {
            return Response.json({ result: null });
          }
          return Response.json({ result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          console.error("[prices/refresh]", msg);
          return Response.json({ error: msg }, { status: 502 });
        }
      },
    },
  },
});
