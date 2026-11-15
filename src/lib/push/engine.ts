/**
 * Zanim — silnik powiadomień (czysta logika, bez zależności).
 * Segmentacja, limity częstotliwości, cisza nocna, wybór treści bez powtórek.
 * Używany przez /api/cron/notifications i /api/push/campaign; testowany w tests/push-engine.test.ts.
 */

export type Category = "automatic" | "motivational" | "marketing";

export type Prefs = {
  automatic: boolean;
  motivational: boolean;
  marketing: boolean;
  /** Godzina (0–23) początku ciszy nocnej, domyślnie 21 */
  quietStart: number;
  /** Godzina (0–23) końca ciszy nocnej, domyślnie 9 */
  quietEnd: number;
};

export const DEFAULT_PREFS: Prefs = {
  automatic: true,
  motivational: true,
  marketing: false,
  quietStart: 21,
  quietEnd: 9,
};

export const DEFAULT_TZ = "Europe/Warsaw";

/** Statystyki liczone na urządzeniu i wysyłane tylko, gdy włączone są „Motywacyjne”. */
export type DeviceStats = {
  waitingCount?: number;
  /** Rzeczy, którym minął czas oddechu, a nie ma werdyktu */
  overdueCount?: number;
  /** Najstarszy moment „gotowe” wśród nierozstrzygniętych (ISO) */
  oldestReadyAt?: string | null;
  itemsAddedTotal?: number;
  skippedWeekGrosze?: number;
  skippedWeekCount?: number;
  prevWeekSkippedGrosze?: number;
  skippedMonthGrosze?: number;
  skippedMonthCount?: number;
  prevMonthSkippedGrosze?: number;
  prevMonthSkippedCount?: number;
};

export type Device = {
  deviceId: string;
  firstSeenAt: string;
  lastActiveAt: string;
  timezone?: string | null;
  prefs: Prefs;
  stats?: DeviceStats | null;
};

export type DueItem = { itemId: string; title: string; readyAt: string };

export type LogEntry = {
  category: Category;
  /** Klucz rodzaju, np. "ready", "comeback-7", "weekly", "campaign:abc" */
  kind: string;
  /** Klucz konkretnej treści (wariantu), np. "ready#2" */
  messageKey: string;
  sentAt: string;
};

export type Message = {
  category: Category;
  kind: string;
  messageKey: string;
  title: string;
  body: string;
  url: string;
  tag: string;
  itemIds?: string[];
};

export type Segment =
  | "new"
  | "active"
  | "inactive3"
  | "inactive7"
  | "inactive14"
  | "waiting"
  | "regular";

