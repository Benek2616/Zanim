/** @typedef {import("vite").Plugin} Plugin */

/**
 * Dev-only middleware that exposes /__app-env for scripts/check-auth-invariant.mjs
 * and the live-preview auth checks.
 */
export function appEnvPlugin() {
  return {
    name: "app-builder:app-env",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?", 1)[0] === "/__app-env") {
          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify({
              authEnabled: process.env.VITE_AUTH_ENABLED !== "false",
              nodeEnv: process.env.NODE_ENV ?? "development",
            }),
          );
          return;
        }
        next();
      });
    },
  };
}
