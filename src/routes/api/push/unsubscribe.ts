import { createFileRoute } from "@tanstack/react-router";

/** Wyłączenie powiadomień: usuwa subskrypcję i (kaskadowo) wszystkie dane powiadomień urządzenia. */
export const Route = createFileRoute("/api/push/unsubscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const s = await import("@/lib/push/server");
        const db = s.adminClient();
        if (!db) return s.json({ ok: true, removed: false });
        const body = (await request.json().catch(() => ({}))) as { deviceId?: string; secret?: string };
        const sub = await s.verifyDevice(db, body.deviceId, body.secret);
        if (!sub) return s.json({ ok: true, removed: false });
        await db.from("push_subscriptions").delete().eq("device_id", sub.device_id);
        return s.json({ ok: true, removed: true });
      },
    },
  },
});
