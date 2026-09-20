import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Zanim" },
      {
        name: "description",
        content:
          "Zanim — poczekalnia zakupów. Odczekaj 48 godzin, zanim wydasz pieniądze.",
      },
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
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#f3efe6",
          color: "#1a1916",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
