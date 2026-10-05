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
      className="blank mt-2 w-full resize-none overflow-hidden border-0 border-b border-foreground/30 bg-transparent pb-1 font-serif text-3xl italic leading-tight text-foreground outline-none transition-colors placeholder:not-italic placeholder:text-muted-foreground/50 focus:border-foreground md:text-4xl"
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
    await navigate({ to: "/glossary", search: { new: responseId } });
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground md:px-16 md:py-12">
      <header className="flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>{L.title}</span>
        <span className="flex gap-2">
          {(["de", "en"] as const).map((l) => (
            <Button key={l} type="button" variant="ghost" size="sm" onClick={() => switchLang(l)} className={`h-auto min-w-0 rounded-none p-0 font-mono text-xs uppercase tracking-[0.2em] hover:bg-transparent ${l === lang ? "text-foreground underline underline-offset-4" : "text-muted-foreground hover:text-foreground"}`}>
              {l.toUpperCase()}
            </Button>
          ))}
        </span>
      </header>

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

          <div className="mt-24 flex flex-col items-start gap-6 md:items-end">
            <p className="max-w-xl font-mono text-xs leading-relaxed text-muted-foreground md:text-right">
              {L.consent}{" "}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">{L.privacy}</Link>
            </p>
            <Button type="submit" variant="ghost" disabled={state === "sending" || (!a.trim() && !b.trim())} className="h-auto rounded-none p-0 font-mono text-xs uppercase tracking-[0.3em] text-foreground hover:bg-transparent hover:opacity-60 disabled:opacity-30">
              {state === "sending" ? L.sending : `${L.submit} →`}
            </Button>
          </div>
          {msg && <p role="alert" className="mt-8 font-mono text-xs text-destructive">{msg}</p>}
      </form>
    </main>
  );
}
