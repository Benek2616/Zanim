import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", margin: 0, fontWeight: 600 }}>Zanim</h1>
      <p style={{ maxWidth: "28rem", color: "#4a4a4a", margin: 0, lineHeight: 1.5 }}>
        Poczekalnia zakupów. Odczekaj 48 godzin, zanim wydasz pieniądze.
      </p>
    </main>
  );
}
