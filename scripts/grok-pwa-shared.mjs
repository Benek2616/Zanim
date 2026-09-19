/**
 * Shared helpers for Grok PWA chrome (simplified for build).
 */
export const DEFAULT_APP_NAME = "Zanim";
export const OG_SERVICE_URL_DEFAULT = "https://og.grok.me";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function acceptsHtml() {
  return true;
}

export function isDocumentPath(path) {
  return path === "/" || path.endsWith(".html") || !path.includes(".");
}

export function isInstallQuery(url) {
  return typeof url === "string" && url.includes("install=1");
}

export function snapshotOgIdentity() {
  return {
    title: "Zanim",
    description: "Poczekalnia zakupów",
    color: "F3EFE6",
  };
}

export function renderWebManifest(identity) {
  return JSON.stringify({
    name: identity?.title || DEFAULT_APP_NAME,
    short_name: identity?.title || DEFAULT_APP_NAME,
    start_url: "/",
    display: "standalone",
    background_color: "#" + (identity?.color || "F3EFE6"),
    theme_color: "#" + (identity?.color || "F3EFE6"),
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-1024.png", sizes: "1024x1024", type: "image/png" },
    ],
  });
}

export function renderInstallPageHtml(identity) {
  const title = escapeHtml(identity?.title || DEFAULT_APP_NAME);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} — Instalacja</title></head><body><h1>${title}</h1><p>Dodaj do ekranu głównego.</p></body></html>`;
}

export function injectGrokPwaHead(html) {
  return html;
}

export function createHeadInjector() {
  return {
    write() { return []; },
    flush() { return []; },
  };
}