export const LIMITS = {
  /** Maks. powiadomień motywacyjnych + marketingowych dziennie (lokalny dzień) */
  nonAutomaticPerDay: 1,
  /** Maks. powiadomień motywacyjnych + marketingowych w ciągu 7 dni */
  nonAutomaticPerWeek: 3,
  /** Maks. marketingowych w ciągu 7 dni */
  marketingPerWeek: 1,
  /** Maks. automatycznych dziennie (kilka gotowych rzeczy = 1 zbiorcze) */
  automaticPerDay: 3,
  /** Nie powtarzamy tego samego wariantu treści przez tyle dni */
  noRepeatDays: 21,
  /** Motywacyjne tylko w tych godzinach lokalnych [od, do) */
  motivationalWindow: [10, 20] as const,
  /** Po 14+ dniach nieaktywności: przypomnienie najwyżej co 14 dni, maks. 3 razy */
  lapsedEveryDays: 14,
  lapsedMax: 3,
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

// ───────────────────────── czas lokalny ─────────────────────────

export type LocalTime = {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number; // 0–23
  weekday: number; // 0 = niedziela … 6 = sobota
  dateKey: string; // RRRR-MM-DD
};

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function safeTimeZone(tz?: string | null): string {
  if (!tz) return DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

export function localTime(date: Date, tz?: string | null): LocalTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone(tz),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const hour = Number(get("hour")) % 24;
  return {
    year,
    month,
    day,
    hour,
    weekday: WEEKDAYS[get("weekday")] ?? 0,
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

/** Cisza nocna: domyślnie 21:00–9:00. Obsługuje zakresy przez północ i w obrębie dnia. */
export function isQuietHour(hour: number, prefs: Pick<Prefs, "quietStart" | "quietEnd">): boolean {
  const s = clampHour(prefs.quietStart);
  const e = clampHour(prefs.quietEnd);
  if (s === e) return false; // brak ciszy
  return s > e ? hour >= s || hour < e : hour >= s && hour < e;
}

function clampHour(h: number): number {
  return Number.isFinite(h) ? Math.min(23, Math.max(0, Math.trunc(h))) : 0;
}

// ───────────────────────── segmentacja ─────────────────────────

export function daysSince(iso: string | null | undefined, now: Date): number {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Infinity;
  return Math.max(0, (now.getTime() - t) / DAY);
}

export function segmentOf(device: Device, now: Date): Segment {
  const inactive = daysSince(device.lastActiveAt, now);
  if (inactive >= 14) return "inactive14";
  if (inactive >= 7) return "inactive7";
  if (inactive >= 3) return "inactive3";
  const s = device.stats ?? {};
  const overdueHours = s.oldestReadyAt ? (now.getTime() - new Date(s.oldestReadyAt).getTime()) / HOUR : 0;
  if ((s.overdueCount ?? 0) > 0 && overdueHours >= 24) return "waiting";
  if (daysSince(device.firstSeenAt, now) < 7) return "new";
  if (inactive < 1.5) return "active";
  return "regular";
}

// ───────────────────────── limity ─────────────────────────

export function countLog(
  log: LogEntry[],
  now: Date,
  opts: { categories: Category[]; withinMs?: number; sameLocalDay?: string; tz?: string | null },
): number {
  return log.filter((e) => {
    if (!opts.categories.includes(e.category)) return false;
    const t = new Date(e.sentAt).getTime();
    if (opts.withinMs != null && now.getTime() - t > opts.withinMs) return false;
    if (opts.sameLocalDay && localTime(new Date(t), opts.tz).dateKey !== opts.sameLocalDay) return false;
    return true;
  }).length;
}

export function canSendNonAutomatic(
  log: LogEntry[],
  now: Date,
  tz: string | null | undefined,
  category: "motivational" | "marketing",
): boolean {
  const today = localTime(now, tz).dateKey;
  const both: Category[] = ["motivational", "marketing"];
  if (countLog(log, now, { categories: both, sameLocalDay: today, tz }) >= LIMITS.nonAutomaticPerDay) return false;
  if (countLog(log, now, { categories: both, withinMs: 7 * DAY }) >= LIMITS.nonAutomaticPerWeek) return false;
  if (
    category === "marketing" &&
    countLog(log, now, { categories: ["marketing"], withinMs: 7 * DAY }) >= LIMITS.marketingPerWeek
  )
    return false;
  return true;
}

export function canSendAutomatic(log: LogEntry[], now: Date, tz?: string | null): boolean {
  const today = localTime(now, tz).dateKey;
  return countLog(log, now, { categories: ["automatic"], sameLocalDay: today, tz }) < LIMITS.automaticPerDay;
}

function sentKindSince(log: LogEntry[], kind: string, now: Date, withinMs: number): boolean {
  return log.some((e) => e.kind === kind && now.getTime() - new Date(e.sentAt).getTime() <= withinMs);
}

// ───────────────────────── treści ─────────────────────────

type Variant = { title: string; body: string };

export const MESSAGES: Record<string, Variant[]> = {
  ready: [
    { title: "Czas oddechu minął", body: "🛍️ {produkt} nadal czeka! Minęły już 48 godzin. Nadal masz na nie ochotę?" },
    { title: "Czas na werdykt", body: "⏳ {produkt} odczekało swoje. Kupujesz czy odpuszczasz?" },
    { title: "{produkt} — decyzja?", body: "Emocje opadły? Zajrzyj i zdecyduj z chłodną głową." },
    { title: "Minęło 48 godzin", body: "🧊 Chłodna głowa gotowa. Czy {produkt} to nadal dobry pomysł?" },
  ],
  readyMany: [
    { title: "Werdykty czekają", body: "👀 {liczba} rzeczy odczekało swoje. Może czas podjąć decyzję?" },
    { title: "Czas oddechu minął", body: "⏳ Masz {liczba} rzeczy gotowe do werdyktu. Kupujesz czy odpuszczasz?" },
  ],
  waiting: [
    { title: "Poczekalnia", body: "👀 Masz coś w poczekalni! Może czas podjąć decyzję?" },
    { title: "Coś czeka na Ciebie", body: "Rzeczy w poczekalni czekają na werdykt. Wystarczy minuta." },
    { title: "Spokojna decyzja", body: "🧘 Czas minął jakiś czas temu. Odpuścić też jest w porządku." },
  ],
  active: [
    { title: "Dzień dobry", body: "☀️ Hej! Na czym dzisiaj zaoszczędzimy? Twoja poczekalnia czeka!" },
    { title: "Mały nawyk", body: "🧠 Zanim klikniesz „kup” — wrzuć to do poczekalni. Impuls lubi pośpiech." },
    { title: "Świadome zakupy", body: "🌱 Najtańsza rzecz to ta, której nie potrzebujesz. Dobrze Ci idzie." },
    { title: "Pauza działa", body: "⏸️ Każda pauza to wybór. Masz coś, co kusi? Niech poczeka 48 h." },
  ],
  monthProgress: [
    { title: "Dobra robota", body: "💰 Mały przypominacz: w tym miesiącu odpuściłeś już kilka zakupów. Dobra robota!" },
    { title: "Ten miesiąc", body: "💰 Odpuszczone w tym miesiącu: {kwota}. Spokojnie, krok po kroku." },
    { title: "Liczy się", body: "📈 {liczba} odpuszczonych zakupów w tym miesiącu. To realne pieniądze w kieszeni." },
  ],
  new: [
    { title: "Pierwszy tydzień", body: "👋 Masz chęć na coś nowego? Wrzuć to do poczekalni i zobacz, co zostanie po 48 h." },
    { title: "Jak działa Zanim", body: "Wrzucasz rzecz, odczekujesz, decydujesz. Bez moralizowania — tylko czas." },
    { title: "Wskazówka", body: "💡 Ustaw w profilu dochód — zobaczysz, ile godzin pracy kosztuje każda rzecz." },
  ],
  "comeback-3": [
    { title: "Wszystko gra?", body: "☕ Dawno Cię nie było. Coś kusi ostatnio? Poczekalnia jest gotowa." },
    { title: "Krótko", body: "Masz ochotę coś kupić? Daj temu 48 godzin w Zanim." },
  ],
  "comeback-7": [
    { title: "Tęsknimy trochę", body: "🌿 Tydzień przerwy. Jeśli coś Cię kusi — wrzuć to do poczekalni, zanim kupisz." },
    { title: "Zanim kupisz…", body: "Nadchodzą promocje? Najpierw poczekalnia, potem decyzja." },
  ],
  "comeback-14": [
    { title: "Zanim", body: "Jesteśmy tu, gdy będziesz potrzebować chwili na decyzję. Bez presji. 🙂" },
    { title: "Nowy start?", body: "🔄 Jedna rzecz, 48 godzin, spokojna decyzja. Wróć, kiedy zechcesz." },
  ],
  weekly: [
    { title: "Podsumowanie tygodnia", body: "📊 W tym tygodniu odpuszczono {kwota}. Tak trzymaj!" },
    { title: "Twój tydzień", body: "🗓️ {liczba} odpuszczonych zakupów, {kwota} zostało w kieszeni." },
  ],
  monthly: [
    { title: "Podsumowanie miesiąca", body: "🏆 W zeszłym miesiącu odpuszczono {liczba} zakupów i zaoszczędzono {kwota}." },
    { title: "Miesiąc z Zanim", body: "💰 Zeszły miesiąc: {kwota} niewydane. To Twoje pieniądze." },
  ],
};

export function formatZlShort(grosze: number): string {
  const zl = Math.round(grosze / 100);
  return `${zl.toLocaleString("pl-PL")} zł`;
}

function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Wybiera wariant treści, którego urządzenie nie dostało w ostatnich LIMITS.noRepeatDays dniach.
 * Jeśli wszystkie były — bierze najdawniej użyty. Deterministyczne (hash urządzenia + dzień).
 */
export function pickVariant(
  kind: string,
  deviceId: string,
  log: LogEntry[],
  now: Date,
): { index: number; variant: Variant; messageKey: string } {
  const variants = MESSAGES[kind];
  if (!variants || variants.length === 0) throw new Error(`Brak treści dla ${kind}`);
  const lastUsed = new Map<number, number>();
  for (const e of log) {
    const [k, idx] = e.messageKey.split("#");
    if (k !== kind) continue;
    const t = new Date(e.sentAt).getTime();
    const i = Number(idx);
    lastUsed.set(i, Math.max(lastUsed.get(i) ?? 0, t));
  }
  const start = hashStr(`${deviceId}|${kind}|${localTime(now).dateKey}`) % variants.length;
  const order = variants.map((_, i) => (start + i) % variants.length);
  const fresh = order.filter((i) => {
    const t = lastUsed.get(i);
    return t == null || now.getTime() - t > LIMITS.noRepeatDays * DAY;
  });
  const index = fresh.length > 0 ? fresh[0] : order.reduce((a, b) => ((lastUsed.get(a) ?? 0) <= (lastUsed.get(b) ?? 0) ? a : b));
  return { index, variant: variants[index], messageKey: `${kind}#${index}` };
}

function build(
  kind: string,
  category: Category,
  device: Device,
  log: LogEntry[],
  now: Date,
  vars: Record<string, string | number>,
  url: string,
  tag: string,
  itemIds?: string[],
): Message {
  const { variant, messageKey } = pickVariant(kind, device.deviceId, log, now);
  return {
    category,
    kind,
    messageKey,
    title: fill(variant.title, vars),
    body: fill(variant.body, vars),
    url,
    tag,
    itemIds,
  };
}

export function truncateTitle(title: string, max = 40): string {
  const t = title.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

// ───────────────────────── planowanie ─────────────────────────

/**
 * Wylicza, co (jeśli cokolwiek) wysłać temu urządzeniu teraz.
 * Wywoływane cyklicznie (cron). Zwraca 0–2 wiadomości: maks. 1 automatyczną + maks. 1 motywacyjną.
 */
export function planForDevice(input: {
  device: Device;
  dueItems: DueItem[];
  log: LogEntry[];
  now: Date;
}): Message[] {
  const { device, dueItems, log, now } = input;
  const tz = device.timezone;
  const lt = localTime(now, tz);
  const prefs = { ...DEFAULT_PREFS, ...device.prefs };
  if (isQuietHour(lt.hour, prefs)) return [];

  const out: Message[] = [];

  // 1) Automatyczne — konkretne produkty, którym minął czas oddechu
  if (prefs.automatic && dueItems.length > 0 && canSendAutomatic(log, now, tz)) {
    const sorted = [...dueItems].sort((a, b) => a.readyAt.localeCompare(b.readyAt));
    if (sorted.length === 1) {
      const it = sorted[0];
      out.push(
        build("ready", "automatic", device, log, now, { produkt: truncateTitle(it.title) }, `/?item=${encodeURIComponent(it.itemId)}`, `ready-${it.itemId}`, [it.itemId]),
      );
    } else {
      out.push(
        build("readyMany", "automatic", device, log, now, { liczba: sorted.length }, "/?filter=ready", "ready-many", sorted.map((i) => i.itemId)),
      );
    }
  }

  // 2) Motywacyjne — tylko w oknie dziennym i w limicie
  if (prefs.motivational && out.length === 0) {
    const [from, to] = LIMITS.motivationalWindow;
    if (lt.hour >= from && lt.hour < to && canSendNonAutomatic(log, now, tz, "motivational")) {
      const m = pickMotivational(device, log, now, lt);
      if (m) out.push(m);
    }
  }
  return out;
}

function pickMotivational(device: Device, log: LogEntry[], now: Date, lt: LocalTime): Message | null {
  const s = device.stats ?? {};
  const seg = segmentOf(device, now);
  const mk = (kind: string, vars: Record<string, string | number> = {}, url = "/") =>
    build(kind, "motivational", device, log, now, vars, url, `motywacja-${kind}`);

  // Powroty — łagodnie, każdy etap tylko raz; po 14 dniach rzadko i maks. 3 razy
  if (seg === "inactive14") {
    const lapsedSent = log.filter((e) => e.kind === "comeback-14").length;
    if (lapsedSent >= LIMITS.lapsedMax) return null;
    if (sentKindSince(log, "comeback-14", now, LIMITS.lapsedEveryDays * DAY)) return null;
    return mk("comeback-14");
  }
  if (seg === "inactive7") {
    return sentKindSince(log, "comeback-7", now, 14 * DAY) ? null : mk("comeback-7");
  }
  if (seg === "inactive3") {
    return sentKindSince(log, "comeback-3", now, 7 * DAY) ? null : mk("comeback-3");
  }

  // Podsumowanie miesiąca — 1. dzień miesiąca, gdy coś odpuszczono
  if (lt.day === 1 && (s.prevMonthSkippedCount ?? 0) > 0 && !sentKindSince(log, "monthly", now, 20 * DAY)) {
    return mk("monthly", { liczba: s.prevMonthSkippedCount ?? 0, kwota: formatZlShort(s.prevMonthSkippedGrosze ?? 0) }, "/raport");
  }
  // Podsumowanie tygodnia — niedziela od 17:00
  if (lt.weekday === 0 && lt.hour >= 17 && (s.skippedWeekGrosze ?? 0) > 0 && !sentKindSince(log, "weekly", now, 5 * DAY)) {
    return mk("weekly", { liczba: s.skippedWeekCount ?? 0, kwota: formatZlShort(s.skippedWeekGrosze ?? 0) }, "/raport");
  }

  if (seg === "waiting") {
    return sentKindSince(log, "waiting", now, 3 * DAY) ? null : mk("waiting", {}, "/?filter=ready");
  }
  if (seg === "new") {
    return sentKindSince(log, "new", now, 2 * DAY) ? null : mk("new");
  }
  // Postępy w miesiącu — gdy są (nie częściej niż co 10 dni)
  if ((s.skippedMonthCount ?? 0) >= 2 && !sentKindSince(log, "monthProgress", now, 10 * DAY)) {
    return mk("monthProgress", { liczba: s.skippedMonthCount ?? 0, kwota: formatZlShort(s.skippedMonthGrosze ?? 0) }, "/raport");
  }
  if (seg === "active" || seg === "regular") {
    // aktywni i tak zaglądają — przypomnienie najwyżej co 4 dni, rano/przed południem
    if (lt.hour > 12) return null;
    return sentKindSince(log, "active", now, 4 * DAY) ? null : mk("active");
  }
  return null;
}

/** Kampania marketingowa — czy to urządzenie może ją dostać teraz. */
export function canReceiveCampaign(input: {
  device: Device;
  campaignId: string;
  log: LogEntry[];
  now: Date;
}): { ok: true } | { ok: false; reason: "opt-out" | "quiet" | "cap" | "duplicate" } {
  const { device, campaignId, log, now } = input;
  const prefs = { ...DEFAULT_PREFS, ...device.prefs };
  if (!prefs.marketing) return { ok: false, reason: "opt-out" };
  if (log.some((e) => e.kind === `campaign:${campaignId}`)) return { ok: false, reason: "duplicate" };
  if (isQuietHour(localTime(now, device.timezone).hour, prefs)) return { ok: false, reason: "quiet" };
  if (!canSendNonAutomatic(log, now, device.timezone, "marketing")) return { ok: false, reason: "cap" };
  return { ok: true };
}

/** Bezpieczny link wewnętrzny (tylko ścieżki tej samej domeny). */
export function safeInternalUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "/";
  if (!url.startsWith("/") || url.startsWith("//")) return "/";
  return url.slice(0, 300);
}
