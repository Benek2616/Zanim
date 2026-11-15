import { createFileRoute } from "@tanstack/react-router";

/**
 * Kampania marketingowa (tylko admin). Body JSON:
 * { password: ADMIN_PASSWORD, campaignId: "rabat-grudzien", title, body, url?: "/cennik", dryRun?: true }
 * Wysyła wyłącznie do osób ze zgodą „Marketingowe”, z limitami, ciszą nocną i bez duplikatów.
 * Zobacz scripts/send-campaign.mjs.
 */
export const Route = createFileRoute("/api/push/campaign")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const s = await import("@/lib/push/server");
        const body = (await request.json().catch(() => ({}))) as {
          password?: string;
          campaignId?: string;
          title?: string;
          body?: string;
          url?: string;
          dryRun?: boolean;
        };
        const expected = (process.env.ADMIN_PASSWORD ?? "").trim();
        if (expected.length < 6 || (body.password ?? "").trim() !== expected) {
          await new Promise((r) => setTimeout(r, 600));
          return s.json({ ok: false, error: "Złe hasło." }, 401);
        }
        const campaignId = (body.campaignId ?? "").trim();
        if (!/^[a-z0-9-]{3,40}$/.test(campaignId)) return s.json({ ok: false, error: "campaignId: 3–40 znaków a-z, 0-9, -" }, 400);
        if (!body.title?.trim() || !body.body?.trim()) return s.json({ ok: false, error: "Podaj title i body." }, 400);
        const db = s.adminClient();
        if (!db || !s.ensureVapid()) return s.json({ ok: false, error: "Brak konfiguracji Supabase/VAPID" }, 503);
        const { runCampaign } = await import("@/lib/push/runner");
        const result = await runCampaign(db, {
          campaignId,
          title: body.title.trim(),
          body: body.body.trim(),
          url: body.url,
          dryRun: body.dryRun !== false, // domyślnie próba — wyślij dopiero z dryRun:false
        });
        return s.json({ ok: true, campaignId, dryRun: body.dryRun !== false, ...result });
      },
    },
  },
});
