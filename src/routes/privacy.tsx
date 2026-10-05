import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Art as Stance" },
      { name: "description", content: "What Art as Stance stores, and what it never collects." },
      { property: "og:title", content: "Privacy — Art as Stance" },
      { property: "og:description", content: "Anonymous by design. No personal data is collected." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 md:px-16 md:py-12">
      <Link to="/" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">← Art as Stance</Link>
      <article className="mt-20 max-w-2xl border border-foreground/20 p-6 text-lg leading-relaxed md:p-10">
        <h1 className="font-serif text-5xl font-light uppercase">Privacy</h1>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Placeholder text — to be finalised</p>
        <p>When you contribute, the following is stored:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>your answer(s) to the two sentences</li>
          <li>the time of submission</li>
          <li>a random, anonymous session ID generated in your browser</li>
          <li>the exhibition location (from the QR code)</li>
          <li>the interface language</li>
          <li>your consent</li>
        </ul>
        <p>No names, email addresses, IP addresses or tracking data are collected. No account is required. Data is hosted in the EU.</p>
        <p className="font-serif italic">Datenschutz: Gespeichert werden nur deine Antworten, Zeitpunkt, eine anonyme Sitzungs-ID, Ort, Sprache und Einwilligung. Es werden keine personenbezogenen Daten erhoben.</p>
      </article>
    </main>
  );
}
