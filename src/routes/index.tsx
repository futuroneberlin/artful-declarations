import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { t, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({
    loc: typeof s.loc === "string" ? s.loc.slice(0, 100) : undefined,
  }),
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
      className="blank mt-2 w-full resize-none overflow-hidden border-0 border-b border-foreground/30 bg-transparent pb-1 font-serif text-3xl italic leading-tight text-foreground outline-none transition-colors placeholder:not-italic placeholder:text-muted-foreground/50 focus:border-foreground md:text-4xl"
    />
  );
}

function Participate() {
  const { loc } = Route.useSearch();
  const [lang, setLang] = useState<Lang>("en");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
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
    if (!consent) return setMsg(L.needConsent);
    setState("sending");
    let location_id: string | null = null;
    if (loc) {
      const { data } = await supabase.from("locations").select("id").eq("id", loc).maybeSingle();
      location_id = data?.id ?? null;
    }
    const { error } = await supabase.from("responses").insert({
      art_is: ra.data || null,
      acted_through_art: rb.data || null,
      session_id: getSessionId(),
      location_id,
      language: lang,
      consent: true,
    });
    if (error) { setState("idle"); setMsg(L.error); return; }
    setState("done");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground md:px-16 md:py-12">
      <header className="flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>{L.title}</span>
        <span className="flex gap-2">
          {(["de", "en"] as const).map((l) => (
            <button key={l} onClick={() => switchLang(l)} className={l === lang ? "text-foreground underline underline-offset-4" : "hover:text-foreground"}>
              {l.toUpperCase()}
            </button>
          ))}
        </span>
      </header>

      {state === "done" ? (
        <section className="flex min-h-[70vh] flex-col items-start justify-center">
          <div className="field-pulse mb-10 h-3 w-3 rounded-full bg-foreground" aria-hidden />
          <p className="fade-up max-w-2xl font-serif text-4xl leading-tight md:text-6xl">{L.success}</p>
          <div className="fade-up mt-12 flex gap-8 font-mono text-xs uppercase tracking-[0.2em]" style={{ animationDelay: "0.6s" }}>
            <Link to="/glossary" className="border-b border-foreground pb-1">{L.glossary} →</Link>
            <button onClick={() => { setA(""); setB(""); setState("idle"); }} className="text-muted-foreground hover:text-foreground">{L.again}</button>
          </div>
        </section>
      ) : (
        <form onSubmit={submit} className="mx-auto mt-20 max-w-6xl md:mt-32">
          <div className="grid gap-20 md:grid-cols-2 md:gap-16">
            <label className="block">
              <span className="font-serif text-3xl uppercase tracking-tight md:text-4xl">{L.artIs}</span>
              <Blank value={a} onChange={setA} label={L.artIs} />
            </label>
            <label className="block">
              <span className="font-serif text-3xl uppercase tracking-tight md:text-4xl">{L.acted}</span>
              <Blank value={b} onChange={setB} label={L.acted} />
            </label>
          </div>

          <div className="mt-24 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <label className="flex max-w-md items-start gap-3 font-mono text-xs leading-relaxed text-muted-foreground">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 accent-foreground" />
              <span>
                {L.consent}{" "}
                <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">{L.privacy}</Link>
              </span>
            </label>
            <button type="submit" disabled={state === "sending"} className="self-start font-mono text-xs uppercase tracking-[0.3em] text-foreground transition-opacity hover:opacity-60 disabled:opacity-40 md:self-auto">
              {state === "sending" ? L.sending : `${L.submit} →`}
            </button>
          </div>
          {msg && <p role="alert" className="mt-8 font-mono text-xs text-destructive">{msg}</p>}
        </form>
      )}
    </main>
  );
}
