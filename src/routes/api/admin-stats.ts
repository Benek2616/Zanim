import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

function checkPassword(request: Request, expected: string) {
  return request
    .json()
    .then((body: { password?: string; action?: string; kind?: string; value?: string; reason?: string }) => body)
    .catch(() => ({ password: "" as string }));
}

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
                "ADMIN_PASSWORD nie jest ustawione na serwerze (min. 6 znaków).",
            },
            { status: 503 },
          );
        }

        const body = await checkPassword(request, expected);
        const password = (body.password ?? "").trim();

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
            dailyVisits: [],
            bans: [],
            message: "Brak konfiguracji Supabase.",
          });
        }

        const admin = createClient(supabaseUrl, serviceKey);

        // Akcje ban / unban
        if (body.action === "ban" && body.kind && body.value) {
          const kind = body.kind === "email" ? "email" : "visitor";
          const value =
            kind === "email"
              ? String(body.value).trim().toLowerCase()
              : String(body.value).trim();
          if (!value) {
            return Response.json({ ok: false, error: "Pusta wartość bana." }, { status: 400 });
          }
          await admin.from("bans").upsert(
            {
              kind,
              value,
              reason: (body.reason ?? "").slice(0, 200) || null,
            },
            { onConflict: "kind,value" },
          );
        }

        if (body.action === "unban" && body.kind && body.value) {
          const kind = body.kind === "email" ? "email" : "visitor";
          await admin
            .from("bans")
            .delete()
            .eq("kind", kind)
            .eq("value", String(body.value).trim());
        }

        const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

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
          .limit(30);

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
          .limit(8000);

        const uniqueVisitors7 = new Set(
          (visits7rows ?? []).map((v) => v.visitor_id).filter(Boolean),
        ).size;

        const { data: pathRows } = await admin
          .from("visits")
          .select("path")
          .gte("created_at", since30)
          .limit(4000);

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
          .select("path, created_at, referrer, visitor_id")
          .order("created_at", { ascending: false })
          .limit(30);

        // Wykres dzienny — 14 dni
        const { data: dailyRows } = await admin
          .from("visits")
          .select("created_at")
          .gte("created_at", since14)
          .limit(8000);

        const dayMap = new Map<string, number>();
        for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setHours(12, 0, 0, 0);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          dayMap.set(key, 0);
        }
        for (const row of dailyRows ?? []) {
          const key = String(row.created_at).slice(0, 10);
          if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
        }
        const dailyVisits = [...dayMap.entries()].map(([date, count]) => ({ date, count }));

        const { data: banRows } = await admin
          .from("bans")
          .select("kind, value, reason, created_at")
          .order("created_at", { ascending: false })
          .limit(50);

        const maskEmail = (email: string) => {
          const [local, domain] = email.split("@");
          if (!domain) return "***";
          return `${local.slice(0, Math.min(2, local.length))}***@${domain}`;
        };

        const recent = (recentRows ?? []).map((r) => ({
          email: maskEmail(r.email),
          emailRaw: r.email,
          displayName: r.display_name || "—",
          plus: Boolean(r.plus),
          createdAt: r.created_at,
        }));

        const recentVisits = (recentVisitRows ?? []).map((v) => ({
          path: v.path || "/",
          createdAt: v.created_at,
          referrer: v.referrer || null,
          visitorId: v.visitor_id || "",
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
          dailyVisits,
          bans: banRows ?? [],
        });
      },
    },
  },
});
