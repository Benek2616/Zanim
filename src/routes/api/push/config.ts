import { createFileRoute } from "@tanstack/react-router";

/** Publiczny klucz VAPID dla przeglądarki (klucz prywatny nigdy nie opuszcza serwera). */
export const Route = createFileRoute("/api/push/config")({
  server: {
    handlers: {
      GET: async () => {
        const s = await import("@/lib/push/server");
        const publicKey = s.vapidPublicKey();
        const configured = Boolean(publicKey && process.env.VAPID_PRIVATE_KEY && s.adminClient());
        return s.json({ ok: true, configured, publicKey: configured ? publicKey : null });
      },
    },
  },
});
