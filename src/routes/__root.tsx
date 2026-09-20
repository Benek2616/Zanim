import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Zanim — poczekalnia zakupów" },
      {
        name: "description",
        content: "Odczekaj 48 godzin, zanim wydasz pieniądze. Zanim — poczekalnia zakupów.",
      },
      { name: "theme-color", content: "#f4efe6" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Zanim" },
      { name: "application-name", content: "Zanim" },
      { name: "format-detection", content: "telephone=no" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap",
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icon-192.svg" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="pl">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppShell>
          <Outlet />
        </AppShell>
        <Scripts />
      </body>
    </html>
  );
}
