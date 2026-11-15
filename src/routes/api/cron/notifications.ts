import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron powiadomień. Vercel Cron wysyła nagłówek `Authorization: Bearer <CRON_SECRET>`.
 * Ręcznie / zewnętrzny harmonogram: curl -H "Authorization: Bearer $CRON_SECRET" https://www.zanim.com.pl/api/cron/notifications
 * ?dry=1 — tylko policz, nic nie wysyłaj.
 */
async function handle(request: Request) {
  const s = await import("@/lib/push/server");
  if (!s.bearerOk(request, process.env.CRON_SECRET)) return s.json({ ok: false, error: "Unauthorized" }, 401);
  const db = s.adminClient();
  if (!db || !s.ensureVapid()) return s.json({ ok: false, error: "Brak konfiguracji Supabase/VAPID" }, 503);
  const { runScheduled } = await import("@/lib/push/runner");
  const dryRun = new URL(request.url).searchParams.get("dry") === "1";
  try {
    const stats = await runScheduled(db, { dryRun });
    return s.json({ ok: true, dryRun, ...stats });
  } catch (e) {
    console.error("[cron/notifications]", e);
    return s.json({ ok: false, error: "Run failed" }, 500);
  }
}

export const Route = createFileRoute("/api/cron/notifications")({
  server: { handlers: { GET: ({ request }) => handle(request), POST: ({ request }) => handle(request) } },
});
