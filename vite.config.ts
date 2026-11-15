import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  server: { host: "0.0.0.0", port: 8080 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      // Vercel Cron → /api/cron/notifications (czas UTC). Plan Hobby: maks. raz dziennie
      // (09:00 UTC ≈ 10:00 w Polsce zimą). Na Pro można "0 * * * *" — patrz WDROZENIE-POWIADOMIEN.md.
      vercel: { config: { crons: [{ path: "/api/cron/notifications", schedule: "0 9 * * *" }] } },
    }),
    viteReact(),
  ],
});
