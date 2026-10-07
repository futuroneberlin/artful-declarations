import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { t, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): { loc?: string } => {
    const loc = s["loc"];
    return typeof loc === "string" ? { loc: loc.slice(0, 100) } : {};
  },
  head: () => ({
    meta: [
      { title: "Art as Stance — Complete the sentence" },
      { name: "description", content: "An anonymous, collective social sculpture. Complete: Art is ______." },
      { property: "og:title", content: "Art as Stance" },
      { property: "og:description", content: "Complete the sentence. Enter the collective field." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Participate,
});

const answer = z.string().trim().max(500);

function getSessionId() {
  const k = "aas_session";
  let id = localStorage.getItem(k);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(k, id);
  }
  return id;
}

function Blank({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
  }, [value]);
  return (
    <textarea
      ref={ref}
      aria-label={label}
      rows={1}
      maxLength={500}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="______"
      className="blank mt-6 w-full resize-none overflow-hidden border-0 border-b-2 border-foreground/40 bg-transparent pb-4 font-serif text-3xl font-bold leading-tight tracking-tight text-foreground outline-none transition-colors placeholder:text-foreground/20 focus:border-foreground md:text-5xl"
    />
  );
}

function Participate() {
  const { loc } = Route.useSearch();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>("en");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [state, setState] = useState<"idle" | "sending">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const L = t[lang];

  useEffect(() => {
    const stored = localStorage.getItem("aas_lang");
    if (stored === "de" || stored === "en") setLang(stored);
    else if (navigator.language?.toLowerCase().startsWith("de")) setLang("de");
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const switchLang = (l: Lang) => { setLang(l); localStorage.setItem("aas_lang", l); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const ra = answer.safeParse(a), rb = answer.safeParse(b);
    if (!ra.success || !rb.success) return setMsg(L.error);
    if (!ra.data && !rb.data) return setMsg(L.needOne);
    setState("sending");
    let location_id: string | null = null;
    if (loc) {
      const { data } = await supabase.from("locations").select("id").eq("id", loc).maybeSingle();
      location_id = data?.id ?? null;
    }
    const responseId = crypto.randomUUID();
    const { error } = await supabase.from("responses").insert({
      id: responseId,
      art_is: ra.data || null,
      acted_through_art: rb.data || null,
      session_id: getSessionId(),
      location_id,
      language: lang,
      consent: true,
    });
    if (error) { setState("idle"); setMsg(L.error); return; }
    sessionStorage.setItem(`aas_response_${responseId}`, JSON.stringify({
      id: responseId,
      art_is: ra.data || null,
      acted_through_art: rb.data || null,
      created_at: new Date().toISOString(),
      language: lang,
      source_type: "live",
      is_mockup: false,
      exhibition_id: null,
    }));
    await navigate({ to: "/glossary", search: { new: responseId } });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-3 py-3 text-foreground md:flex md:items-center md:px-12 md:py-10">
      <div className="research-grid pointer-events-none absolute inset-0 opacity-50" />
      <section className="relative mx-auto w-full max-w-6xl border border-foreground/20 bg-background/90 backdrop-blur-sm px-4 py-6 sm:p-6 md:p-12">
      <span className="absolute -left-px -top-px h-8 w-8 border-l border-t border-foreground" />
      <span className="absolute -bottom-px -right-px h-8 w-8 border-b border-r border-foreground" />
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 pl-2 font-mono text-[10px] uppercase text-muted-foreground">
        <div className="flex min-w-0 items-center gap-3"><span className="field-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" /><span className="truncate">{L.title} / Collective field</span></div>
        <span className="flex gap-2">
          {(["de", "en"] as const).map((l) => (
            <Button key={l} type="button" variant="ghost" size="sm" onClick={() => switchLang(l)} className={`h-auto min-w-0 rounded-none p-0 font-mono text-xs uppercase tracking-[0.2em] hover:bg-transparent ${l === lang ? "text-foreground underline underline-offset-4" : "text-muted-foreground hover:text-foreground"}`}>
              {l.toUpperCase()}
            </Button>
          ))}
        </span>
      </header>

      <form onSubmit={submit} className="mt-10 md:mt-24">
          <div className="grid gap-px border-y border-foreground/15 bg-foreground/15 md:grid-cols-2">
            <label className="flex flex-col bg-background px-3 py-7 sm:p-6 md:min-h-72 md:p-10">
              <header className="flex items-center gap-4">
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">01</span>
                <div className="h-px flex-grow bg-foreground/10" />
              </header>
              <h2 className="mt-6 font-serif text-5xl font-bold leading-none tracking-tighter md:text-6xl">{L.artIs}</h2>
              <Blank value={a} onChange={setA} label={L.artIs} />
            </label>
            <label className="flex flex-col bg-background px-3 py-7 sm:p-6 md:min-h-72 md:p-10">
              <header className="flex items-center gap-4">
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">02</span>
                <div className="h-px flex-grow bg-foreground/10" />
              </header>
              <h2 className="mt-6 font-serif text-[2.5rem] font-bold leading-[1.02] tracking-tighter md:text-5xl">{L.acted}</h2>
              <Blank value={b} onChange={setB} label={L.acted} />
            </label>
          </div>

          <div className="mt-10 flex flex-col items-stretch md:items-start justify-between gap-8 md:flex-row md:items-center">
            <p className="max-w-xl font-sans text-[15px] font-light leading-relaxed md:text-sm text-muted-foreground">
              {L.consent}{" "}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">{L.privacy}</Link>
            </p>
            <Button type="submit" disabled={state === "sending" || (!a.trim() && !b.trim())} className="h-14 w-full rounded-none md:w-auto border border-foreground bg-primary px-8 font-mono text-xs uppercase text-primary-foreground transition-all hover:bg-background hover:text-foreground disabled:border-foreground/20 disabled:bg-transparent disabled:text-muted-foreground">
              {state === "sending" ? L.sending : `${L.submit} →`}
            </Button>
          </div>
          {msg && <p role="alert" className="mt-8 font-mono text-xs text-destructive">{msg}</p>}
      </form>
      <footer className="mt-14 flex flex-wrap justify-between gap-2 border-t border-foreground/10 pt-5 font-mono text-[9px] uppercase text-muted-foreground"><span>Anonymous research protocol</span><span>Raw responses preserved</span></footer>
      </section>
    </main>
  );
}
