import { createClient } from "@supabase/supabase-js";

/** POST /api/track-signup — rejestruje lokalne założenie konta (Plus) */
export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    // Brak konfiguracji — cicho ignoruj (app działa lokalnie)
    return { ok: true, tracked: false };
  }

  const body = await readBody<{ email?: string; displayName?: string }>(event).catch(() => null);
  const email = (body?.email ?? "").trim().toLowerCase();
  const displayName = (body?.displayName ?? "").trim().slice(0, 80);

  if (!email || !email.includes("@") || email.length > 200) {
    throw createError({ statusCode: 400, statusMessage: "Nieprawidłowy e-mail." });
  }

  const ua = getHeader(event, "user-agent")?.slice(0, 300) ?? null;

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
    // Nie psuj UX użytkownika
    return { ok: true, tracked: false };
  }

  return { ok: true, tracked: true };
});
