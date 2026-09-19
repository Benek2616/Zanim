/**
 * Dev/preview (Vite) half of the platform PWA chrome: serves the ?install=1
 * tutorial and the per-app manifest, and injects missing PWA head tags into
 * app documents. The deployed-app half lives in server/middleware/grok-pwa.ts;
 * both share scripts/grok-pwa-shared.mjs.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  acceptsHtml,
  createHeadInjector,
  injectGrokPwaHead,
  isDocumentPath,
  isInstallQuery,
  renderInstallPageHtml,
  renderWebManifest,
  snapshotOgIdentity,
} from "./grok-pwa-shared.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @returns {import("vite").Plugin} */
export function grokPwaPlugin() {
  return {
    name: "grok-pwa",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = req.url ?? "/";
          const pathOnly = url.split("?", 1)[0] ?? "/";

          if (pathOnly === "/__grok/manifest.webmanifest") {
            const identity = snapshotOgIdentity();
            res.setHeader("content-type", "application/manifest+json");
            res.end(renderWebManifest(identity));
            return;
          }

          if (isInstallQuery(url) && isDocumentPath(pathOnly)) {
            const identity = snapshotOgIdentity();
            res.setHeader("content-type", "text/html; charset=utf-8");
            res.end(renderInstallPageHtml(identity));
            return;
          }

          next();
        } catch (err) {
          next(err);
        }
      });
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (!acceptsHtml(ctx.server?.config)) return html;
        return injectGrokPwaHead(html, snapshotOgIdentity());
      },
    },
  };
}
