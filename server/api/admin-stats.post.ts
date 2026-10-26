import { createClient } from "@supabase/supabase-js";

/** POST /api/admin-stats — statystyki tylko z poprawnym ADMIN_PASSWORD */
export default defineEventHandler(async (event) => {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 6) {
    throw createError({
      statusCode: 503,
      statusMessage: "ADMIN_PASSWORD nie jest ustawione (min. 6 znaków).",
    });
  }

  const body = await readBody<{ password?: string }>(event).catch(() => null);
  const password = body?.password ?? "";

  if (password !== expected) {
    // Delikatne opóźnienie przeciw brute-force
    await new Promise((r) => setTimeout(r, 800));
    throw createError({ statusCode: 401, statusMessage: "Złe hasło." });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return {
      ok: true,
      configured: false,
      total: 0,
      plus: 0,
      last7: 0,
      last30: 0,
      recent: [],
      message: "Brak VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — tracking wyłączony.",
    };
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { count: total, error: e1 } = await admin
    .from("signups")
    .select("*", { count: "exact", head: true });

  const { count: plus, error: e2 } = await admin
    .from("signups")
    .select("*", { count: "exact", head: true })
    .eq("plus", true);

  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { count: last7, error: e3 } = await admin
    .from("signups")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since7);

  const { count: last30, error: e4 } = await admin
    .from("signups")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since30);

  const { data: recentRows, error: e5 } = await admin
    .from("signups")
    .select("email, display_name, plus, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (e1 || e2 || e3 || e4 || e5) {
    console.error("[admin-stats]", e1 || e2 || e3 || e4 || e5);
    throw createError({ statusCode: 500, statusMessage: "Błąd odczytu bazy." });
  }

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

  return {
    ok: true,
    configured: true,
    total: total ?? 0,
    plus: plus ?? 0,
    last7: last7 ?? 0,
    last30: last30 ?? 0,
    recent,
  };
});
