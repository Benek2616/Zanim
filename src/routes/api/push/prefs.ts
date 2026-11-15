import { createFileRoute } from "@tanstack/react-router";

/** Zmiana preferencji (kategorie, cisza nocna). Wyłączenie kategorii usuwa związane dane. */
export const Route = createFileRoute("/api/push/prefs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const s = await import("@/lib/push/server");
        const db = s.adminClient();
        if (!db) return s.json({ ok: false, error: "Not configured" }, 503);
        const body = (await request.json().catch(() => ({}))) as { deviceId?: string; secret?: string; prefs?: unknown };
        const sub = await s.verifyDevice(db, body.deviceId, body.secret);
        if (!sub) return s.json({ ok: false, error: "Unknown device" }, 404);

        const prefs = s.sanitizePrefs(body.prefs);
        const { data: prev } = await db.from("notification_prefs").select("*").eq("device_id", sub.device_id).maybeSingle();
        await db.from("notification_prefs").upsert(s.prefsToRow(sub.device_id, prefs, prev), { onConflict: "device_id" });
        // minimalizacja danych: bez kategorii nie trzymamy danych do niej
        if (!prefs.automatic) await db.from("push_items").delete().eq("device_id", sub.device_id);
        if (!prefs.motivational) await db.from("push_subscriptions").update({ stats: null }).eq("device_id", sub.device_id);
        return s.json({ ok: true, prefs });
      },
    },
  },
});
