import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

/**
 * POST /api/checkout
 * Body: { plan: "plus_month" | "plus_year" }
 * Header: Authorization: Bearer <supabase access_token>
 */
export default defineEventHandler(async (event) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.VITE_APP_URL ?? "https://zanim.com.pl";

  if (!stripeKey || !supabaseUrl || !serviceKey) {
    throw createError({
      statusCode: 503,
      statusMessage: "Płatności nie są jeszcze skonfigurowane (brak env).",
    });
  }

  const auth = getHeader(event, "authorization");
  const token = auth?.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Brak sesji." });
  }

  const body = await readBody<{ plan?: string }>(event);
  const plan = body?.plan;
  if (plan !== "plus_month" && plan !== "plus_year") {
    throw createError({ statusCode: 400, statusMessage: "Nieprawidłowy plan." });
  }

  const priceId =
    plan === "plus_month"
      ? process.env.STRIPE_PRICE_PLUS_MONTH
      : process.env.STRIPE_PRICE_PLUS_YEAR;
  if (!priceId) {
    throw createError({ statusCode: 503, statusMessage: "Brak STRIPE_PRICE_* w env." });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) {
    throw createError({ statusCode: 401, statusMessage: "Sesja nieprawidłowa." });
  }
  const user = userData.user;

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .maybeSingle();

  const stripe = new Stripe(stripeKey);

  let customerId = profile?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? profile?.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/cennik?checkout=success`,
    cancel_url: `${appUrl}/cennik?checkout=cancel`,
    metadata: { supabase_user_id: user.id, plan },
    subscription_data: {
      metadata: { supabase_user_id: user.id, plan },
    },
  });

  return { url: session.url };
});
