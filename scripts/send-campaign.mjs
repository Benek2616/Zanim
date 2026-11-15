#!/usr/bin/env node
/**
 * Wysyłka kampanii marketingowej push (tylko do osób ze zgodą „Marketingowe”).
 *
 * Najpierw próba (nic nie wysyła, pokazuje ile osób dostanie):
 *   ADMIN_PASSWORD=... node scripts/send-campaign.mjs --id rabat-grudzien \
 *     --title "Zanim Plus taniej" --body "Kod ZANIM20 — -20% do niedzieli." --url /cennik
 * Właściwa wysyłka: dodaj --send
 * Inny adres: --base https://www.zanim.com.pl (domyślnie)
 */
const args = process.argv.slice(2);
const get = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : def;
};
const base = get("base", "https://www.zanim.com.pl").replace(/\/$/, "");
const payload = {
  password: process.env.ADMIN_PASSWORD ?? "",
  campaignId: get("id", ""),
  title: get("title", ""),
  body: get("body", ""),
  url: get("url", "/"),
  dryRun: !args.includes("--send"),
};
if (!payload.password || !payload.campaignId || !payload.title || !payload.body) {
  console.error("Użycie: ADMIN_PASSWORD=... node scripts/send-campaign.mjs --id <id> --title <tytuł> --body <treść> [--url /cennik] [--send]");
  process.exit(1);
}
const res = await fetch(`${base}/api/push/campaign`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
});
const data = await res.json().catch(() => ({}));
console.log(res.status, JSON.stringify(data, null, 2));
if (payload.dryRun) console.log("\nTo była PRÓBA. Aby wysłać naprawdę, dodaj --send");
