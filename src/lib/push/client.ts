/**
 * Zanim — powiadomienia push po stronie przeglądarki / aplikacji (TWA).
 * Urządzenie identyfikuje losowe deviceId + sekret (oba tylko lokalnie; serwer zna hash sekretu).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WaitItem } from "@/lib/zanim";
import { DEFAULT_PREFS, type DeviceStats, type Prefs } from "./engine";

export type PushStatus = "unsupported" | "denied" | "off" | "on";

type PushState = {
  deviceId: string;
  secret: string;
  enabled: boolean;
  /** Serwer potwierdził subskrypcję (przypomnienia przychodzą nawet przy zamkniętej aplikacji) */
  serverOk: boolean;
  prefs: Prefs;
  promptDismissedAt: string | null;
  promptDismissCount: number;
  lastSyncAt: string | null;
  lastSyncHash: string | null;
  setPrefs: (p: Prefs) => void;
  setEnabled: (v: boolean) => void;
  dismissPrompt: () => void;
  markSynced: (hash: string) => void;
};

function randomId(bytes: number): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(36).padStart(2, "0")).join("").replace(/[^a-z0-9]/g, "").slice(0, bytes * 2);
}

export const usePush = create<PushState>()(
  persist(
    (set) => ({
      deviceId: "",
      secret: "",
      enabled: false,
      serverOk: false,
      prefs: { ...DEFAULT_PREFS },
      promptDismissedAt: null,
      promptDismissCount: 0,
      lastSyncAt: null,
      lastSyncHash: null,
      setPrefs: (prefs) => set({ prefs }),
      setEnabled: (enabled) => set({ enabled }),
      dismissPrompt: () => set((s) => ({ promptDismissedAt: new Date().toISOString(), promptDismissCount: s.promptDismissCount + 1 })),
      markSynced: (hash) => set({ lastSyncAt: new Date().toISOString(), lastSyncHash: hash }),
    }),
    { name: "zanim.push.v1" },
  ),
);

function ensureIdentity(): { deviceId: string; secret: string } {
  const s = usePush.getState();
  if (s.deviceId && s.secret) return { deviceId: s.deviceId, secret: s.secret };
  const deviceId = `d${randomId(12)}`.slice(0, 24).padEnd(20, "0");
  const secret = randomId(24).padEnd(40, "x");
  usePush.setState({ deviceId, secret });
  return { deviceId, secret };
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification !== "undefined"
  );
}

export function pushStatus(): PushStatus {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return usePush.getState().enabled && Notification.permission === "granted" ? "on" : "off";
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function timezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Warsaw";
  } catch {
    return "Europe/Warsaw";
  }
}

async function post(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  try {
    return await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
  } catch {
    return null;
  }
}

async function subscribeOnServer(reg: ServiceWorkerRegistration): Promise<"ok" | "unconfigured" | "error"> {
  let cfg: { configured?: boolean; publicKey?: string | null } = {};
  try {
    cfg = (await (await fetch("/api/push/config")).json()) as typeof cfg;
  } catch {
    return "error";
  }
  if (!cfg.configured || !cfg.publicKey) return "unconfigured";
  const key = urlBase64ToUint8Array(cfg.publicKey);
  let sub = await reg.pushManager.getSubscription();
  // klucz serwera się zmienił → nowa subskrypcja
  if (sub && sub.options?.applicationServerKey) {
    const cur = new Uint8Array(sub.options.applicationServerKey);
    if (cur.length !== key.length || cur.some((b, i) => b !== key[i])) {
      await sub.unsubscribe().catch(() => {});
      sub = null;
    }
  }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  const { deviceId, secret } = ensureIdentity();
  const res = await post("/api/push/subscribe", { deviceId, secret, subscription: sub.toJSON(), prefs: usePush.getState().prefs, timezone: timezone() });
  usePush.setState({ serverOk: res.ok });
  return res.ok ? "ok" : res.status === 503 ? "unconfigured" : "error";
}

export type EnableResult = "on" | "denied" | "unsupported" | "unconfigured" | "error";

/** Włączenie powiadomień — wywołuj WYŁĄCZNIE po geście użytkownika (kliknięcie). */
export async function enablePush(): Promise<EnableResult> {
  if (!isPushSupported()) return "unsupported";
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "denied" : "error";
  const reg = await registration();
  if (!reg) return "error";
  let result: "ok" | "unconfigured" | "error";
  try {
    result = await subscribeOnServer(reg);
  } catch {
    result = "error";
  }
  // Lokalne przypomnienia (gdy aplikacja otwarta) działają nawet bez serwera.
  usePush.setState({ enabled: true, lastSyncHash: null });
  return result === "ok" ? "on" : result;
}

export async function disablePush(): Promise<void> {
  const { deviceId, secret } = usePush.getState();
  try {
    const reg = await registration();
    const sub = await reg?.pushManager.getSubscription();
    await sub?.unsubscribe();
  } catch {
    /* ignore */
  }
  if (deviceId && secret) await post("/api/push/unsubscribe", { deviceId, secret });
  usePush.setState({ enabled: false, serverOk: false, lastSyncHash: null });
}

