import { getSupabase } from "@/lib/supabase";

export async function startCheckout(plan: "plus_month" | "plus_year"): Promise<{ url?: string; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { error: "Brak konfiguracji konta (Supabase)." };

  const { data: sessionData } = await sb.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { error: "Zaloguj się, żeby kupić Plus." };

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan }),
  });

  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) return { error: json.error ?? "Nie udało się rozpocząć płatności." };
  return { url: json.url };
}

export async function openCustomerPortal(): Promise<{ url?: string; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { error: "Brak konfiguracji konta." };

  const { data: sessionData } = await sb.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { error: "Zaloguj się." };

  const res = await fetch("/api/portal", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) return { error: json.error ?? "Nie udało się otworzyć panelu." };
  return { url: json.url };
}
