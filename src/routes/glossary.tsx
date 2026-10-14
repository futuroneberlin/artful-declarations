import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LivingField } from "@/components/LivingField";
import { t, type Lang } from "@/lib/i18n";
import { deriveSocialVector, extractRelations, POLES, poleLabel, timestamp, type Statement } from "@/lib/glossary-relations";

export const Route = createFileRoute("/glossary")({
  validateSearch: (search: Record<string, unknown>): { new?: string } => typeof search["new"] === "string" ? { new: search["new"].slice(0, 50) } : {},
  head: () => ({ meta: [
    { title: "Living Glossary — Art as Stance" },
    { name: "description", content: "Attitudes, gestures and social action vectors: a timestamped living glossary of emerging connections." },
  ] }),
  component: Glossary,
});

type PoleLink = { response_id: string; source_field: "attitude" | "gesture" | "vectors"; pole_key: string };
type SocialVectorRow = {
  response_id: string;
  pole_key: string;
  sector_key: string;
  sector_en: string;
  sector_de: string;
  advice_en: string[];
  advice_de: string[];
  statement_en: string;
  statement_de: string;
  created_at: string;
};

function Glossary() {
  const { new: newId } = Route.useSearch();
  const [lang, setLang] = useState<Lang>("en");
  const [responses, setResponses] = useState<Statement[]>([]);
  const [pendingOwn, setPendingOwn] = useState<Statement | null>(null);
  const [poleLinks, setPoleLinks] = useState<PoleLink[]>([]);
  const [vectors, setVectors] = useState<SocialVectorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [arrival, setArrival] = useState(Boolean(newId));
  const [poleFilter, setPoleFilter] = useState<string | null>(null);
  const [selectedGestureId, setSelectedGestureId] = useState<string | null>(newId ?? null);
  const [showAction, setShowAction] = useState(false);
  const L = t[lang];

  useEffect(() => {
    const stored = localStorage.getItem("aas_lang");
    setLang(stored === "de" || stored === "en" ? stored : navigator.language.startsWith("de") ? "de" : "en");
    if (newId) {
      try {
        const own = JSON.parse(sessionStorage.getItem(`aas_response_${newId}`) ?? "null");
        if (own?.id === newId) setPendingOwn(own);
      } catch {
        // ignore
      }
    }
  }, [newId]);

  const load = useCallback(async () => {
    try {
      const collected: Statement[] = [];
      const collectedPoles: PoleLink[] = [];
      const collectedVectors: SocialVectorRow[] = [];

      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("public_responses").select("id, art_is, acted_through_art, created_at, language").order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
        if (error) throw error;
        collected.push(...(data ?? []).filter((row): row is Statement => Boolean(row.id && row.created_at)));
        if ((data?.length ?? 0) < 500) break;
      }

      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("public_response_poles").select("response_id, source_field, pole_key").order("response_id").range(offset, offset + 499);
        if (error) throw error;
        collectedPoles.push(...(data ?? []).filter((row): row is PoleLink => Boolean(row.response_id && row.source_field && row.pole_key)));
        if ((data?.length ?? 0) < 500) break;
      }

      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("public_response_social_vectors").select("response_id, pole_key, sector_key, sector_en, sector_de, advice_en, advice_de, statement_en, statement_de, created_at").order("created_at", { ascending: false }).range(offset, offset + 499);
        if (error) throw error;
        collectedVectors.push(...(data ?? []).filter((row): row is SocialVectorRow => Boolean(row.response_id)));
        if ((data?.length ?? 0) < 500) break;
      }

      setResponses([...new Map(collected.map((row) => [row.id, row])).values()]);
      setPoleLinks(collectedPoles);
      setVectors(collectedVectors);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
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
    return () => window.clearTimeout(timer);
  }, [newId]);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { setShowAction(false); }, [selectedGestureId]);

  const all = useMemo(() => pendingOwn && !responses.some((row) => row.id === pendingOwn.id) ? [pendingOwn, ...responses] : responses, [pendingOwn, responses]);
  const poleMap = useMemo(() => {
    const map = new Map<string, Record<string, string[]>>();
    for (const row of poleLinks) {
      const byField = map.get(row.response_id) ?? {};
      byField[row.source_field] = [...(byField[row.source_field] ?? []), row.pole_key];
      map.set(row.response_id, byField);
    }
    return map;
  }, [poleLinks]);

  const gestureRows = useMemo(() => all.filter((row) => (row.acted_through_art ?? "").trim()), [all]);

  const gestureWithPoles = useMemo(() => gestureRows.map((row) => {
    const derived = poleMap.get(row.id)?.gesture ?? extractRelations(row, "gesture").poles;
    return { row, poles: derived.length ? derived : ["open"] };
  }), [gestureRows, poleMap]);

  const filteredGestures = useMemo(() => gestureWithPoles.filter((entry) => !poleFilter || entry.poles.includes(poleFilter)), [gestureWithPoles, poleFilter]);

  const sample = useMemo(() => {
    const list = filteredGestures.slice(0, 40);
    return list.map((entry) => ({
      id: entry.row.id,
      art: null,
      act: entry.row.acted_through_art,
      createdAt: entry.row.created_at,
      themes: entry.poles,
    }));
  }, [filteredGestures]);

  const selectedGesture = useMemo(() => gestureRows.find((row) => row.id === selectedGestureId) ?? null, [gestureRows, selectedGestureId]);

  const vectorMap = useMemo(() => new Map(vectors.map((row) => [row.response_id, row])), [vectors]);

  const selectedVector = useMemo(() => {
    if (!selectedGesture) return null;
    const saved = vectorMap.get(selectedGesture.id);
    if (saved) {
      return {
        poleKey: saved.pole_key,
        sector: { en: saved.sector_en, de: saved.sector_de },
        actions: (lang === "de" ? saved.advice_de : saved.advice_en).slice(0, 2),
        statement: lang === "de" ? saved.statement_de : saved.statement_en,
      };
    }
    const derived = deriveSocialVector(selectedGesture, poleMap.get(selectedGesture.id)?.gesture ?? []);
    return {
      poleKey: derived.poleKey,
      sector: derived.sector,
      actions: derived.actions.map((item) => item[lang]),
      statement: derived.statement[lang],
    };
  }, [selectedGesture, vectorMap, lang, poleMap]);

  const labels = Object.fromEntries([...POLES.map((p) => p.key), "open"].map((key) => [key, poleLabel(key, lang)]));

  return (
    <main className="min-h-screen bg-background px-5 py-7 text-foreground md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <Link to="/" className="font-mono text-xs uppercase text-muted-foreground">{L.title}</Link>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-tight md:text-5xl">{L.glossaryTitle}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/" className="text-sm underline underline-offset-4">{L.submit} →</Link>
            {(["de", "en"] as const).map((code) => (
              <Button key={code} variant="ghost" size="sm" aria-pressed={lang === code} onClick={() => { setLang(code); localStorage.setItem("aas_lang", code); }} className={lang === code ? "underline underline-offset-4" : "text-muted-foreground"}>{code.toUpperCase()}</Button>
            ))}
          </div>
        </header>

        {arrival && <p aria-live="polite" className="mt-5 text-lg">{L.success}</p>}
        {error && <div role="alert" className="mt-5 flex flex-wrap items-center gap-3"><p>{L.loadError}</p><Button variant="outline" onClick={load}>{L.retry}</Button></div>}
        {loading && <p role="status" className="mt-8 text-muted-foreground">{L.loading}</p>}

        <section className="mt-8 border-t pt-6">
          <p className="font-mono text-xs uppercase text-muted-foreground">{L.step01Title}</p>
          <h2 className="mt-2 font-serif text-2xl">{L.attitude}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{L.step01Text}</p>
          <ol className="mt-4 grid gap-3 md:grid-cols-2">
            {all.filter((row) => (row.art_is ?? "").trim()).slice(0, 6).map((row) => (
              <li key={row.id} className="border px-4 py-3">
                <time className="font-mono text-xs text-muted-foreground" dateTime={row.created_at}>{timestamp(row.created_at, lang)} UTC</time>
                <p className="mt-2 font-serif text-xl">{row.art_is}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 border-t pt-6">
          <p className="font-mono text-xs uppercase text-muted-foreground">{L.step02Title}</p>
          <h2 className="mt-2 font-serif text-2xl">{L.gestureFieldTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{L.step02Text}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant={poleFilter === null ? "default" : "outline"} onClick={() => setPoleFilter(null)}>{L.all}</Button>
            {[...POLES.map((p) => p.key), "open"].map((key) => (
              <Button key={key} variant={poleFilter === key ? "default" : "outline"} onClick={() => setPoleFilter(poleFilter === key ? null : key)}>{poleLabel(key, lang)}</Button>
            ))}
          </div>

          <div className="mt-4 h-[420px] border-y md:h-[460px]">
            <LivingField
              nodes={sample}
              themeLabels={labels}
              openLabel={L.unassigned}
              promptLabels={{ art: L.artIs, act: L.acted }}
              selectedId={selectedGestureId}
              selectedTheme={poleFilter}
              onSelect={(id) => setSelectedGestureId(id)}
            />
          </div>

          <h3 className="mt-6 font-serif text-xl">{L.gestureCardsTitle}</h3>
          <ol className="mt-3 grid gap-3 md:grid-cols-2">
            {filteredGestures.map(({ row, poles }) => (
              <li key={row.id} className={`border px-4 py-3 ${selectedGestureId === row.id ? "border-foreground" : "border-border"}`}>
                <button type="button" className="w-full text-left" onClick={() => setSelectedGestureId(row.id)}>
                  <time className="font-mono text-xs text-muted-foreground" dateTime={row.created_at}>{timestamp(row.created_at, lang)} UTC</time>
                  <p className="mt-2 text-xs text-muted-foreground">{L.gesturePromptShort}</p>
                  <p className="mt-1 font-serif text-xl">{row.acted_through_art}</p>
                  <p className="mt-3 font-mono text-xs text-muted-foreground">{L.gestureCardPole}: {poleLabel(poles[0] ?? "open", lang)}</p>
                </button>
              </li>
            ))}
          </ol>
          {!filteredGestures.length && !loading && <p className="mt-5 text-muted-foreground">{L.noResults}</p>}
        </section>

        <section className="mt-10 border-t pt-6 pb-10">
          <p className="font-mono text-xs uppercase text-muted-foreground">{L.step03Title}</p>
          <h2 className="mt-2 font-serif text-2xl">{L.vectors}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{L.step03Text}</p>

          {selectedGesture ? (
            <div className="mt-5 border px-4 py-4">
              <p className="font-mono text-xs text-muted-foreground">{timestamp(selectedGesture.created_at, lang)} UTC</p>
              <p className="mt-2 font-serif text-2xl">{selectedGesture.acted_through_art}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => setShowAction((value) => !value)}>{L.turnToAction}</Button>
                <Button variant="ghost" onClick={() => setShowAction(false)}>{L.skipAction}</Button>
              </div>

              {showAction && selectedVector && (
                <div className="mt-5 border-t pt-5">
                  <p className="font-mono text-xs uppercase text-muted-foreground">{L.socialSector}</p>
                  <p className="mt-1 font-serif text-xl">{selectedVector.sector[lang]}</p>
                  <p className="mt-4 text-base">{selectedVector.statement}</p>
                  <p className="mt-5 font-mono text-xs uppercase text-muted-foreground">{L.suggestedActions}</p>
                  <ul className="mt-2 list-disc pl-5 text-base leading-relaxed">
                    {selectedVector.actions.map((action) => <li key={action}>{action}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-5 text-muted-foreground">{L.noResults}</p>
          )}
        </section>
      </div>
    </main>
  );
}
