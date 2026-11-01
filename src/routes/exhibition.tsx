import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LivingField, type FieldNode } from "@/components/LivingField";
import { t, type Lang } from "@/lib/i18n";
import { extractRelations, POLES, poleLabel, timestamp, type Statement } from "@/lib/glossary-relations";

export const Route = createFileRoute("/exhibition")({
  head: () => ({ meta: [
    { title: "Exhibition — Artful Declarations · Zwolle Biennale" },
    { name: "description", content: "A living, collective visualisation of anonymous answers to “Art is ______”, grouped into thematic poles." },
    { property: "og:title", content: "Artful Declarations — Exhibition view" },
    { property: "og:description", content: "Watch individual statements gather into a collective field." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Exhibition,
});

function Exhibition() {
  const [lang, setLang] = useState<Lang>("en");
  const [rows, setRows] = useState<Statement[]>([]);
  const [error, setError] = useState(false);
  const L = t[lang];

  useEffect(() => {
    const s = localStorage.getItem("aas_lang");
    setLang(s === "de" || s === "en" ? s : navigator.language.startsWith("de") ? "de" : "en");
  }, []);

  const load = useCallback(async () => {
    const all: Statement[] = [];
    for (let o = 0; ; o += 500) {
      const { data, error } = await supabase.from("public_responses").select("id, art_is, acted_through_art, created_at, language").order("created_at", { ascending: false }).range(o, o + 499);
      if (error) { setError(true); return; }
      all.push(...(data ?? []).filter((r): r is Statement => Boolean(r.id && r.created_at)));
      if ((data?.length ?? 0) < 500) break;
    }
    setRows(all); setError(false);
  }, []);

  useEffect(() => {
    load();
    const poll = window.setInterval(load, 10000);
    const ch = supabase.channel("field-pings").on("broadcast", { event: "new" }, load).subscribe();
    return () => { window.clearInterval(poll); supabase.removeChannel(ch); };
  }, [load]);

  const nodes: FieldNode[] = useMemo(() => rows.slice(0, 400).map((r) => {
    const poles = extractRelations(r, "vectors").poles.filter((p) => p !== "open");
    return { id: r.id, art: r.art_is, act: r.acted_through_art, createdAt: r.created_at, themes: poles };
  }), [rows]);
  const labels = useMemo(() => Object.fromEntries(POLES.map((p) => [p.key, p[lang]])), [lang]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of nodes) for (const k of n.themes.length ? n.themes : ["open"]) c[k] = (c[k] ?? 0) + 1;
    return c;
  }, [nodes]);
  const latest = rows.slice(0, 6);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground lg:h-screen lg:flex-row">
      <section className="relative min-h-[60vh] flex-1">
        <header className="absolute left-0 right-0 top-0 z-10 flex justify-between p-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:p-6">
          <span className="flex items-center gap-3"><span className="field-pulse h-1.5 w-1.5 rounded-full bg-foreground" />{L.exhibitionTitle}</span>
          <span>{rows.length} {L.statementsLabel}</span>
        </header>
        <div className="absolute inset-0"><LivingField nodes={nodes} themeLabels={labels} openLabel={L.unassigned} promptLabels={{ art: L.artIs, act: L.actedShort }} /></div>
        {error && <p className="absolute bottom-4 left-4 font-mono text-xs text-destructive">{L.loadError}</p>}
      </section>
      <aside className="w-full border-t border-border p-5 md:p-8 lg:w-96 lg:overflow-hidden lg:border-l lg:border-t-0">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{L.macro}</h2>
        <ul className="mt-4 space-y-2">
          {[...POLES.map((p) => p.key), "open"].map((k) => (
            <li key={k} className="flex justify-between border-b border-border pb-2 font-serif text-lg"><span>{poleLabel(k, lang)}</span><span className="font-mono text-xs text-muted-foreground">{counts[k] ?? 0}</span></li>
          ))}
        </ul>
        <h2 className="mt-10 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{L.latest}</h2>
        <ul className="mt-4 space-y-5">
          {latest.length === 0 && <li className="text-muted-foreground">{L.fieldWaiting}</li>}
          {latest.map((r) => (
            <li key={r.id} className="fade-up">
              <time dateTime={r.created_at} className="font-mono text-[10px] text-muted-foreground">{timestamp(r.created_at, lang)}</time>
              {r.art_is && <p className="mt-1 font-serif text-base leading-snug">{L.artIs} {r.art_is}</p>}
              {r.acted_through_art && <p className="mt-1 text-sm leading-snug text-muted-foreground">{L.acted} {r.acted_through_art}</p>}
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
