import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Zanim" },
      {
        name: "description",
        content: "Zanim — poczekalnia zakupów. Odczekaj 48 godzin, zanim wydasz pieniądze.",
      },
      { name: "theme-color", content: "#f3efe6" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
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
