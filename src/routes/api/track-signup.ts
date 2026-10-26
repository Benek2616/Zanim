import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/track-signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
          return Response.json({ ok: true, tracked: false });
        }

        let email = "";
        let displayName = "";
        try {
          const body = (await request.json()) as {
            email?: string;
            displayName?: string;
          };
          email = (body?.email ?? "").trim().toLowerCase();
          displayName = (body?.displayName ?? "").trim().slice(0, 80);
        } catch {
          return Response.json({ ok: false, error: "Bad body" }, { status: 400 });
        }

        if (!email || !email.includes("@") || email.length > 200) {
          return Response.json({ ok: false, error: "Nieprawidłowy e-mail." }, { status: 400 });
        }

        const ua = request.headers.get("user-agent")?.slice(0, 300) ?? null;
        const admin = createClient(supabaseUrl, serviceKey);

        const { error } = await admin.from("signups").upsert(
          {
            email,
            display_name: displayName || null,
            plus: true,
            user_agent: ua,
          },
          { onConflict: "email", ignoreDuplicates: false },
        );

        if (error) {
          console.error("[track-signup]", error.message);
          return Response.json({ ok: true, tracked: false });
        }

        return Response.json({ ok: true, tracked: true });
      },
    },
  },
});
