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
  source_type?: "live" | "mockup";
  is_mockup?: boolean;
};
type Theme = { key: string; label_de: string; label_en: string; sort_order: number };
type Reference = {
  id: string; title: string; author: string | null; year: string | null;
  url: string | null; category: string; note: string | null; display_order: number;
};

const ONLINE_THEORY_SOURCES = [
  { slug: "Socially_engaged_art", title: "Socially Engaged Art", url: "https://en.wikipedia.org/wiki/Socially_engaged_art" },
  { slug: "Relational_aesthetics", title: "Relational Aesthetics", url: "https://en.wikipedia.org/wiki/Relational_aesthetics" },
  { slug: "Participatory_art", title: "Participatory Art", url: "https://en.wikipedia.org/wiki/Participatory_art" },
  { slug: "Artivism", title: "Artivism", url: "https://en.wikipedia.org/wiki/Artivism" },
  { slug: "Community_arts", title: "Community Arts", url: "https://en.wikipedia.org/wiki/Community_arts" },
] as const;

const ONLINE_RESEARCH_PORTALS = [
  {
    id: "google-scholar-socially-engaged-art",
    title: "Google Scholar — socially engaged art",
    author: "Google Scholar",
    year: null,
    url: "https://scholar.google.com/scholar?q=socially+engaged+art+social+practice",
    category: "Research platforms",
    note: "Search gateway for academic articles, books and peer-reviewed writing on socially engaged art, participatory practice and collective cultural production.",
    display_order: 0,
  },
  {
    id: "jstor-social-practice-art",
    title: "JSTOR — art, participation and social practice",
    author: "JSTOR",
    year: null,
    url: "https://www.jstor.org/action/doBasicSearch?Query=socially+engaged+art+social+practice",
    category: "Research platforms",
    note: "Scholarly archive for journals and books tracing debates on art, community, public space and social relations.",
    display_order: 1,
  },
  {
    id: "researchgate-art-social-practice",
    title: "ResearchGate — art and social practice",
    author: "ResearchGate",
    year: null,
    url: "https://www.researchgate.net/search/publication?q=socially%20engaged%20art%20social%20practice",
    category: "Research platforms",
    note: "Research output index where scholars and practitioners discuss socially engaged art, public art and collective making.",
    display_order: 2,
  },
  {
    id: "taylor-francis-social-practice-art",
    title: "Taylor & Francis — social practice and art research",
    author: "Taylor & Francis",
    year: null,
    url: "https://www.tandfonline.com/search?query=social%20practice%20art",
    category: "Research platforms",
    note: "Publisher search index for writing on art, activism, urban life, cultural theory and social transformation.",
    display_order: 3,
  },
  {
    id: "oxford-art-social-practice",
    title: "Oxford Research Encyclopedia of Art",
    author: "Oxford University Press",
    year: null,
    url: "https://oxfordre.com/art/search?btog=chap&f_0=all",
    category: "Research platforms",
    note: "Scholarly reference database for art history, theory and cultural analysis, including participation and social relation.",
    display_order: 4,
  },
  {
    id: "e-flux-artist-essay-network",
    title: "e-flux — essays on social practice and public art",
    author: "e-flux",
    year: null,
    url: "https://www.e-flux.com/search/?q=social%20practice%20art",
    category: "Research platforms",
    note: "Critical essays and discussion on contemporary art, public space and artistic practices shaped by social contexts.",
    display_order: 5,
  },
  {
    id: "caa-art-in-public-space",
    title: "CAA — Art in public space and social practice",
    author: "College Art Association",
    year: null,
    url: "https://www.collegeart.org/search?query=public%20art%20social%20practice",
    category: "Research platforms",
    note: "Professional association portal for art-historical and critical work on public art, participation and social context.",
    display_order: 6,
  },
  {
    id: "project-muse-art-and-social-practice",
    title: "Project MUSE — art and social context",
    author: "Project MUSE",
    year: null,
    url: "https://muse.jhu.edu/searchresults?query=art%20social%20practice",
    category: "Research platforms",
    note: "Academic database for humanities and arts scholarship linking art, culture, politics and everyday social life.",
    display_order: 7,
  },
  {
    id: "doab-art-social-practice",
    title: "Directory of Open Access Books — art and social practice",
    author: "DOAB",
    year: null,
    url: "https://directory.doabooks.org/search?query=art%20social%20practice",
    category: "Research platforms",
    note: "Open-access book index for research in art, culture, public practice and social transformation.",
    display_order: 8,
  },
  {
    id: "google-books-social-practice-art",
    title: "Google Books — social practice and art",
    author: "Google Books",
    year: null,
    url: "https://books.google.com/books?q=social+practice+art",
    category: "Research platforms",
    note: "Book search index covering publications on public art, community arts, participation and social practice.",
    display_order: 9,
  },
  {
    id: "academia-socially-engaged-art",
    title: "Academia.edu — socially engaged art",
    author: "Academia.edu",
    year: null,
    url: "https://www.academia.edu/search?q=socially%20engaged%20art",
    category: "Research platforms",
    note: "Platform for academic papers, essays and research writing on socially engaged art and collaborative practice.",
    display_order: 10,
  },
  {
    id: "semantic-scholar-art-social-practice",
    title: "Semantic Scholar — art social practice research",
    author: "Semantic Scholar",
    year: null,
    url: "https://www.semanticscholar.org/search?q=social%20practice%20art",
    category: "Research platforms",
    note: "AI-powered citation and paper discovery for related scholarship on art and social practice.",
    display_order: 11,
  },
] as const;

