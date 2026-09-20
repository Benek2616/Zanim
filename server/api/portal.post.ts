import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

/** POST /api/portal — Stripe Customer Portal */
export default defineEventHandler(async (event) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.VITE_APP_URL ?? "https://zanim.com.pl";

  if (!stripeKey || !supabaseUrl || !serviceKey) {
    throw createError({ statusCode: 503, statusMessage: "Brak konfiguracji." });
  }

  const auth = getHeader(event, "authorization");
  const token = auth?.replace(/^Bearer\s+/i, "");
  if (!token) throw createError({ statusCode: 401, statusMessage: "Brak sesji." });

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData.user) {
    throw createError({ statusCode: 401, statusMessage: "Sesja nieprawidłowa." });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    throw createError({ statusCode: 400, statusMessage: "Brak klienta Stripe — najpierw kup plan." });
  }

  const stripe = new Stripe(stripeKey);
  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/cennik`,
  });

  return { url: portal.url };
});
