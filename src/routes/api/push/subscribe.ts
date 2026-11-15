import { createFileRoute } from "@tanstack/react-router";

type Body = {
  deviceId?: string;
  secret?: string;
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  prefs?: unknown;
  timezone?: string;
};

/** Zapis / odświeżenie subskrypcji push urządzenia + preferencji. */
export const Route = createFileRoute("/api/push/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const s = await import("@/lib/push/server");
        const { safeTimeZone } = await import("@/lib/push/engine");
        const db = s.adminClient();
        if (!db) return s.json({ ok: false, error: "Powiadomienia nie są jeszcze skonfigurowane." }, 503);

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return s.json({ ok: false, error: "Bad body" }, 400);
        }
        const { deviceId, secret, subscription } = body;
        const endpoint = subscription?.endpoint ?? "";
        const p256dh = subscription?.keys?.p256dh ?? "";
        const auth = subscription?.keys?.auth ?? "";
        if (!s.validDeviceId(deviceId) || !s.validSecret(secret)) return s.json({ ok: false, error: "Bad device" }, 400);
        if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || p256dh.length > 200 || !auth || auth.length > 100) {
          return s.json({ ok: false, error: "Bad subscription" }, 400);
        }

        const { data: existing } = await db.from("push_subscriptions").select("device_id, secret_hash").eq("device_id", deviceId).maybeSingle();
        if (existing && existing.secret_hash !== s.hashSecret(secret)) return s.json({ ok: false, error: "Forbidden" }, 403);

        // Ten sam endpoint zapisany pod innym urządzeniem (np. po wyczyszczeniu danych) → zastąp
        await db.from("push_subscriptions").delete().eq("endpoint", endpoint).neq("device_id", deviceId);

        const now = new Date().toISOString();
        const row = {
          device_id: deviceId,
          secret_hash: s.hashSecret(secret),
          endpoint,
          p256dh,
          auth,
          user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
          timezone: safeTimeZone(body.timezone),
          last_active_at: now,
          updated_at: now,
        };
        const { error } = await db.from("push_subscriptions").upsert(row, { onConflict: "device_id" });
        if (error) {
          console.error("[push/subscribe]", error.message);
          return s.json({ ok: false, error: "DB error" }, 500);
        }

        const prefs = s.sanitizePrefs(body.prefs);
        const { data: prev } = await db.from("notification_prefs").select("*").eq("device_id", deviceId).maybeSingle();
        await db.from("notification_prefs").upsert(s.prefsToRow(deviceId, prefs, prev), { onConflict: "device_id" });
        return s.json({ ok: true, prefs });
      },
    },
  },
});
