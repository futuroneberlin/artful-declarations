import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { t, type Lang } from "@/lib/i18n";

type PublicResponse = {
  id: string | null;
  art_is: string | null;
  acted_through_art: string | null;
  created_at: string | null;
  language: string | null;
};

export const Route = createFileRoute("/glossary")({
  validateSearch: (search: Record<string, unknown>): { new?: string } =>
    typeof search["new"] === "string" ? { new: search["new"].slice(0, 50) } : {},
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
  component: Glossary,
});

function Glossary() {
  const { new: newId } = Route.useSearch();
  const [responses, setResponses] = useState<PublicResponse[]>([]);
  const [newResponse, setNewResponse] = useState<PublicResponse | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [showArrival, setShowArrival] = useState(Boolean(newId));
  const [highlightOwn, setHighlightOwn] = useState(Boolean(newId));

  useEffect(() => {
    const stored = localStorage.getItem("aas_lang");
    if (stored === "de" || stored === "en") setLang(stored);
    else if (navigator.language?.toLowerCase().startsWith("de")) setLang("de");
  }, []);

  useEffect(() => {
    if (!newId) return;
    const stored = sessionStorage.getItem(`aas_response_${newId}`);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as PublicResponse;
      if (parsed.id === newId) setNewResponse(parsed);
    } catch {
      sessionStorage.removeItem(`aas_response_${newId}`);
    }
  }, [newId]);

  useEffect(() => {
    let active = true;
    supabase
      .from("public_responses")
      .select("id, art_is, acted_through_art, created_at, language")
      .order("created_at", { ascending: false })
      .limit(80)
      .then(({ data }) => { if (active) setResponses(data ?? []); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!newId) return;
    const timer = window.setTimeout(() => setShowArrival(false), 4000);
    const clearHighlight = () => setHighlightOwn(false);
    window.addEventListener("pointerdown", clearHighlight, { once: true });
    window.addEventListener("keydown", clearHighlight, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", clearHighlight);
      window.removeEventListener("keydown", clearHighlight);
    };
  }, [newId]);

  const displayedResponses = useMemo(() => {
    if (!newResponse || responses.some((response) => response.id === newResponse.id)) return responses;
    return [newResponse, ...responses];
  }, [newResponse, responses]);
  const own = displayedResponses.find((response) => response.id === newId);
  const field = useMemo(() => displayedResponses.flatMap((response) => {
    const lines: Array<{ text: string; id: string | null }> = [];
    if (response.art_is) lines.push({ text: response.art_is, id: response.id });
    if (response.acted_through_art) lines.push({ text: response.acted_through_art, id: response.id });
    return lines;
  }), [displayedResponses]);

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground md:px-12 md:py-10">
      <header className="flex min-h-6 items-baseline justify-between font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>{lang === "de" ? "Lebendiges Glossar" : "Living glossary"}</span>
        <Link to="/" className="hover:text-foreground">{lang === "de" ? "Beitragen" : "Contribute"} →</Link>
      </header>

      <div className="mt-6 min-h-6">
        {showArrival && <p className="fade-up font-serif text-xl italic md:text-2xl">{t[lang].success}</p>}
      </div>

      <div className="mt-10 grid min-h-[70vh] gap-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
        <section className="relative flex min-h-[55vh] items-center justify-center overflow-hidden border-y border-foreground/10 px-4 py-16" aria-label={lang === "de" ? "Kollektives Feld" : "Collective field"}>
          {field.length === 0 ? (
            <p className="font-serif text-3xl text-muted-foreground md:text-5xl">{lang === "de" ? "Das Feld wartet." : "The field is waiting."}</p>
          ) : (
            <div className="flex max-w-4xl flex-wrap items-center justify-center gap-x-7 gap-y-5 text-center">
              {field.map((item, index) => {
                const isOwn = highlightOwn && item.id === newId;
                return (
                  <span key={`${item.id}-${index}`} className={`transition-all duration-700 ${isOwn ? "field-highlight relative z-10 font-serif text-4xl text-foreground md:text-6xl" : "font-serif text-xl text-muted-foreground/60 md:text-3xl"}`}>
                    {item.text}
                  </span>
                );
              })}
            </div>
          )}
        </section>

        <aside className="border-t border-foreground/20 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{lang === "de" ? "Beiträge" : "Contributions"}</h1>
          <ol className="mt-8 space-y-8">
            {displayedResponses.map((response) => {
              const isOwn = highlightOwn && response.id === newId;
              return (
                <li key={response.id ?? response.created_at} className={`border-l pl-4 transition-all duration-700 ${isOwn ? "border-foreground text-foreground" : "border-foreground/15 text-muted-foreground"}`}>
                  {response.art_is && <p className="font-serif text-xl"><span className="text-sm italic opacity-60">{lang === "de" ? "Kunst ist " : "Art is "}</span>{response.art_is}</p>}
                  {response.acted_through_art && <p className="mt-2 font-serif text-xl"><span className="text-sm italic opacity-60">{lang === "de" ? "Gehandelt durch " : "Acted through "}</span>{response.acted_through_art}</p>}
                </li>
              );
            })}
          </ol>
          {own && highlightOwn && <p className="sr-only" aria-live="polite">{t[lang].success}</p>}
        </aside>
      </div>
    </main>
  );
}