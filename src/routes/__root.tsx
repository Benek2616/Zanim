import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

const APP_NAME = "Zanim";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Zanim — poczekalnia zakupów. Odczekaj 48 godzin, zanim wydasz pieniądze.",
      },
      { name: "theme-color", content: "#f3efe6" },
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
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
