/** Zanim — wysyłka zaplanowana (cron) i kampanie marketingowe. Tylko serwer. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { canReceiveCampaign, planForDevice, safeInternalUrl, type Category, type DueItem, type LogEntry } from "./engine";
import { fetchAll, logRowsToEntries, payloadOf, sendPush, toDevice, type PrefsRow, type PushPayload, type SubRow } from "./server";

const LOG_DAYS = 60;

async function loadAll(db: SupabaseClient) {
  const since = new Date(Date.now() - LOG_DAYS * 86_400_000).toISOString();
  const subs = await fetchAll<SubRow>((a, b) => db.from("push_subscriptions").select("*").order("device_id").range(a, b));
  const prefs = await fetchAll<PrefsRow>((a, b) => db.from("notification_prefs").select("*").order("device_id").range(a, b));
  const logs = await fetchAll<{ device_id: string; category: Category; kind: string; message_key: string; sent_at: string }>((a, b) =>
    db.from("notification_log").select("device_id, category, kind, message_key, sent_at").gte("sent_at", since).eq("status", "sent").order("id").range(a, b),
  );
  const prefsBy = new Map(prefs.map((p) => [p.device_id, p]));
  const logBy = new Map<string, LogEntry[]>();
  for (const r of logs) {
    const list = logBy.get(r.device_id) ?? [];
    list.push(...logRowsToEntries([r]));
    logBy.set(r.device_id, list);
  }
  return { subs, prefsBy, logBy };
}

async function deliver(db: SupabaseClient, sub: SubRow, payload: PushPayload, kind: string, messageKey: string) {
  const res = await sendPush(sub, payload);
  await db.from("notification_log").insert({
    device_id: sub.device_id,
    category: payload.category,
    kind,
    message_key: messageKey,
    title: payload.title,
    body: payload.body,
    url: payload.url,
    status: res.ok ? "sent" : res.gone ? "gone" : "failed",
  });
  if (res.gone) await db.from("push_subscriptions").delete().eq("device_id", sub.device_id);
  return res;
}

/** Wywoływane przez cron. Idempotentne — można odpalać co godzinę albo raz dziennie. */
export async function runScheduled(db: SupabaseClient, opts: { now?: Date; dryRun?: boolean } = {}) {
  const now = opts.now ?? new Date();
  const { subs, prefsBy, logBy } = await loadAll(db);
  const due = await fetchAll<{ device_id: string; item_id: string; title: string; ready_at: string }>((a, b) =>
    db.from("push_items").select("device_id, item_id, title, ready_at").is("notified_at", null).lte("ready_at", now.toISOString()).order("ready_at").range(a, b),
  );
  const dueBy = new Map<string, DueItem[]>();
  for (const d of due) {
    const list = dueBy.get(d.device_id) ?? [];
    list.push({ itemId: d.item_id, title: d.title, readyAt: d.ready_at });
    dueBy.set(d.device_id, list);
  }

  const stats = { devices: subs.length, planned: 0, sent: 0, failed: 0, gone: 0, byKind: {} as Record<string, number> };
  for (const sub of subs) {
    const messages = planForDevice({ device: toDevice(sub, prefsBy.get(sub.device_id)), dueItems: dueBy.get(sub.device_id) ?? [], log: logBy.get(sub.device_id) ?? [], now });
    for (const m of messages) {
      stats.planned++;
      stats.byKind[m.kind] = (stats.byKind[m.kind] ?? 0) + 1;
      if (opts.dryRun) continue;
      const res = await deliver(db, sub, payloadOf(m), m.kind, m.messageKey);
      if (res.ok) {
        stats.sent++;
        if (m.itemIds?.length) {
          await db.from("push_items").update({ notified_at: now.toISOString() }).eq("device_id", sub.device_id).in("item_id", m.itemIds);
        }
      } else if (res.gone) {
        stats.gone++;
        break;
      } else stats.failed++;
    }
  }
  return stats;
}

/** Kampania marketingowa: tylko do zgód marketingowych, z limitami, ciszą nocną i bez duplikatów. */
export async function runCampaign(
  db: SupabaseClient,
  c: { campaignId: string; title: string; body: string; url?: string; dryRun?: boolean; now?: Date },
) {
  const now = c.now ?? new Date();
  const { subs, prefsBy, logBy } = await loadAll(db);
  const result = { eligible: 0, sent: 0, failed: 0, gone: 0, skipped: { "opt-out": 0, quiet: 0, cap: 0, duplicate: 0 } as Record<string, number> };
  const payload: PushPayload = {
    title: c.title.slice(0, 80),
    body: c.body.slice(0, 240),
    url: safeInternalUrl(c.url ?? "/"),
    tag: `kampania-${c.campaignId}`.slice(0, 64),
    category: "marketing",
  };
  for (const sub of subs) {
    const verdict = canReceiveCampaign({ device: toDevice(sub, prefsBy.get(sub.device_id)), campaignId: c.campaignId, log: logBy.get(sub.device_id) ?? [], now });
    if (!verdict.ok) {
      result.skipped[verdict.reason]++;
      continue;
    }
    result.eligible++;
    if (c.dryRun) continue;
    const res = await deliver(db, sub, payload, `campaign:${c.campaignId}`, `campaign:${c.campaignId}#0`);
    if (res.ok) result.sent++;
    else if (res.gone) result.gone++;
    else result.failed++;
  }
  return result;
}