const STOP_WORDS = new Set([
  "about", "after", "again", "also", "been", "being", "durch", "eine", "einem", "einen", "einer", "eines", "from", "habe", "heute", "into", "kunst", "oder", "that", "their", "there", "these", "this", "today", "through", "über", "und", "with", "wurde", "your",
]);

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
    const created = new Date(Date.now() - Math.random() * 30 * 86400000).toISOString();
    responses.push({
      id,
      art_is: r < 0.7 ? "a mock thought ".repeat(1 + Math.floor(Math.random() * 4)).trim() : null,
      acted_through_art: r > 0.4 ? "doing something quietly".slice(0, 6 + Math.floor(Math.random() * 18)) : null,
      created_at: created,
      language: "en",
      source_type: "mockup",
      is_mockup: true,
    });
    if (Math.random() > 0.2) links.push({ response_id: id, theme_key: keys[Math.floor(Math.random() * keys.length)]! });
    if (Math.random() > 0.8) links.push({ response_id: id, theme_key: keys[Math.floor(Math.random() * keys.length)]! });
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
  const [resourceCursor, setResourceCursor] = useState<number>(6);
  const isDevMode = import.meta.env.DEV;
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

    const liveResponses = (r.data ?? []).map((response) => ({
      ...response,
      source_type: "live",
      is_mockup: false,
    })) as PublicResponse[];

    if (isDevMode && mock) {
      setResponses(liveResponses.concat(mock.responses));
    } else {
      setResponses(liveResponses);
    }

    if (l.data) setLinks(l.data.filter((x): x is { response_id: string; theme_key: string } => Boolean(x.response_id && x.theme_key)));
  }, [isDevMode, mock]);

  const loadMoreReferences = useCallback(() => {
    setResourceCursor((current) => {
      const next = Math.min(current + 3, ONLINE_RESEARCH_PORTALS.length);
      setRefs((existing) => {
        const portalIds = new Set(ONLINE_RESEARCH_PORTALS.map((item) => item.id));
        const keep = existing.filter((item) => !portalIds.has(item.id));
        const nextBatch = ONLINE_RESEARCH_PORTALS.slice(0, next).map((item) => ({ ...item } as Reference));
        return [...nextBatch, ...keep];
      });
      return next;
    });
  }, []);

  useEffect(() => {
    const loadTheorySources = async () => {
      const wikiResults = await Promise.allSettled(
        ONLINE_THEORY_SOURCES.map(async (source, index) => {
          const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(source.slug)}`);
          if (!response.ok) throw new Error(`Failed to load ${source.title}`);
          const data = (await response.json()) as {
            title?: string;
            extract?: string;
            content_urls?: { desktop?: { page?: string } };
            timestamp?: string;
          };
          return {
            id: `wiki-${source.slug}`,
            title: data.title ?? source.title,
            author: "Wikipedia",
            year: data.timestamp ? new Date(data.timestamp).getFullYear().toString() : null,
            url: data.content_urls?.desktop?.page ?? source.url,
            category: "Art & social practice",
            note: data.extract ?? "An online overview of art practices that engage social life, participation and collective action.",
            display_order: index,
          } as Reference;
        }),
      );

      const initialPortalRefs = ONLINE_RESEARCH_PORTALS.slice(0, resourceCursor).map((item) => ({ ...item } as Reference));
      const onlineRefs = [
        ...wikiResults.flatMap((result) => (result.status === "fulfilled" ? [result.value] : [])),
        ...initialPortalRefs,
      ];

      setRefs((current) => {
        const localRefs = current.filter((item) => !item.id.startsWith("wiki-") && !ONLINE_RESEARCH_PORTALS.some((source) => source.id === item.id));
        return [...onlineRefs, ...localRefs];
      });
    };

    supabase.from("themes").select("key, label_de, label_en, sort_order").order("sort_order").then(({ data }) => setThemes(data ?? []));
    supabase.from("references").select("id, title, author, year, url, category, note, display_order").order("display_order").then(({ data }) => {
      const dbRefs = data ?? [];
      setRefs((current) => {
        const onlineRefs = current.filter((item) => item.id.startsWith("wiki-") || ONLINE_RESEARCH_PORTALS.some((source) => source.id === item.id));
        return [...onlineRefs, ...dbRefs];
      });
    });
    loadTheorySources();
    loadField();
    const poll = window.setInterval(loadField, 10000);
    const resourcePoll = window.setInterval(loadMoreReferences, 20000);
    const onInteract = () => loadMoreReferences();
    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("keydown", onInteract);
    // Raw responses are not publicly readable, so live updates travel as an anonymous "ping" on a broadcast channel.
    const channel = supabase.channel("field-pings").on("broadcast", { event: "new" }, () => loadField()).subscribe((status) => {
      if (status === "SUBSCRIBED" && newId) channel.send({ type: "broadcast", event: "new", payload: {} });
    });
    return () => { window.clearInterval(poll); window.clearInterval(resourcePoll); window.removeEventListener("pointerdown", onInteract); window.removeEventListener("keydown", onInteract); supabase.removeChannel(channel); };
  }, [loadField, loadMoreReferences, newId, resourceCursor]);

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
    const liveOnly = responses.filter((response) => !response.is_mockup);
    if (isDevMode && mock) {
      const merged = liveOnly.concat(mock.responses);
      if (!newResponse || merged.some((r) => r.id === newResponse.id)) return merged;
      return [newResponse, ...merged];
    }
    if (!newResponse || liveOnly.some((r) => r.id === newResponse.id)) return liveOnly;
    return [newResponse, ...liveOnly];
  }, [isDevMode, mock, newResponse, responses]);
  const allLinks = mock && isDevMode ? mock.links : links;

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

  const signals = useMemo(() => {
    const words = new Map<string, number>();
    let actions = 0;
    let relationships = 0;
    let earliest: string | null = null;
    let latest: string | null = null;
    for (const response of allResponses) {
      if (response.acted_through_art?.trim()) actions += 1;
      const assigned = themesByResponse.get(response.id ?? "") ?? [];
      relationships += Math.max(0, assigned.length - 1);
      const timestamp = response.created_at ?? "";
      if (timestamp) {
        earliest = earliest ? (timestamp < earliest ? timestamp : earliest) : timestamp;
        latest = latest ? (timestamp > latest ? timestamp : latest) : timestamp;
      }
      const text = `${response.art_is ?? ""} ${response.acted_through_art ?? ""}`.toLocaleLowerCase();
      for (const word of text.match(/[\p{L}]{4,}/gu) ?? []) {
        if (!STOP_WORDS.has(word)) words.set(word, (words.get(word) ?? 0) + 1);
      }
    }
    const keywords = [...words.entries()]
      .filter(([, count]) => count > 1 || allResponses.length < 8)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8);
    const recurring = groups.find(([key]) => key !== OPEN);
    return { actions, relationships, keywords, recurring, earliest, latest };
  }, [allResponses, groups, themesByResponse]);

  const fieldSummary = useMemo(() => {
    const activeKey = selectedTheme ?? signals.recurring?.[0] ?? null;
    if (activeKey) {
      const label = themeLabels[activeKey] ?? activeKey;
      return {
        label,
        detail: `${groups.find(([key]) => key === activeKey)?.[1].length ?? 0} responses in active relation`,
      };
    }
    return {
      label: "Field in formation",
      detail: `${allResponses.length} statements are currently forming the collective field.`,
    };
  }, [allResponses.length, groups, selectedTheme, signals.recurring, themeLabels]);

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
    <main className="relative min-h-screen overflow-hidden bg-background px-5 py-8 text-foreground md:px-10 md:py-10">
      <div className="research-grid pointer-events-none fixed inset-0 opacity-30" />
      <div className="relative">
      <header className="flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <h1>{L.glossaryTitle}</h1>
        <div className="flex gap-5">
          {isDevMode && (
            <span className="flex gap-2 normal-case tracking-normal">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">dev/test</span>
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

      <nav className="mt-7 grid border-y border-foreground/10 py-3 font-mono text-[10px] uppercase text-muted-foreground sm:grid-cols-2 lg:grid-cols-4" aria-label={L.glossaryTitle}>
        <a href="#theory" className="py-1 hover:text-foreground">01 — {L.theoryTitle}</a>
        <a href="#participation" className="py-1 hover:text-foreground">02 — {L.participationTitle}</a>
        <a href="#connections" className="py-1 hover:text-foreground">03 — {L.connectionsTitle}</a>
        <a href="#visualisation" className="py-1 hover:text-foreground">04 — {L.fieldTitle}</a>
      </nav>

      <div className="mt-9 flex flex-col gap-14 lg:grid lg:grid-cols-[1fr_2fr_1fr] lg:gap-10">
        {/* Living visualisation */}
        <section id="visualisation" className="order-1 lg:order-2 lg:row-span-2" aria-label={L.fieldTitle}>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">04</p>
          <h2 className="mt-1 font-serif text-3xl font-light uppercase">{L.fieldTitle}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">→ {L.visualisationQuestion}</p>
          <div className="mt-3 max-w-md border-l border-foreground/15 pl-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Field relation</p>
            <p className="mt-2 text-sm text-muted-foreground">Theory informs action; action accumulates as a collective field. The center tracks how meanings and gestures begin to relate over time.</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 max-w-md text-xs text-muted-foreground">
            <div className="rounded border border-foreground/10 bg-foreground/[0.02] p-2">
              <div className="font-mono uppercase tracking-[0.14em] text-[9px] text-muted-foreground">Active relation</div>
              <div className="mt-2 font-serif text-lg text-foreground">{fieldSummary.label}</div>
            </div>
            <div className="rounded border border-foreground/10 bg-foreground/[0.02] p-2">
              <div className="font-mono uppercase tracking-[0.14em] text-[9px] text-muted-foreground">Field density</div>
              <div className="mt-2 font-serif text-lg text-foreground">{allResponses.length}</div>
            </div>
            <div className="rounded border border-foreground/10 bg-foreground/[0.02] p-2">
              <div className="font-mono uppercase tracking-[0.14em] text-[9px] text-muted-foreground">Actions</div>
              <div className="mt-2 font-serif text-lg text-foreground">{signals.actions}</div>
            </div>
            <div className="rounded border border-foreground/10 bg-foreground/[0.02] p-2">
              <div className="font-mono uppercase tracking-[0.14em] text-[9px] text-muted-foreground">Time</div>
              <div className="mt-2 font-serif text-lg text-foreground">{signals.earliest && signals.latest ? `${new Date(signals.earliest).toLocaleDateString(undefined, { month: "short", day: "numeric" })}–${new Date(signals.latest).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "—"}</div>
            </div>
          </div>
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
        <aside id="theory" className="order-2 lg:order-1" aria-label={L.theoryTitle}>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">01</p>
          <h2 className="mt-1 font-serif text-3xl font-light uppercase">{L.theoryTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">→ {L.theoryQuestion}</p>
          <div className="mt-3 border-l border-foreground/15 pl-3 text-sm text-muted-foreground">
            Theoretical knowledge frames the field. It establishes the terms through which actions, relationships and recurring attitudes become legible.
          </div>
          <div className="mt-6 space-y-8">
            {refGroups.map(([cat, list]) => (
              <div key={cat}>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{cat}</h3>
                <ul className="mt-3 divide-y divide-foreground/10 border-t border-foreground/10">
                  {list.map((r) => {
                    const open = openRefs.has(r.id);
                    return (
                      <li key={r.id} className="py-3 first:pt-0">
                        <button onClick={() => setOpenRefs((s) => toggle(s, r.id))} aria-expanded={open} className="w-full text-left">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <span className="block font-serif text-lg leading-snug text-foreground">{r.title}</span>
                              {(r.author || r.year) && <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{[r.author, r.year].filter(Boolean).join(" · ")}</span>}
                            </div>
                            {r.url && <span className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">↗</span>}
                          </div>
                        </button>
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.16em] underline underline-offset-4 hover:text-foreground">
                            {L.readMore} ↗
                          </a>
                        )}
                        {open && (
                          <div className="fade-up mt-3 rounded border border-foreground/10 bg-foreground/[0.02] p-3 text-sm leading-relaxed text-muted-foreground">
                            {r.note && <p>{r.note}</p>}
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

        {/* Participation */}
        <aside id="participation" className="order-3 lg:order-3" aria-label={L.participationTitle}>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">02</p>
          <h2 className="mt-1 font-serif text-3xl font-light uppercase">{L.participationTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">→ {L.participationQuestion}</p>
          <div className="mt-6 border-y border-foreground/10 py-4 font-mono text-[11px] uppercase text-muted-foreground">
            <p>{L.artIs} ______</p>
            <p className="mt-2">{L.acted} ______</p>
          </div>
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">{allResponses.length} {L.statementsLabel}</p>
          {isDevMode && mock && <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Mockup data visible in development mode only</p>}
          <ol className="mt-5 space-y-5 border-t border-foreground/10 pt-5">
            {allResponses.slice(0, 8).map((response) => {
              const highlighted = response.id === selectedId || response.id === ownId;
              return (
                <li key={response.id ?? response.created_at}>
                  <button
                    onClick={() => setSelectedId(response.id === selectedId ? null : response.id)}
                    className={`w-full border-l pl-3 text-left transition-colors ${highlighted ? "border-foreground text-foreground" : "border-foreground/15 text-muted-foreground hover:text-foreground"}`}
                  >
                    {response.art_is && <><span className="block font-mono text-[9px] uppercase opacity-60">{L.artIs}</span><span className="font-serif text-lg leading-snug">{response.art_is}</span></>}
                    {response.acted_through_art && <><span className="mt-2 block font-mono text-[9px] uppercase opacity-60">{L.acted}</span><span className="font-serif text-lg leading-snug">{response.acted_through_art}</span></>}
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Emerging connections */}
        <aside id="connections" className="order-4 lg:order-3" aria-label={L.connectionsTitle}>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">03</p>
          <h2 className="mt-1 font-serif text-3xl font-light uppercase">{L.connectionsTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">→ {L.connectionsQuestion}</p>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-y border-foreground/10 py-5">
            <div>
              <dt className="font-mono text-[10px] uppercase text-muted-foreground">{L.themesLabel}</dt>
              <dd className="mt-1 font-serif text-2xl">{groups.filter(([key]) => key !== OPEN).length}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-muted-foreground">{L.actionsLabel}</dt>
              <dd className="mt-1 font-serif text-2xl">{signals.actions}</dd>
              <dd className="text-xs text-muted-foreground">{L.actionsFound}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-muted-foreground">{L.relationshipsLabel}</dt>
              <dd className="mt-1 font-serif text-2xl">{signals.relationships}</dd>
              <dd className="text-xs text-muted-foreground">{L.connectionsFound}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-muted-foreground">{L.patternsLabel}</dt>
              <dd className="mt-1 font-serif text-lg leading-tight">{signals.recurring ? themeLabels[signals.recurring[0]] ?? signals.recurring[0] : L.noPatterns}</dd>
              {signals.recurring && <dd className="text-xs text-muted-foreground">{L.repeatedTheme}</dd>}
            </div>
          </dl>

          {signals.keywords.length > 0 && (
            <div className="mt-5">
              <h3 className="font-mono text-[10px] uppercase text-muted-foreground">{L.keywordsLabel}</h3>
              <p className="mt-2 font-serif text-lg leading-relaxed">
                {signals.keywords.map(([word, count], index) => (
                  <span key={word} className={count > 1 ? "text-foreground" : "text-muted-foreground"}>{index > 0 ? " · " : ""}{word}<sup className="ml-0.5 font-mono text-[9px]">{count}</sup></span>
                ))}
              </p>
            </div>
          )}

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
      </div>
    </main>
  );
}
