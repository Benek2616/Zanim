import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 * Raw body + Stripe-Signature
 */
export default defineEventHandler(async (event) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    throw createError({ statusCode: 503, statusMessage: "Webhook nie skonfigurowany." });
  }

  const stripe = new Stripe(stripeKey);
  const raw = await readRawBody(event);
  const sig = getHeader(event, "stripe-signature");
  if (!raw || !sig) {
    throw createError({ statusCode: 400, statusMessage: "Brak body lub sygnatury." });
  }

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch {
    throw createError({ statusCode: 400, statusMessage: "Nieprawidłowa sygnatura." });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  async function setPlus(userId: string, opts: {
    plan: string;
    plus: boolean;
    periodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  }) {
    await admin
      .from("profiles")
      .update({
        plan: opts.plan,
        plus: opts.plus,
        period_end: opts.periodEnd,
        cancel_at_period_end: opts.cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;
    const plan = session.metadata?.plan ?? "plus_month";
    if (userId && session.mode === "subscription" && session.subscription) {
      const sub = await stripe.subscriptions.retrieve(String(session.subscription));
      await setPlus(userId, {
        plan,
        plus: sub.status === "active" || sub.status === "trialing",
        periodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
    }
  }

  if (
    stripeEvent.type === "customer.subscription.updated" ||
    stripeEvent.type === "customer.subscription.deleted"
  ) {
    const sub = stripeEvent.data.object as Stripe.Subscription;
    const userId = sub.metadata?.supabase_user_id;
    if (userId) {
      const active = sub.status === "active" || sub.status === "trialing";
      const plan = sub.metadata?.plan ?? "plus_month";
      await setPlus(userId, {
        plan: active ? plan : "free",
        plus: active,
        periodEnd: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
    }
  }

  return { received: true };
});
