import { createFileRoute } from "@tanstack/react-router";

type Item = { id?: string; title?: string; readyAt?: string };

/**
 * Synchronizacja minimalnych danych do powiadomień:
 * - aktywność (last_active_at) — do segmentacji (nowi / aktywni / nieaktywni),
 * - rzeczy w poczekalni: TYLKO id, tytuł i moment „gotowe” (gdy włączone „Automatyczne”),
 * - zagregowane statystyki (gdy włączone „Motywacyjne”).
 */
export const Route = createFileRoute("/api/push/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const s = await import("@/lib/push/server");
        const { safeTimeZone } = await import("@/lib/push/engine");
        const db = s.adminClient();
        if (!db) return s.json({ ok: false, error: "Not configured" }, 503);
        const body = (await request.json().catch(() => ({}))) as {
          deviceId?: string;
          secret?: string;
          items?: Item[];
          stats?: unknown;
          timezone?: string;
        };
        const sub = await s.verifyDevice(db, body.deviceId, body.secret);
        if (!sub) return s.json({ ok: false, error: "Unknown device" }, 404);

        const { data: prefsRow } = await db.from("notification_prefs").select("*").eq("device_id", sub.device_id).maybeSingle();
        const prefs = s.rowToPrefs(prefsRow);
        const now = new Date().toISOString();

        await db
          .from("push_subscriptions")
          .update({
            last_active_at: now,
            updated_at: now,
            timezone: safeTimeZone(body.timezone ?? sub.timezone),
            stats: prefs.motivational ? s.sanitizeStats(body.stats) : null,
          })
          .eq("device_id", sub.device_id);

        if (prefs.automatic && Array.isArray(body.items)) {
          const items = body.items
            .filter((i) => typeof i.id === "string" && i.id.length <= 64 && typeof i.title === "string" && typeof i.readyAt === "string" && !Number.isNaN(Date.parse(i.readyAt)))
            .slice(0, 200)
            .map((i) => ({ item_id: i.id as string, title: (i.title as string).trim().slice(0, 120) || "Rzecz", ready_at: new Date(i.readyAt as string).toISOString() }));

          const { data: current } = await db.from("push_items").select("item_id, ready_at, notified_at").eq("device_id", sub.device_id);
          const cur = new Map((current ?? []).map((r) => [r.item_id as string, r as { ready_at: string; notified_at: string | null }]));
          const keep = new Set(items.map((i) => i.item_id));
          const toDelete = [...cur.keys()].filter((id) => !keep.has(id));
          if (toDelete.length) await db.from("push_items").delete().eq("device_id", sub.device_id).in("item_id", toDelete);
          if (items.length) {
            await db.from("push_items").upsert(
              items.map((i) => {
                const prev = cur.get(i.item_id);
                const sameReady = prev && new Date(prev.ready_at).getTime() === new Date(i.ready_at).getTime();
                // przedłużony czas oddechu → przypomnij ponownie
                return { device_id: sub.device_id, ...i, notified_at: sameReady ? prev.notified_at : null, updated_at: now };
              }),
              { onConflict: "device_id,item_id" },
            );
          }
        } else if (!prefs.automatic) {
          await db.from("push_items").delete().eq("device_id", sub.device_id);
        }
        return s.json({ ok: true, prefs });
      },
    },
  },
});
