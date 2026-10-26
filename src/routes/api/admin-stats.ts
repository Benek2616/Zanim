import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/admin-stats")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = (process.env.ADMIN_PASSWORD ?? "").trim();
        if (!expected || expected.length < 6) {
          return Response.json(
            {
              ok: false,
              error:
                "ADMIN_PASSWORD nie jest ustawione na serwerze (min. 6 znaków). Zrób Redeploy po dodaniu zmiennej.",
            },
            { status: 503 },
          );
        }

        let password = "";
        try {
          const body = (await request.json()) as { password?: string };
          password = (body?.password ?? "").trim();
        } catch {
          password = "";
        }

        if (!password || password !== expected) {
          await new Promise((r) => setTimeout(r, 600));
          return Response.json({ ok: false, error: "Złe hasło." }, { status: 401 });
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
          return Response.json({
            ok: true,
            configured: false,
            total: 0,
            plus: 0,
            last7: 0,
            last30: 0,
            recent: [],
            visitsTotal: 0,
            visitsLast7: 0,
            visitsLast30: 0,
            uniqueVisitors7: 0,
            topPaths: [],
            recentVisits: [],
            message:
              "Brak VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — tracking wyłączony.",
          });
        }

        const admin = createClient(supabaseUrl, serviceKey);
        const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // --- Signups ---
        const { count: total } = await admin
          .from("signups")
          .select("*", { count: "exact", head: true });

        const { count: plus } = await admin
          .from("signups")
          .select("*", { count: "exact", head: true })
          .eq("plus", true);

        const { count: last7 } = await admin
          .from("signups")
          .select("*", { count: "exact", head: true })
          .gte("created_at", since7);

        const { count: last30 } = await admin
          .from("signups")
          .select("*", { count: "exact", head: true })
          .gte("created_at", since30);

        const { data: recentRows } = await admin
          .from("signups")
          .select("email, display_name, plus, created_at")
          .order("created_at", { ascending: false })
          .limit(20);

        // --- Visits ---
        const { count: visitsTotal } = await admin
          .from("visits")
          .select("*", { count: "exact", head: true });

        const { count: visitsLast7 } = await admin
          .from("visits")
          .select("*", { count: "exact", head: true })
          .gte("created_at", since7);

        const { count: visitsLast30 } = await admin
          .from("visits")
          .select("*", { count: "exact", head: true })
          .gte("created_at", since30);

        const { data: visits7rows } = await admin
          .from("visits")
          .select("visitor_id")
          .gte("created_at", since7)
          .limit(5000);

        const uniqueVisitors7 = new Set(
          (visits7rows ?? []).map((v) => v.visitor_id).filter(Boolean),
        ).size;

        const { data: pathRows } = await admin
          .from("visits")
          .select("path")
          .gte("created_at", since30)
          .limit(3000);

        const pathCounts = new Map<string, number>();
        for (const row of pathRows ?? []) {
          const p = row.path || "/";
          pathCounts.set(p, (pathCounts.get(p) ?? 0) + 1);
        }
        const topPaths = [...pathCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([path, count]) => ({ path, count }));

        const { data: recentVisitRows } = await admin
          .from("visits")
          .select("path, created_at, referrer")
          .order("created_at", { ascending: false })
          .limit(25);

        const maskEmail = (email: string) => {
          const [local, domain] = email.split("@");
          if (!domain) return "***";
          const visible = local.slice(0, Math.min(2, local.length));
          return `${visible}***@${domain}`;
        };

        const recent = (recentRows ?? []).map((r) => ({
          email: maskEmail(r.email),
          displayName: r.display_name || "—",
          plus: Boolean(r.plus),
          createdAt: r.created_at,
        }));

        const recentVisits = (recentVisitRows ?? []).map((v) => ({
          path: v.path || "/",
          createdAt: v.created_at,
          referrer: v.referrer || null,
        }));

        return Response.json({
          ok: true,
          configured: true,
          total: total ?? 0,
          plus: plus ?? 0,
          last7: last7 ?? 0,
          last30: last30 ?? 0,
          recent,
          visitsTotal: visitsTotal ?? 0,
          visitsLast7: visitsLast7 ?? 0,
          visitsLast30: visitsLast30 ?? 0,
          uniqueVisitors7,
          topPaths,
          recentVisits,
        });
      },
    },
  },
});
