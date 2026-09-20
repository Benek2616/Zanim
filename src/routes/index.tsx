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
        background: "#f3efe6",
      }}
    >
      <h1 style={{ fontSize: "2rem", margin: 0 }}>Zanim</h1>
      <p style={{ maxWidth: "28rem", color: "#4a4a4a", margin: 0 }}>
        Poczekalnia zakupów. Odczekaj 48 godzin, zanim wydasz pieniądze.
      </p>
    </main>
  );
}
