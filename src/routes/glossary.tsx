import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { t, type Lang } from "@/lib/i18n";
import { LivingField, type FieldNode } from "@/components/LivingField";

type PublicResponse = {
  id: string | null;
  art_is: string | null;
  acted_through_art: string | null;
  created_at: string | null;
  language: string | null;
};
type Theme = { key: string; label_de: string; label_en: string; sort_order: number };
type Reference = {
  id: string; title: string; author: string | null; year: string | null;
  url: string | null; category: string; note: string | null; display_order: number;
};

const OPEN = "__open";

export const Route = createFileRoute("/glossary")({
  validateSearch: (search: Record<string, unknown>): { new?: string } =>
    typeof search["new"] === "string" ? { new: search["new"].slice(0, 50) } : {},
  head: () => ({
    meta: [
      { title: "Living Glossary — Art as Stance" },
      { name: "description", content: "Theory, a living field of contributions, and their themes — a glossary that grows." },
      { property: "og:title", content: "Living Glossary — Art as Stance" },
      { property: "og:description", content: "A glossary that grows from every contribution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Glossary,
});

function mockData(n: number): { responses: PublicResponse[]; links: { response_id: string; theme_key: string }[] } {
  const keys = ["relationship", "nature", "making", "music", "everyday", "freedom", "dialogue", "politics", "perception", "body"];
  const responses: PublicResponse[] = [];
  const links: { response_id: string; theme_key: string }[] = [];
  for (let i = 0; i < n; i++) {
    const id = `mock-${n}-${i}`;
    const r = Math.random();
    responses.push({
      id,
      art_is: r < 0.7 ? "a mock thought ".repeat(1 + Math.floor(Math.random() * 4)).trim() : null,
      acted_through_art: r > 0.4 ? "doing something quietly".slice(0, 6 + Math.floor(Math.random() * 18)) : null,
      created_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
      language: "en",
    });
    if (Math.random() > 0.2) links.push({ response_id: id, theme_key: keys[Math.floor(Math.random() * keys.length)] });
    if (Math.random() > 0.8) links.push({ response_id: id, theme_key: keys[Math.floor(Math.random() * keys.length)] });
  }
  return { responses, links };
}

function Glossary() {
  const { new: newId } = Route.useSearch();
  const [lang, setLang] = useState<Lang>("en");
  const [responses, setResponses] = useState<PublicResponse[]>([]);
  const [links, setLinks] = useState<{ response_id: string; theme_key: string }[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [refs, setRefs] = useState<Reference[]>([]);
  const [newResponse, setNewResponse] = useState<PublicResponse | null>(null);
  const [showArrival, setShowArrival] = useState(Boolean(newId));
  const [highlightOwn, setHighlightOwn] = useState(Boolean(newId));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [openThemes, setOpenThemes] = useState<Set<string>>(new Set());
  const [openRefs, setOpenRefs] = useState<Set<string>>(new Set());
  const [mock, setMock] = useState<ReturnType<typeof mockData> | null>(null);
  const L = t[lang];

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

  const loadField = useCallback(async () => {
    const [r, l] = await Promise.all([
      supabase.from("public_responses").select("id, art_is, acted_through_art, created_at, language").order("created_at", { ascending: false }).limit(500),
      supabase.from("public_response_themes").select("response_id, theme_key").limit(2000),
    ]);
    if (r.data) setResponses(r.data);
    if (l.data) setLinks(l.data.filter((x): x is { response_id: string; theme_key: string } => Boolean(x.response_id && x.theme_key)));
  }, []);

  useEffect(() => {
    supabase.from("themes").select("key, label_de, label_en, sort_order").order("sort_order").then(({ data }) => setThemes(data ?? []));
    supabase.from("references").select("id, title, author, year, url, category, note, display_order").order("display_order").then(({ data }) => setRefs(data ?? []));
    loadField();
    const poll = window.setInterval(loadField, 10000);
    // Raw responses are not publicly readable, so live updates travel as an anonymous "ping" on a broadcast channel.
    const channel = supabase.channel("field-pings").on("broadcast", { event: "new" }, () => loadField()).subscribe((status) => {
      if (status === "SUBSCRIBED" && newId) channel.send({ type: "broadcast", event: "new", payload: {} });
    });
    return () => { window.clearInterval(poll); supabase.removeChannel(channel); };
  }, [loadField, newId]);

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

  const allResponses = useMemo(() => {
    if (mock) return mock.responses;
    if (!newResponse || responses.some((r) => r.id === newResponse.id)) return responses;
    return [newResponse, ...responses];
  }, [mock, newResponse, responses]);
  const allLinks = mock ? mock.links : links;

  const themesByResponse = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const l of allLinks) m.set(l.response_id, [...(m.get(l.response_id) ?? []), l.theme_key]);
    return m;
  }, [allLinks]);

  const nodes: FieldNode[] = useMemo(() => allResponses.filter((r) => r.id).map((r) => ({
    id: r.id!, art: r.art_is, act: r.acted_through_art, createdAt: r.created_at ?? new Date().toISOString(),
    themes: themesByResponse.get(r.id!) ?? [],
  })), [allResponses, themesByResponse]);

  const themeLabels = useMemo(() => Object.fromEntries(themes.map((th) => [th.key, lang === "de" ? th.label_de : th.label_en])), [themes, lang]);

  const groups = useMemo(() => {
    const m = new Map<string, PublicResponse[]>();
    for (const r of allResponses) {
      const keys = themesByResponse.get(r.id ?? "") ?? [OPEN];
      for (const k of keys) m.set(k, [...(m.get(k) ?? []), r]);
    }
    for (const list of m.values()) list.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return [...m.entries()].sort((a, b) => (a[0] === OPEN ? 1 : b[0] === OPEN ? -1 : b[1].length - a[1].length));
  }, [allResponses, themesByResponse]);

  const refGroups = useMemo(() => {
    const m = new Map<string, Reference[]>();
    for (const r of refs) m.set(r.category, [...(m.get(r.category) ?? []), r]);
    return [...m.entries()];
  }, [refs]);

  useEffect(() => {
    if (!newId) return;
    const key = themesByResponse.get(newId)?.[0] ?? OPEN;
    setOpenThemes((s) => (s.has(key) ? s : new Set(s).add(key)));
  }, [newId, themesByResponse]);

  const ownId = highlightOwn ? newId ?? null : null;
  const toggle = (set: Set<string>, key: string) => { const n = new Set(set); n.has(key) ? n.delete(key) : n.add(key); return n; };

  const selectFromField = (id: string | null) => {
    setSelectedId(id);
    if (!id) return;
    const key = themesByResponse.get(id)?.[0] ?? OPEN;
    setOpenThemes((s) => new Set(s).add(key));
    window.setTimeout(() => document.getElementById(`c-${key}-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 50);
  };

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground md:px-10 md:py-10">
      <header className="flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <h1>{L.glossaryTitle}</h1>
        <div className="flex gap-5">
          {import.meta.env.DEV && (
            <span className="flex gap-2 normal-case tracking-normal">
              {[10, 100, 500].map((n) => <button key={n} onClick={() => setMock(mockData(n))} className="hover:text-foreground">mock {n}</button>)}
              {mock && <button onClick={() => setMock(null)} className="hover:text-foreground">real</button>}
            </span>
          )}
          <Link to="/" className="hover:text-foreground">{L.submit} →</Link>
        </div>
      </header>

      <div className="mt-5 min-h-7">
        {showArrival && <p className="fade-up font-serif text-xl italic md:text-2xl" aria-live="polite">{L.success}</p>}
      </div>

      <div className="mt-6 flex flex-col gap-12 lg:grid lg:grid-cols-[1fr_2fr_1fr] lg:gap-10">
        {/* Centre */}
        <section className="order-1 lg:order-2" aria-label={L.fieldTitle}>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{L.fieldTitle}</h2>
          <div className="relative mt-4 h-[62vh] min-h-[360px] lg:sticky lg:top-6 lg:h-[78vh]">
            {nodes.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center font-serif text-3xl text-muted-foreground md:text-5xl">{L.fieldWaiting}</p>
            )}
            <LivingField
              nodes={nodes}
              themeLabels={themeLabels}
              openLabel={L.open}
              promptLabels={{ art: L.artIs, act: L.actedShort }}
              ownId={ownId}
              selectedId={selectedId}
              selectedTheme={selectedTheme}
              onSelect={selectFromField}
            />
          </div>
          <p className="mt-3 flex gap-5 font-mono text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2"><i className="inline-block h-2 w-2 rounded-full bg-[var(--field-art)]" />{L.artIs}</span>
            <span className="flex items-center gap-2"><i className="inline-block h-2 w-2 rounded-full bg-[var(--field-act)]" />{L.actedShort}</span>
          </p>
        </section>

        {/* Theory */}
        <aside className="order-2 lg:order-1" aria-label={L.theoryTitle}>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{L.theoryTitle}</h2>
          <div className="mt-6 space-y-8">
            {refGroups.map(([cat, list]) => (
              <div key={cat}>
                <h3 className="font-serif text-lg italic text-muted-foreground">{cat}</h3>
                <ul className="mt-2 divide-y divide-foreground/10 border-t border-foreground/10">
                  {list.map((r) => {
                    const open = openRefs.has(r.id);
                    return (
                      <li key={r.id}>
                        <button onClick={() => setOpenRefs((s) => toggle(s, r.id))} aria-expanded={open} className="w-full py-3 text-left">
                          <span className="font-serif text-lg leading-snug">{r.title}</span>
                          {(r.author || r.year) && <span className="block font-mono text-[11px] text-muted-foreground">{[r.author, r.year].filter(Boolean).join(", ")}</span>}
                        </button>
                        {open && (
                          <div className="fade-up pb-4 text-sm leading-relaxed text-muted-foreground">
                            {r.note && <p>{r.note}</p>}
                            {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block underline underline-offset-4 hover:text-foreground">{L.readMore} ↗</a>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Contributions */}
        <aside className="order-3" aria-label={L.contributionsTitle}>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{L.contributionsTitle}</h2>
          <div className="mt-6 divide-y divide-foreground/10 border-t border-foreground/10">
            {groups.map(([key, list]) => {
              const open = openThemes.has(key);
              const active = selectedTheme === key;
              return (
                <div key={key}>
                  <button
                    onClick={() => { setOpenThemes((s) => toggle(s, key)); setSelectedTheme(active ? null : key); }}
                    aria-expanded={open}
                    className={`flex w-full items-baseline justify-between py-3 text-left transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <span className={`font-serif text-lg ${key === OPEN ? "italic" : ""}`}>{key === OPEN ? L.open : themeLabels[key] ?? key}</span>
                    <span className="font-mono text-xs">{list.length}</span>
                  </button>
                  {open && (
                    <ol className="space-y-5 pb-5">
                      {list.map((r) => {
                        const hl = r.id === selectedId || r.id === ownId;
                        return (
                          <li key={r.id ?? r.created_at} id={`c-${key}-${r.id}`}>
                            <button onClick={() => setSelectedId(r.id === selectedId ? null : r.id)} className={`w-full border-l pl-3 text-left transition-all duration-500 ${hl ? "border-foreground text-foreground" : "border-foreground/15 text-muted-foreground hover:text-foreground"}`}>
                              {r.art_is && <><span className="block text-xs italic opacity-60">{L.artIs}</span><span className="font-serif text-lg">{r.art_is}</span></>}
                              {r.acted_through_art && <><span className="mt-1 block text-xs italic opacity-60">{L.acted}</span><span className="font-serif text-lg">{r.acted_through_art}</span></>}
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}
