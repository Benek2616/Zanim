import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/track-visit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
          return Response.json({ ok: true, tracked: false });
        }

        let path = "/";
        let visitorId = "";
        let referrer: string | null = null;

        try {
          const body = (await request.json()) as {
            path?: string;
            visitorId?: string;
            referrer?: string;
          };
          path = (body?.path ?? "/").slice(0, 200) || "/";
          visitorId = (body?.visitorId ?? "").slice(0, 80);
          referrer = body?.referrer ? String(body.referrer).slice(0, 300) : null;
        } catch {
          return Response.json({ ok: false }, { status: 400 });
        }

        if (path.startsWith("/zarzadzanie") || path.startsWith("/api")) {
          return Response.json({ ok: true, tracked: false });
        }

        if (!visitorId || visitorId.length < 8) {
          return Response.json({ ok: true, tracked: false });
        }

        const admin = createClient(supabaseUrl, serviceKey);

        const { data: ban } = await admin
          .from("bans")
          .select("id")
          .eq("kind", "visitor")
          .eq("value", visitorId)
          .maybeSingle();

        if (ban) {
          return Response.json({ ok: true, tracked: false, banned: true });
        }

        const ua = request.headers.get("user-agent")?.slice(0, 300) ?? null;

        const { error } = await admin.from("visits").insert({
          visitor_id: visitorId,
          path,
          referrer,
          user_agent: ua,
        });

        if (error) {
          console.error("[track-visit]", error.message);
          return Response.json({ ok: true, tracked: false });
        }

        return Response.json({ ok: true, tracked: true });
      },
    },
  },
});
