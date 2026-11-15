// Uruchom: node --test tests/  (Node 22.18+/24 — natywne TypeScript)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canReceiveCampaign,
  canSendNonAutomatic,
  isQuietHour,
  localTime,
  MESSAGES,
  pickVariant,
  planForDevice,
  safeInternalUrl,
  segmentOf,
  DEFAULT_PREFS,
} from "../src/lib/push/engine.ts";
import type { Device, LogEntry } from "../src/lib/push/engine.ts";

const H = 3_600_000;
const D = 24 * H;
// Środa 18.11.2026, 10:30 czasu polskiego (UTC+1) = 09:30 UTC
const WED_1030 = new Date("2026-11-18T09:30:00Z");

function dev(over: Partial<Device> = {}): Device {
  return {
    deviceId: "dev-1",
    firstSeenAt: new Date(WED_1030.getTime() - 30 * D).toISOString(),
    lastActiveAt: new Date(WED_1030.getTime() - 2 * H).toISOString(),
    timezone: "Europe/Warsaw",
    prefs: { ...DEFAULT_PREFS },
    stats: {},
    ...over,
  };
}
const log = (category: LogEntry["category"], kind: string, agoMs: number, idx = 0): LogEntry => ({
  category,
  kind,
  messageKey: `${kind}#${idx}`,
  sentAt: new Date(WED_1030.getTime() - agoMs).toISOString(),
});

test("czas lokalny Europe/Warsaw (zima UTC+1, lato UTC+2)", () => {
  assert.equal(localTime(new Date("2026-11-18T09:30:00Z"), "Europe/Warsaw").hour, 10);
  assert.equal(localTime(new Date("2026-07-01T09:30:00Z"), "Europe/Warsaw").hour, 11);
  assert.equal(localTime(new Date("2026-11-18T23:30:00Z"), "Europe/Warsaw").dateKey, "2026-11-19");
  assert.equal(localTime(WED_1030, "Zla/Strefa").hour, 10, "nieznana strefa → Europe/Warsaw");
});

test("cisza nocna 21–9 (przez północ) i zakres w dzień", () => {
  const p = { quietStart: 21, quietEnd: 9 };
  for (const h of [21, 23, 0, 5, 8]) assert.equal(isQuietHour(h, p), true, `h=${h}`);
  for (const h of [9, 12, 20]) assert.equal(isQuietHour(h, p), false, `h=${h}`);
  assert.equal(isQuietHour(14, { quietStart: 13, quietEnd: 15 }), true);
  assert.equal(isQuietHour(16, { quietStart: 13, quietEnd: 15 }), false);
  assert.equal(isQuietHour(3, { quietStart: 0, quietEnd: 0 }), false, "start=koniec → brak ciszy");
});

test("w ciszy nocnej nic nie wychodzi, nawet automatyczne", () => {
  const night = new Date("2026-11-18T21:30:00Z"); // 22:30 PL
  const msgs = planForDevice({
    device: dev(),
    dueItems: [{ itemId: "a", title: "Słuchawki", readyAt: night.toISOString() }],
    log: [],
    now: night,
  });
  assert.deepEqual(msgs, []);
});

test("segmentacja: nowi, aktywni, nieaktywni 3/7/14, czekające", () => {
  const now = WED_1030;
  assert.equal(segmentOf(dev({ firstSeenAt: new Date(now.getTime() - 2 * D).toISOString() }), now), "new");
  assert.equal(segmentOf(dev(), now), "active");
  assert.equal(segmentOf(dev({ lastActiveAt: new Date(now.getTime() - 4 * D).toISOString() }), now), "inactive3");
  assert.equal(segmentOf(dev({ lastActiveAt: new Date(now.getTime() - 8 * D).toISOString() }), now), "inactive7");
  assert.equal(segmentOf(dev({ lastActiveAt: new Date(now.getTime() - 20 * D).toISOString() }), now), "inactive14");
  assert.equal(
    segmentOf(dev({ stats: { overdueCount: 2, oldestReadyAt: new Date(now.getTime() - 30 * H).toISOString() } }), now),
    "waiting",
  );
  assert.equal(segmentOf(dev({ lastActiveAt: new Date(now.getTime() - 2 * D).toISOString() }), now), "regular");
});

