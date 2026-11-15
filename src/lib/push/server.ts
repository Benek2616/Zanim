/**
 * Zanim — serwerowa część powiadomień push. Importuj WYŁĄCZNIE dynamicznie w handlerach /api.
 * Wymaga env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
 * (opcjonalnie VAPID_SUBJECT, np. mailto:zanim.com.pl@gmail.com).
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";
import {
  DEFAULT_PREFS,
  safeInternalUrl,
  type Category,
  type Device,
  type DeviceStats,
  type LogEntry,
  type Message,
  type Prefs,
} from "./engine";

export type SubRow = {
  device_id: string;
  secret_hash: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string | null;
  first_seen_at: string;
  last_active_at: string;
  stats: DeviceStats | null;
};

export type PrefsRow = {
  device_id: string;
  automatic: boolean;
  motivational: boolean;
  marketing: boolean;
  marketing_consent_at: string | null;
  quiet_start: number;
  quiet_end: number;
};

export function adminClient(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function vapidPublicKey(): string | null {
  return (process.env.VAPID_PUBLIC_KEY ?? process.env.VITE_VAPID_PUBLIC_KEY ?? "").trim() || null;
}

let vapidReady = false;
export function ensureVapid(): boolean {
  if (vapidReady) return true;
  const pub = vapidPublicKey();
  const priv = (process.env.VAPID_PRIVATE_KEY ?? "").trim();
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT?.trim() || "mailto:zanim.com.pl@gmail.com", pub, priv);
  vapidReady = true;
  return true;
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(`zanim-push:${secret}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

const ID_RE = /^[A-Za-z0-9_-]{16,64}$/;
export function validDeviceId(id: unknown): id is string {
  return typeof id === "string" && ID_RE.test(id);
}
export function validSecret(s: unknown): s is string {
  return typeof s === "string" && s.length >= 32 && s.length <= 128;
}

/** Zwraca wiersz urządzenia tylko, gdy sekret się zgadza. */
export async function verifyDevice(db: SupabaseClient, deviceId: unknown, secret: unknown): Promise<SubRow | null> {
  if (!validDeviceId(deviceId) || !validSecret(secret)) return null;
  const { data } = await db.from("push_subscriptions").select("*").eq("device_id", deviceId).maybeSingle();
  if (!data) return null;
  const row = data as SubRow;
  return safeEqual(row.secret_hash, hashSecret(secret)) ? row : null;
}

export function sanitizePrefs(raw: unknown): Prefs {
  const p = (raw ?? {}) as Partial<Prefs>;
  const hour = (v: unknown, d: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 23 ? (v as number) : d);
  return {
    automatic: typeof p.automatic === "boolean" ? p.automatic : DEFAULT_PREFS.automatic,
    motivational: typeof p.motivational === "boolean" ? p.motivational : DEFAULT_PREFS.motivational,
    marketing: p.marketing === true, // tylko jawne true
    quietStart: hour(p.quietStart, DEFAULT_PREFS.quietStart),
    quietEnd: hour(p.quietEnd, DEFAULT_PREFS.quietEnd),
  };
}

export function prefsToRow(deviceId: string, prefs: Prefs, prev?: PrefsRow | null) {
  return {
    device_id: deviceId,
    automatic: prefs.automatic,
    motivational: prefs.motivational,
    marketing: prefs.marketing,
    marketing_consent_at: prefs.marketing ? (prev?.marketing && prev.marketing_consent_at ? prev.marketing_consent_at : new Date().toISOString()) : null,
    quiet_start: prefs.quietStart,
    quiet_end: prefs.quietEnd,
    updated_at: new Date().toISOString(),
  };
}

export function rowToPrefs(r: PrefsRow | null | undefined): Prefs {
  if (!r) return { ...DEFAULT_PREFS };
  return {
    automatic: r.automatic,
    motivational: r.motivational,
    marketing: r.marketing,
    quietStart: r.quiet_start,
    quietEnd: r.quiet_end,
  };
}

export function toDevice(sub: SubRow, prefs: PrefsRow | null | undefined): Device {
  return {
    deviceId: sub.device_id,
    firstSeenAt: sub.first_seen_at,
    lastActiveAt: sub.last_active_at,
    timezone: sub.timezone,
    prefs: rowToPrefs(prefs),
    stats: sub.stats,
  };
}

const STAT_KEYS: (keyof DeviceStats)[] = [
  "waitingCount",
  "overdueCount",
  "itemsAddedTotal",
  "skippedWeekGrosze",
  "skippedWeekCount",
  "prevWeekSkippedGrosze",
  "skippedMonthGrosze",
  "skippedMonthCount",
  "prevMonthSkippedGrosze",
  "prevMonthSkippedCount",
];
export function sanitizeStats(raw: unknown): DeviceStats | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: DeviceStats = {};
  for (const k of STAT_KEYS) {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1e12) (out as Record<string, number>)[k] = Math.round(v);
  }
  if (typeof r.oldestReadyAt === "string" && !Number.isNaN(Date.parse(r.oldestReadyAt))) out.oldestReadyAt = new Date(r.oldestReadyAt).toISOString();
  return out;
}

export type PushPayload = { title: string; body: string; url: string; tag: string; category: Category };

export function payloadOf(m: Message | PushPayload): PushPayload {
  return { title: m.title.slice(0, 80), body: m.body.slice(0, 240), url: safeInternalUrl(m.url), tag: m.tag.slice(0, 64), category: m.category };
}

/** Wysyła jedno powiadomienie. gone=true → subskrypcja wygasła (usuń). */
export async function sendPush(sub: Pick<SubRow, "endpoint" | "p256dh" | "auth">, payload: PushPayload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: payload.category === "automatic" ? 12 * 3600 : 6 * 3600, urgency: "normal", topic: payload.tag.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || undefined },
    );
    return { ok: true as const, gone: false };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode ?? 0;
    return { ok: false as const, gone: status === 404 || status === 410, status };
  }
}

export async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await build(from, from + page - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < page) break;
  }
  return out;
}

export function logRowsToEntries(rows: { category: Category; kind: string; message_key: string; sent_at: string }[]): LogEntry[] {
  return rows.map((r) => ({ category: r.category, kind: r.kind, messageKey: r.message_key, sentAt: r.sent_at }));
}

export function bearerOk(request: Request, secret: string | undefined): boolean {
  const s = (secret ?? "").trim();
  if (s.length < 16) return false;
  const h = request.headers.get("authorization") ?? "";
  return safeEqual(h, `Bearer ${s}`);
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}
