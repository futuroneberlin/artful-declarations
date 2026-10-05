import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/glossary")({
  head: () => ({
    meta: [
      { title: "Living Glossary — Art as Stance" },
      { name: "description", content: "A living glossary formed from collective responses." },
      { property: "og:title", content: "Living Glossary — Art as Stance" },
      { property: "og:description", content: "A glossary that grows from every contribution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <main className="flex min-h-screen flex-col justify-center bg-background px-6 md:px-16">
      <h1 className="font-serif text-5xl md:text-7xl">The glossary is forming.</h1>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Das Glossar entsteht.</p>
      <Link to="/" search={{ loc: undefined }} className="mt-12 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">← Return</Link>
    </main>
  ),
});