test("automatyczne: 1 produkt → treść z nazwą i deep link do produktu", () => {
  const [m] = planForDevice({
    device: dev(),
    dueItems: [{ itemId: "abc-1", title: "Kurtka na jesień", readyAt: WED_1030.toISOString() }],
    log: [],
    now: WED_1030,
  });
  assert.equal(m.category, "automatic");
  assert.equal(m.url, "/?item=abc-1");
  assert.match(`${m.title} ${m.body}`, /Kurtka na jesień/);
  assert.deepEqual(m.itemIds, ["abc-1"]);
});

test("automatyczne: kilka produktów → jedno zbiorcze", () => {
  const msgs = planForDevice({
    device: dev(),
    dueItems: ["a", "b", "c"].map((id) => ({ itemId: id, title: id, readyAt: WED_1030.toISOString() })),
    log: [],
    now: WED_1030,
  });
  assert.equal(msgs.length, 1);
  assert.equal(msgs[0].kind, "readyMany");
  assert.match(msgs[0].body, /3 rzeczy/);
  assert.equal(msgs[0].url, "/?filter=ready");
});

test("automatyczne wyłączone przez użytkownika → brak", () => {
  const msgs = planForDevice({
    device: dev({ prefs: { ...DEFAULT_PREFS, automatic: false, motivational: false } }),
    dueItems: [{ itemId: "a", title: "X", readyAt: WED_1030.toISOString() }],
    log: [],
    now: WED_1030,
  });
  assert.deepEqual(msgs, []);
});

test("limit: maks. 1 motywacyjne/marketingowe dziennie i 3 w tygodniu", () => {
  assert.equal(canSendNonAutomatic([], WED_1030, "Europe/Warsaw", "motivational"), true);
  assert.equal(canSendNonAutomatic([log("motivational", "active", 1 * H)], WED_1030, "Europe/Warsaw", "motivational"), false);
  // wczoraj 1 → dziś można
  assert.equal(canSendNonAutomatic([log("motivational", "active", 26 * H)], WED_1030, "Europe/Warsaw", "motivational"), true);
  const week = [log("motivational", "a", 1.2 * D), log("marketing", "b", 3 * D), log("motivational", "c", 5 * D)];
  assert.equal(canSendNonAutomatic(week, WED_1030, "Europe/Warsaw", "motivational"), false);
  // marketing maks. 1/tydzień
  assert.equal(canSendNonAutomatic([log("marketing", "x", 2 * D)], WED_1030, "Europe/Warsaw", "marketing"), false);
});

test("motywacyjne nie wychodzą, gdy dziś już było jedno", () => {
  const msgs = planForDevice({ device: dev(), dueItems: [], log: [log("motivational", "new", 1 * H)], now: WED_1030 });
  assert.deepEqual(msgs, []);
});

test("aktywny użytkownik rano dostaje ☀️/nawykowe, nie częściej niż co 4 dni", () => {
  const [m] = planForDevice({ device: dev(), dueItems: [], log: [], now: WED_1030 });
  assert.equal(m.kind, "active");
  const again = planForDevice({ device: dev(), dueItems: [], log: [log("motivational", "active", 2 * D)], now: WED_1030 });
  assert.deepEqual(again, []);
});

test("nieaktywni: różne komunikaty powrotu, każdy etap tylko raz", () => {
  const d7 = dev({ lastActiveAt: new Date(WED_1030.getTime() - 8 * D).toISOString() });
  const [m7] = planForDevice({ device: d7, dueItems: [], log: [], now: WED_1030 });
  assert.equal(m7.kind, "comeback-7");
  assert.deepEqual(planForDevice({ device: d7, dueItems: [], log: [log("motivational", "comeback-7", 2 * D)], now: WED_1030 }), []);
  const d14 = dev({ lastActiveAt: new Date(WED_1030.getTime() - 40 * D).toISOString() });
  const three = [log("motivational", "comeback-14", 15 * D), log("motivational", "comeback-14", 30 * D), log("motivational", "comeback-14", 45 * D)];
  assert.deepEqual(planForDevice({ device: d14, dueItems: [], log: three, now: WED_1030 }), [], "po 3 przypomnieniach cisza");
  const d3 = dev({ lastActiveAt: new Date(WED_1030.getTime() - 4 * D).toISOString() });
  assert.equal(planForDevice({ device: d3, dueItems: [], log: [], now: WED_1030 })[0].kind, "comeback-3");
});