export async function savePrefs(prefs: Prefs): Promise<boolean> {
  usePush.getState().setPrefs(prefs);
  const { enabled, deviceId, secret } = usePush.getState();
  if (!enabled || !deviceId) return true;
  const res = await post("/api/push/prefs", { deviceId, secret, prefs });
  usePush.setState({ lastSyncHash: null });
  return res.ok;
}

// ───────────────────────── synchronizacja ─────────────────────────

function startOfWeek(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // poniedziałek = 0
  x.setDate(x.getDate() - day);
  return x.getTime();
}

export function computeStats(items: WaitItem[], now = new Date()): DeviceStats {
  const t = now.getTime();
  const waiting = items.filter((i) => i.status === "waiting");
  const overdue = waiting.filter((i) => new Date(i.readyAt).getTime() <= t);
  const oldest = overdue.map((i) => i.readyAt).sort()[0] ?? null;
  const skipped = items.filter((i) => i.status === "skipped" && i.verdictAt);
  const wk = startOfWeek(now);
  const prevWk = wk - 7 * 86_400_000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const sum = (from: number, to: number) => {
    const list = skipped.filter((i) => {
      const v = new Date(i.verdictAt as string).getTime();
      return v >= from && v < to;
    });
    return { n: list.length, g: list.reduce((s, i) => s + i.amountGrosze, 0) };
  };
  const w = sum(wk, Infinity);
  const pw = sum(prevWk, wk);
  const m = sum(monthStart, Infinity);
  const pm = sum(prevMonthStart, monthStart);
  return {
    waitingCount: waiting.length,
    overdueCount: overdue.length,
    oldestReadyAt: oldest,
    itemsAddedTotal: items.length,
    skippedWeekGrosze: w.g,
    skippedWeekCount: w.n,
    prevWeekSkippedGrosze: pw.g,
    skippedMonthGrosze: m.g,
    skippedMonthCount: m.n,
    prevMonthSkippedGrosze: pm.g,
    prevMonthSkippedCount: pm.n,
  };
}

/** Wysyła minimum danych potrzebnych do powiadomień — zgodnie z włączonymi kategoriami. */
export function buildSyncPayload(items: WaitItem[], prefs: Prefs, now = new Date()) {
  return {
    items: prefs.automatic
      ? items.filter((i) => i.status === "waiting").map((i) => ({ id: i.id, title: i.title, readyAt: i.readyAt }))
      : undefined,
    stats: prefs.motivational ? computeStats(items, now) : undefined,
    timezone: timezone(),
  };
}

let syncTimer: number | undefined;

/** Wywoływane przy starcie aplikacji i po zmianach na liście (z opóźnieniem). */
export function schedulePushSync(items: WaitItem[], delayMs = 2500) {
  if (typeof window === "undefined") return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => void syncNow(items), delayMs);
}

export async function syncNow(items: WaitItem[]): Promise<void> {
  const st = usePush.getState();
  if (!st.enabled || !st.deviceId || !isPushSupported() || Notification.permission !== "granted") return;
  const payload = buildSyncPayload(items, st.prefs);
  const dayKey = new Date().toDateString(); // raz dziennie odśwież aktywność nawet bez zmian
  const hash = JSON.stringify([payload.items, payload.stats, st.prefs, dayKey]);
  if (hash === st.lastSyncHash) return;
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (reg && !sub) {
    // subskrypcja wygasła / została usunięta przez przeglądarkę → odnów
    const r = await subscribeOnServer(reg).catch(() => "error" as const);
    if (r !== "ok") return;
  }
  const res = await post("/api/push/sync", { deviceId: st.deviceId, secret: st.secret, ...payload });
  if (res.status === 404 && reg) {
    await subscribeOnServer(reg).catch(() => {});
    return;
  }
  if (res.ok) usePush.getState().markSynced(hash);
}

/** Czy pokazać delikatną prośbę o zgodę (nie przy pierwszym uruchomieniu). */
export function shouldShowSoftPrompt(opts: { itemsCount: number; now?: number }): boolean {
  if (!isPushSupported()) return false;
  if (Notification.permission !== "default") return false;
  const s = usePush.getState();
  if (s.enabled) return false;
  if (opts.itemsCount < 1) return false; // dopiero po dodaniu pierwszej rzeczy
  if (s.promptDismissCount >= 3) return false;
  if (s.promptDismissedAt) {
    const days = ((opts.now ?? Date.now()) - new Date(s.promptDismissedAt).getTime()) / 86_400_000;
    if (days < (s.promptDismissCount >= 2 ? 30 : 7)) return false;
  }
  return true;
}

/** Testowe powiadomienie lokalne (przez service worker, jak prawdziwe). */
export async function showTestNotification(): Promise<boolean> {
  const reg = await registration();
  if (!reg || Notification.permission !== "granted") return false;
  await reg.showNotification("Zanim — test", {
    body: "Tak będą wyglądać przypomnienia. Spokojnie i rzadko. 🙂",
    icon: "/icon-192.png",
    badge: "/badge-96.png",
    tag: "zanim-test",
    lang: "pl",
    data: { url: "/powiadomienia" },
  });
  return true;
}
