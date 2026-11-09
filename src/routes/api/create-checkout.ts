import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

export const Route = createFileRoute("/api/create-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_SECRET_KEY;
        const appUrl = process.env.VITE_APP_URL || "https://zanim.com.pl";
        const priceMonth = process.env.STRIPE_PRICE_PLUS_MONTH;
        const priceYear = process.env.STRIPE_PRICE_PLUS_YEAR;

        if (!secret) {
          return Response.json({ ok: false, error: "Stripe nie skonfigurowany." }, { status: 500 });
        }

        let plan: "month" | "year" = "month";
        try {
          const body = (await request.json()) as { plan?: string };
          if (body?.plan === "year") plan = "year";
        } catch {
          /* default month */
        }

        const priceId = plan === "year" ? priceYear : priceMonth;
        if (!priceId) {
          return Response.json({ ok: false, error: "Brak Price ID." }, { status: 500 });
        }

        const stripe = new Stripe(secret, { apiVersion: "2024-11-20.acacia" });

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${appUrl}/cennik?success=1`,
          cancel_url: `${appUrl}/cennik?canceled=1`,
          allow_promotion_codes: true,
        });

        return Response.json({ ok: true, url: session.url });
      },
    },
  },
});