test("nowi użytkownicy w pierwszym tygodniu dostają treści wprowadzające", () => {
  const d = dev({ firstSeenAt: new Date(WED_1030.getTime() - 2 * D).toISOString() });
  assert.equal(planForDevice({ device: d, dueItems: [], log: [], now: WED_1030 })[0].kind, "new");
});

test("czekające rzeczy >24 h po czasie → '👀 Masz coś w poczekalni'", () => {
  const d = dev({ stats: { overdueCount: 1, oldestReadyAt: new Date(WED_1030.getTime() - 50 * H).toISOString() } });
  const [m] = planForDevice({ device: d, dueItems: [], log: [], now: WED_1030 });
  assert.equal(m.kind, "waiting");
  assert.equal(m.url, "/?filter=ready");
});

test("podsumowanie tygodnia w niedzielę wieczorem, z kwotą", () => {
  const sun18 = new Date("2026-11-22T17:10:00Z"); // nd 18:10 PL
  const d = dev({ lastActiveAt: new Date(sun18.getTime() - 3 * H).toISOString(), stats: { skippedWeekGrosze: 129900, skippedWeekCount: 2 } });
  const [m] = planForDevice({ device: d, dueItems: [], log: [], now: sun18 });
  assert.equal(m.kind, "weekly");
  assert.match(m.body, /1\s?299 zł/);
  assert.equal(m.url, "/raport");
});

test("podsumowanie miesiąca 1. dnia miesiąca", () => {
  const first = new Date("2026-12-01T10:00:00Z"); // 11:00 PL
  const d = dev({ lastActiveAt: new Date(first.getTime() - 5 * H).toISOString(), stats: { prevMonthSkippedCount: 4, prevMonthSkippedGrosze: 250000 } });
  const [m] = planForDevice({ device: d, dueItems: [], log: [], now: first });
  assert.equal(m.kind, "monthly");
  assert.match(m.body, /2\s?500 zł/);
});

test("bez powtórek: kolejny wariant różni się od ostatnio użytego", () => {
  const used: LogEntry[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < MESSAGES.active.length; i++) {
    const now = new Date(WED_1030.getTime() + i * D);
    const p = pickVariant("active", "dev-1", used, now);
    assert.equal(seen.has(p.messageKey), false, `powtórka ${p.messageKey}`);
    seen.add(p.messageKey);
    used.push({ category: "motivational", kind: "active", messageKey: p.messageKey, sentAt: now.toISOString() });
  }
  assert.equal(seen.size, MESSAGES.active.length);
});

test("przykłady treści od właściciela są w puli", () => {
  const all = Object.values(MESSAGES).flat().map((v) => v.body);
  for (const s of [
    "☀️ Hej! Na czym dzisiaj zaoszczędzimy? Twoja poczekalnia czeka!",
    "🛍️ {produkt} nadal czeka! Minęły już 48 godzin. Nadal masz na nie ochotę?",
    "💰 Mały przypominacz: w tym miesiącu odpuściłeś już kilka zakupów. Dobra robota!",
    "👀 Masz coś w poczekalni! Może czas podjąć decyzję?",
  ])
    assert.ok(all.includes(s), s);
});

test("kampania: tylko opt-in, bez duplikatów, w limicie i poza ciszą", () => {
  const base = { campaignId: "rabat-gru", log: [] as LogEntry[], now: WED_1030 };
  assert.deepEqual(canReceiveCampaign({ ...base, device: dev() }), { ok: false, reason: "opt-out" });
  const opted = dev({ prefs: { ...DEFAULT_PREFS, marketing: true } });
  assert.deepEqual(canReceiveCampaign({ ...base, device: opted }), { ok: true });
  assert.deepEqual(
    canReceiveCampaign({ ...base, device: opted, log: [log("marketing", "campaign:rabat-gru", 10 * D)] }),
    { ok: false, reason: "duplicate" },
  );
  assert.deepEqual(canReceiveCampaign({ ...base, device: opted, now: new Date("2026-11-18T22:00:00Z") }), { ok: false, reason: "quiet" });
  assert.deepEqual(canReceiveCampaign({ ...base, device: opted, log: [log("motivational", "active", 1 * H)] }), { ok: false, reason: "cap" });
});

test("deep linki tylko wewnętrzne", () => {
  assert.equal(safeInternalUrl("/?item=1"), "/?item=1");
  assert.equal(safeInternalUrl("https://evil.example"), "/");
  assert.equal(safeInternalUrl("//evil.example"), "/");
  assert.equal(safeInternalUrl(undefined), "/");
});
