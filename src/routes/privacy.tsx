import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";

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
  const [lang, setLang] = useState<Lang>("en");
  const L = t[lang];
  useEffect(() => {
    const stored = localStorage.getItem("aas_lang");
    setLang(stored === "de" || stored === "en" ? stored : navigator.language.startsWith("de") ? "de" : "en");
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return (
    <main className="min-h-screen bg-background px-6 py-8 md:px-16 md:py-12">
      <header className="flex items-center justify-between gap-4">
        <Link to="/" className="font-mono text-xs uppercase text-muted-foreground hover:text-foreground">← {L.title}</Link>
        <div className="flex gap-3">
          {(["de", "en"] as const).map((language) => <Button key={language} variant="ghost" size="sm" onClick={() => { setLang(language); localStorage.setItem("aas_lang", language); }} className={`px-0 font-mono uppercase ${language === lang ? "underline underline-offset-4" : "text-muted-foreground"}`}>{language}</Button>)}
        </div>
      </header>
      <article className="mt-16 max-w-2xl space-y-6 text-base leading-relaxed md:mt-20 md:text-lg">
        <h1 className="break-words font-serif text-4xl font-light uppercase md:text-5xl">{L.privacy}</h1>
        <p>{L.privacyIntro}</p>
        <p>{L.privacyUse}</p>
        <p>{L.privacyStored}</p>
        <ul className="list-disc space-y-1 pl-6">
          {L.privacyFields.map((field) => <li key={field}>{field}</li>)}
        </ul>
        <p>{L.privacyAnonymous}</p>
      </article>
    </main>
  );
}
