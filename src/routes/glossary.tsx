import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LivingField } from "@/components/LivingField";
import { t, type Lang } from "@/lib/i18n";
import { extractRelations, POLES, poleLabel, timestamp, type Extraction, type Statement } from "@/lib/glossary-relations";

export const Route = createFileRoute("/glossary")({
  validateSearch: (search: Record<string, unknown>): { new?: string } => typeof search.new === "string" ? { new: search.new.slice(0, 50) } : {},
  head: () => ({ meta: [
    { title: "Living Glossary — Art as Stance" },
    { name: "description", content: "Attitudes, gestures and social action vectors: a timestamped living glossary of emerging connections, with Futur One as conceptual reference." },
    { property: "og:title", content: "Living Glossary — Art as Stance" },
    { property: "og:description", content: "Explore collective thematic poles and echoes through attitudes, actions and social vectors." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Glossary,
});

type ThemeLink = { response_id: string; theme_key: string };
const PAGE_SIZE = 12;

function Glossary() {
  const { new: newId } = Route.useSearch();
  const [lang, setLang] = useState<Lang>("en");
  const [responses, setResponses] = useState<Statement[]>([]);
  const [links, setLinks] = useState<ThemeLink[]>([]);
  const [pendingOwn, setPendingOwn] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [arrival, setArrival] = useState(Boolean(newId));
  const [highlightOwn, setHighlightOwn] = useState(Boolean(newId));
  const [view, setView] = useState<"living" | "participation" | "theory">("living");
  const [field, setField] = useState<Extraction>("vectors");
  const [pole, setPole] = useState<string | null>(null);
  const [echo, setEcho] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const L = t[lang];

  useEffect(() => {
    const stored = localStorage.getItem("aas_lang");
    setLang(stored === "de" || stored === "en" ? stored : navigator.language.startsWith("de") ? "de" : "en");
    if (newId) {
      try { const own = JSON.parse(sessionStorage.getItem(`aas_response_${newId}`) ?? "null"); if (own?.id === newId) setPendingOwn(own); } catch { /* Saved response will arrive through public reads. */ }
    }
  }, [newId]);

  const load = useCallback(async () => {
    try {
      // Range pagination avoids the Data API's per-request row cap; no raw table reads.
      const collected: Statement[] = [];
      const collectedLinks: ThemeLink[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("public_responses").select("id, art_is, acted_through_art, created_at, language").order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
        if (error) throw error;
        const batch = (data ?? []).filter((row): row is Statement => Boolean(row.id && row.created_at));
        collected.push(...batch);
        if ((data?.length ?? 0) < 500) break;
      }
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("public_response_themes").select("response_id, theme_key").order("response_id").order("theme_key").range(offset, offset + 499);
        if (error) throw error;
        collectedLinks.push(...(data ?? []).filter((row): row is ThemeLink => Boolean(row.response_id && row.theme_key)));
        if ((data?.length ?? 0) < 500) break;
      }
      setResponses([...new Map(collected.map((row) => [row.id, row])).values()]); setLinks(collectedLinks); setError(false);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const poll = window.setInterval(load, 10000);
    const channel = supabase.channel("field-pings").on("broadcast", { event: "new" }, load).subscribe((status) => {
      if (status === "SUBSCRIBED" && newId) channel.send({ type: "broadcast", event: "new", payload: {} });
    });
    return () => { window.clearInterval(poll); supabase.removeChannel(channel); };
  }, [load, newId]);
  useEffect(() => {
    if (!newId) return;
    const timer = window.setTimeout(() => setArrival(false), 4000);
    const clear = () => setHighlightOwn(false);
    window.addEventListener("pointerdown", clear, { once: true }); window.addEventListener("keydown", clear, { once: true });
    return () => { window.clearTimeout(timer); window.removeEventListener("pointerdown", clear); window.removeEventListener("keydown", clear); };
  }, [newId]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { setPage(0); }, [field, pole, echo, query, view]);

  const all = useMemo(() => pendingOwn && !responses.some((row) => row.id === pendingOwn.id) ? [pendingOwn, ...responses] : responses, [pendingOwn, responses]);
  const themeMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const link of links) map.set(link.response_id, [...(map.get(link.response_id) ?? []), link.theme_key]);
    return map;
  }, [links]);
  const relations = useMemo(() => new Map(all.map((row) => [row.id, extractRelations(row, field, themeMap.get(row.id))])), [all, field, themeMap]);
  const eligible = useMemo(() => all.filter((row) => field === "vectors" || Boolean(field === "attitude" ? row.art_is : row.acted_through_art)), [all, field]);
  const poles = useMemo(() => [...POLES.map((p) => p.key), "open"].map((key) => ({ key, count: eligible.filter((row) => relations.get(row.id)?.poles.includes(key)).length })), [eligible, relations]);
  const echoes = useMemo(() => (pole ? POLES.filter((p) => p.key === pole) : POLES).flatMap((p) => p.echoes).map((item) => ({ ...item, count: eligible.filter((row) => (!pole || relations.get(row.id)?.poles.includes(pole)) && relations.get(row.id)?.echoes.includes(item.key)).length })).filter((item) => item.count > 0), [eligible, pole, relations]);
  const filtered = useMemo(() => (view === "participation" ? all : eligible).filter((row) => (view === "participation" || ((!pole || relations.get(row.id)?.poles.includes(pole)) && (!echo || relations.get(row.id)?.echoes.includes(echo)))) && `${row.art_is ?? ""} ${row.acted_through_art ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [all, eligible, view, pole, echo, relations, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const ownId = highlightOwn ? newId : null;
  const visible = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  if (ownId && safePage === 0) {
    const own = filtered.find((row) => row.id === ownId);
    if (own && !visible.some((row) => row.id === ownId)) visible.unshift(own);
  }
  const sample = useMemo(() => {
    const list = filtered.slice(0, 35);
    const focus = all.find((row) => row.id === (selectedId ?? ownId));
    if (focus && !list.some((row) => row.id === focus.id)) list.push(focus);
    return list.map((row) => ({ id: row.id, art: field === "gesture" ? null : row.art_is, act: field === "attitude" ? null : row.acted_through_art, createdAt: row.created_at, themes: relations.get(row.id)?.poles ?? ["open"] }));
  }, [filtered, all, selectedId, ownId, field, relations]);
  const labels = Object.fromEntries(poles.map((item) => [item.key, poleLabel(item.key, lang)]));
  const choosePole = (key: string | null) => { setPole(key); setEcho(null); setSelectedId(null); };

  function statement(row: Statement) {
    const active = row.id === selectedId || row.id === ownId;
    return <li key={row.id} id={`statement-${row.id}`} className={`min-w-0 border-t py-5 ${active ? "border-foreground" : "border-border"}`}>
      <time dateTime={row.created_at} className="font-mono text-xs text-muted-foreground">{timestamp(row.created_at, lang)} UTC</time>
      <Button variant="ghost" onClick={() => setSelectedId(row.id === selectedId ? null : row.id)} aria-pressed={active} className="mt-3 block h-auto w-full whitespace-normal p-0 text-left hover:bg-transparent">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="min-w-0"><p className="text-xs text-muted-foreground">01 — {L.attitude}</p><p className="mt-1 text-sm text-muted-foreground">{L.artIs}…</p><p className="mt-2 break-words font-serif text-xl font-normal leading-relaxed">{row.art_is || "—"}</p></div>
          <div className="min-w-0"><p className="text-xs text-muted-foreground">02 — {L.gesture}</p><p className="mt-1 text-sm text-muted-foreground">{L.acted}…</p><p className="mt-2 break-words font-serif text-xl font-normal leading-relaxed">{row.acted_through_art || "—"}</p></div>
          <div className="min-w-0"><p className="text-xs text-muted-foreground">03 — {L.vectors}</p><p className="mt-3 break-words text-base font-normal leading-relaxed">{extractRelations(row, "vectors", themeMap.get(row.id)).poles.map((key) => poleLabel(key, lang)).join(" · ")}</p></div>
        </div>
      </Button>
    </li>;
  }

  return <main className="min-h-screen bg-background px-5 py-7 text-foreground md:px-10 md:py-10">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div><Link to="/" className="font-mono text-xs uppercase text-muted-foreground">{L.title}</Link><h1 className="mt-3 font-serif text-4xl font-bold leading-tight md:text-5xl">{L.glossaryTitle}</h1></div>
        <div className="flex flex-wrap items-center gap-4"><Link to="/" className="text-sm underline underline-offset-4">{L.submit} →</Link>{(["de", "en"] as const).map((code) => <Button key={code} variant="ghost" size="sm" aria-pressed={lang === code} onClick={() => { setLang(code); localStorage.setItem("aas_lang", code); }} className={lang === code ? "underline underline-offset-4" : "text-muted-foreground"}>{code.toUpperCase()}</Button>)}</div>
      </header>
      {arrival && <p aria-live="polite" className="mt-5 text-lg">{L.success}</p>}
      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y py-3" aria-label={L.glossaryTitle}>
        {(["living", "participation", "theory"] as const).map((key) => <Button key={key} variant="ghost" onClick={() => setView(key)} aria-pressed={view === key} className={`h-auto whitespace-normal px-0 py-2 text-left text-base hover:bg-transparent ${view === key ? "text-foreground underline underline-offset-8" : "text-muted-foreground"}`}>{key === "living" ? L.connectionsTitle : key === "participation" ? L.participationTitle : L.theoryTitle}</Button>)}
      </nav>
      {error && <div role="alert" className="mt-5 flex flex-wrap items-center gap-3"><p>{L.loadError}</p><Button variant="outline" onClick={load}>{L.retry}</Button></div>}
      {loading && <p role="status" className="mt-8 text-muted-foreground">{L.loading}</p>}
      {view === "theory" ? <section className="max-w-3xl py-12"><p className="font-mono text-xs uppercase text-muted-foreground">{L.reference}</p><h2 className="mt-4 font-serif text-4xl">Futur One</h2><div className="mt-10 grid gap-7 border-t pt-7 md:grid-cols-3">{(["attitude", "gesture", "vectors"] as const).map((key, i) => <div key={key}><p className="font-mono text-xs text-muted-foreground">0{i + 1}</p><h3 className="mt-3 font-serif text-2xl">{L[key]}</h3></div>)}</div><p className="mt-8 text-sm leading-relaxed text-muted-foreground">{L.provisional}</p></section> : <>
        {view === "living" && <section className="mt-8" aria-label={L.connectionsTitle}>
          <div className="flex flex-wrap gap-2 border-b pb-6" role="group" aria-label={L.glossaryTitle}>{(["attitude", "gesture", "vectors"] as const).map((key, i) => <Button key={key} variant={field === key ? "default" : "outline"} onClick={() => { setField(key); choosePole(null); }} aria-pressed={field === key} className="h-auto min-h-11 max-w-full whitespace-normal text-left">0{i + 1} — {L[key]}</Button>)}</div>
          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)]">
            <div><h2 className="font-serif text-2xl">{L.macro}</h2><Button variant="ghost" onClick={() => choosePole(null)} aria-pressed={!pole} className="mt-4 h-11 w-full justify-between px-0 hover:bg-transparent"><span>{L.all}</span><span className="font-mono text-xs">{eligible.length}</span></Button>
              <div className="divide-y border-y">{poles.map((item) => <Button key={item.key} variant="ghost" aria-pressed={pole === item.key} onClick={() => choosePole(pole === item.key ? null : item.key)} className={`h-auto min-h-14 w-full justify-between gap-5 whitespace-normal px-0 py-3 text-left hover:bg-transparent ${pole === item.key ? "text-foreground underline underline-offset-4" : "text-muted-foreground"}`}><span className="font-serif text-lg">{poleLabel(item.key, lang)}</span><span className="font-mono text-xs">{item.count}</span></Button>)}</div>
            </div>
            <div className="min-w-0"><div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="font-serif text-2xl">{pole ? poleLabel(pole, lang) : L.fieldTitle}</h2><p className="font-mono text-xs text-muted-foreground">{L.sample} · {sample.length} / {filtered.length}</p></div>
              <div className="relative mt-3 h-[420px] border-y md:h-[460px]">{!sample.length && <p className="absolute inset-0 flex items-center justify-center px-5 text-center text-muted-foreground">{L.noResults}</p>}<LivingField nodes={sample} themeLabels={labels} openLabel={L.unassigned} promptLabels={{ art: L.artIs, act: L.acted }} ownId={ownId} selectedId={selectedId} selectedTheme={pole} onSelect={(id) => { setSelectedId(id); const index = filtered.findIndex((row) => row.id === id); if (index >= 0) setPage(Math.floor(index / PAGE_SIZE)); }} /></div>
              {all[0] && <p className="mt-3 text-xs text-muted-foreground">{L.latest} · <time dateTime={all[0].created_at}>{timestamp(all[0].created_at, lang)} UTC</time></p>}
            </div>
          </div>
          <div className="mt-9 border-y py-5"><h2 className="font-serif text-2xl">{L.echoes}</h2><div className="mt-4 flex flex-wrap gap-2"><Button variant={!echo ? "default" : "outline"} aria-pressed={!echo} onClick={() => setEcho(null)}>{L.allEchoes}</Button>{echoes.map((item) => <Button key={item.key} variant={echo === item.key ? "default" : "outline"} aria-pressed={echo === item.key} onClick={() => setEcho(echo === item.key ? null : item.key)} className="h-auto min-h-10 max-w-full whitespace-normal text-left">{item[lang]} <span className="font-mono text-xs">{item.count}</span></Button>)}</div></div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{L.provisional}</p>
        </section>}
        <section className="mt-10" aria-label={L.participationTitle}>
          <div className="flex flex-wrap items-center justify-between gap-5"><h2 className="font-serif text-2xl">{L.participationTitle} <span className="font-mono text-sm text-muted-foreground">{filtered.length}</span></h2><input type="search" aria-label={L.search} placeholder={L.search} value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 w-full border bg-background px-3 text-base outline-none focus:ring-1 focus:ring-ring sm:w-72" /></div>
          <ol className="mt-6">{visible.map(statement)}</ol>
          {!visible.length && !loading && <p className="py-10 text-muted-foreground">{L.noResults}</p>}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-5"><Button variant="outline" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>← {L.previous}</Button><span className="font-mono text-xs text-muted-foreground">{L.page} {safePage + 1} {L.of} {pages}</span><Button variant="outline" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>{L.next} →</Button></div>
        </section>
      </>}
    </div>
  </main>;
}
