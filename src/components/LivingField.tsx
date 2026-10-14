import { useEffect, useRef, useState } from "react";

export type FieldNode = {
  id: string;
  art: string | null;
  act: string | null;
  createdAt: string;
  themes: string[];
};

type Props = {
  nodes: FieldNode[];
  themeLabels: Record<string, string>;
  openLabel: string;
  promptLabels: { art: string; act: string };
  ownId?: string | null;
  selectedId?: string | null;
  selectedTheme?: string | null;
  onSelect?: (id: string | null) => void;
  className?: string;
};

type Sim = {
  id: string;
  x: number; y: number; vx: number; vy: number;
  r: number; born: number; age: number; seed: number;
  kind: "art" | "act" | "both";
  theme: string;
  themes: string[];
  text: string;
};

const OPEN = "__open";
const MAX_LINES = 450;

export function LivingField({ promptLabels, nodes, themeLabels, openLabel, ownId, selectedId, selectedTheme, onSelect, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Map<string, Sim>>(new Map());
  const propsRef = useRef({ ownId, selectedId, selectedTheme, themeLabels, openLabel });
  propsRef.current = { ownId, selectedId, selectedTheme, themeLabels, openLabel };
  const hoverRef = useRef<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; node: FieldNode } | null>(null);
  const nodesById = useRef<Map<string, FieldNode>>(new Map());
  const sizeRef = useRef({ w: 600, h: 500 });

  // Sync nodes into simulation
  useEffect(() => {
    const sim = simRef.current;
    const { w, h } = sizeRef.current;
    const ids = new Set(nodes.map((n) => n.id));
    for (const id of sim.keys()) if (!ids.has(id)) sim.delete(id);
    const now = performance.now();
    const firstLoad = sim.size === 0;
    const newest = nodes.reduce((m, n) => Math.max(m, Date.parse(n.createdAt) || 0), 0);
    nodesById.current = new Map(nodes.map((n) => [n.id, n]));
    for (const [index, n] of nodes.entries()) {
      const len = (n.art?.length ?? 0) + (n.act?.length ?? 0);
      const kind = n.art && n.act ? "both" : n.art ? "art" : "act";
      const theme = n.themes[0] ?? OPEN;
      const existing = sim.get(n.id);
      const ageDays = (newest - (Date.parse(n.createdAt) || newest)) / 86400000;
      if (existing) {
        existing.theme = theme; existing.themes = n.themes.length ? n.themes : [OPEN];
        continue;
      }
      const fromEdge = !firstLoad || n.id === ownId;
      const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2;
      const radius = Math.min(w, h) * 0.28;
      sim.set(n.id, {
        id: n.id,
        x: fromEdge ? w / 2 + Math.cos(angle) * w * 0.6 : w / 2 + Math.cos(angle) * radius,
        y: fromEdge ? h / 2 + Math.sin(angle) * h * 0.6 : h / 2 + Math.sin(angle) * radius,
        vx: 0, vy: 0,
        r: 3 + Math.min(9, Math.sqrt(len) * 0.9),
        born: fromEdge ? now : now - 10000,
        age: Math.min(1, ageDays / 14),
        seed: Math.random() * 1000,
        text: (n.art ?? n.act ?? "").slice(0, 32),
        kind, theme, themes: n.themes.length ? n.themes : [OPEN],
      });
    }
  }, [nodes, ownId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let raf = 0;
    let running = true;
    let lowQuality = false;
    let frameAvg = 16;
    let last = performance.now();

    const css = getComputedStyle(document.documentElement);
    const col = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb;
    const C = {
      art: col("--field-art", "#a0522d"),
      act: col("--field-act", "#3b5b6b"),
      fg: col("--foreground", "#222"),
      muted: col("--muted-foreground", "#777"),
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      dpr = lowQuality ? 1 : Math.min(2, window.devicePixelRatio || 1);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const anchors = (keys: string[], w: number, h: number) => {
      const map = new Map<string, { x: number; y: number }>();
      const list = keys.filter((k) => k !== OPEN);
      const rx = w * 0.34, ry = h * 0.33;
      list.forEach((k, i) => {
        const a = (i / Math.max(1, list.length)) * Math.PI * 2 - Math.PI / 2;
        map.set(k, { x: w / 2 + Math.cos(a) * rx, y: h / 2 + Math.sin(a) * ry });
      });
      map.set(OPEN, { x: w / 2, y: h / 2 });
      return map;
    };

    const step = (t: number) => {
      if (!running) return;
      const dt = Math.min(50, t - last);
      last = t;
      frameAvg = frameAvg * 0.95 + dt * 0.05;
      if (!lowQuality && frameAvg > 30) { lowQuality = true; resize(); }

      const { w, h } = sizeRef.current;
      const p = propsRef.current;
      const sims = [...simRef.current.values()];
      const themeKeys = Array.from(new Set(sims.map((s) => s.theme)));
      const anc = anchors(Array.from(new Set([...Object.keys(p.themeLabels), ...themeKeys])), w, h);

      // Physics
      const byTheme = new Map<string, Sim[]>();
      for (const s of sims) {
        const arr = byTheme.get(s.theme) ?? [];
        arr.push(s); byTheme.set(s.theme, arr);
      }
      const scale = sims.length < 20 ? 2.4 : sims.length < 80 ? 1.5 : 1;
      const showText = sims.length <= 32 && w > 480;
      const motion = reduced ? 0.15 : 1;
      for (const s of sims) {
        const target = (p.selectedTheme && s.themes.includes(p.selectedTheme) ? anc.get(p.selectedTheme) : anc.get(s.theme)) ?? { x: w / 2, y: h / 2 };
        const pull = p.selectedTheme && s.themes.includes(p.selectedTheme) ? 0.0016 : 0.0006;
        s.vx += (target.x - s.x) * pull;
        s.vy += (target.y - s.y) * pull;
        const activity = (1 - s.age * 0.7) * motion;
        s.vx += Math.sin(t * 0.0004 + s.seed) * 0.02 * activity;
        s.vy += Math.cos(t * 0.00035 + s.seed * 1.3) * 0.02 * activity;
      }
      // Local repulsion within clusters (sampled)
      for (const group of byTheme.values()) {
        const n = group.length;
        const samples = Math.min(n, 8);
        for (let i = 0; i < n; i++) {
          const a = group[i];
          if (!a) continue;
          for (let k = 1; k <= samples; k++) {
            const b = group[(i + k) % n];
            if (!b) continue;
            if (a === b) continue;
            const dx = a.x - b.x, dy = a.y - b.y;
            const d2 = dx * dx + dy * dy + 0.01;
            const min = (a.r + b.r) * 2.2 * (group.length < 20 ? 3 : 1.4);
            if (d2 < min * min) {
              const f = 0.04 / Math.sqrt(d2);
              a.vx += dx * f; a.vy += dy * f;
            }
          }
        }
      }
      for (let i = 0; i < sims.length; i++) {
        const a = sims[i];
        if (!a) continue;
        for (let j = i + 1; j < sims.length; j++) {
          const b = sims[j];
          if (!b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy + 0.01;
          const min = (a.r + b.r) * 1.9;
          if (d2 < min * min) {
            const d = Math.sqrt(d2);
            const nx = dx / d;
            const ny = dy / d;
            const push = (min - d) * 0.045;
            a.vx -= nx * push; a.vy -= ny * push;
            b.vx += nx * push; b.vy += ny * push;
          }
        }
      }
      for (const s of sims) {
        s.vx *= 0.9; s.vy *= 0.9;
        s.x += s.vx * (dt / 16); s.y += s.vy * (dt / 16);
        s.x = Math.max(s.r, Math.min(w - s.r, s.x));
        s.y = Math.max(s.r, Math.min(h - s.r, s.y));
      }

      // Draw
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Lines
      if (!lowQuality || sims.length < 200) {
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = C.fg;
        let lines = 0;
        for (const [key, group] of byTheme) {
          if (key === OPEN) continue;
          const hl = p.selectedTheme === key;
          for (let i = 0; i < group.length && lines < MAX_LINES; i++) {
            const a = group[i], b = group[(i + 1) % group.length];
            if (!a || !b) continue;
            if (a === b) continue;
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d > 160) continue;
            ctx.globalAlpha = (1 - d / 160) * (hl ? 0.45 : 0.14);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            lines++;
          }
        }
      }

      // Forms
      const now = performance.now();
      const occupied: { x: number; y: number; w: number; h: number }[] = [];
      const fits = (box: { x: number; y: number; w: number; h: number }) => !occupied.some((other) => box.x < other.x + other.w && box.x + box.w > other.x && box.y < other.y + other.h && box.y + box.h > other.y);
      for (const s of sims) {
        const since = now - s.born;
        const glow = Math.max(0, 1 - since / 6000);
        const isOwn = s.id === p.ownId;
        const isSel = s.id === p.selectedId || s.id === hoverRef.current;
        const dim = p.selectedTheme && !s.themes.includes(p.selectedTheme) ? 0.25 : 1;
        const pulse = reduced ? 1 : 1 + Math.sin(t * 0.002 + s.seed) * 0.06 * (1 - s.age);
        const r = s.r * scale * pulse * (isOwn || isSel ? 1.5 : 1);
        const baseAlpha = (0.55 - s.age * 0.2) * dim;

        if (glow > 0 || isOwn || isSel) {
          ctx.globalAlpha = Math.max(glow * 0.35, isOwn || isSel ? 0.22 : 0);
          ctx.fillStyle = s.kind === "act" ? C.act : C.art;
          ctx.beginPath(); ctx.arc(s.x, s.y, r * 2.6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = isOwn || isSel ? 0.95 : baseAlpha;
        if (s.kind === "both") {
          ctx.fillStyle = C.art;
          ctx.beginPath(); ctx.arc(s.x, s.y, r, Math.PI / 2, Math.PI * 1.5); ctx.fill();
          ctx.fillStyle = C.act;
          ctx.beginPath(); ctx.arc(s.x, s.y, r, -Math.PI / 2, Math.PI / 2); ctx.fill();
        } else {
          ctx.fillStyle = s.kind === "art" ? C.art : C.act;
          ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
        }
        if (isOwn || isSel) {
          ctx.globalAlpha = 0.8; ctx.strokeStyle = C.fg; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(s.x, s.y, r + 4, 0, Math.PI * 2); ctx.stroke();
        }
        if (showText && s.text) {
          ctx.globalAlpha = isOwn || isSel ? 0.95 : 0.6 * dim;
          ctx.fillStyle = C.fg;
          ctx.font = `14px Helvetica, Arial, sans-serif`;
          ctx.textAlign = "left";
          let text = s.text;
          const maxWidth = Math.min(160, w - 24);
          while (text.length > 1 && ctx.measureText(text + "…").width > maxWidth) text = text.slice(0, -1);
          if (text !== s.text) text += "…";
          const width = ctx.measureText(text).width;
          const x = Math.max(8, Math.min(w - width - 8, s.x + r + 6));
          const y = Math.max(20, Math.min(h - 12, s.y + 5));
          const box = { x: x - 3, y: y - 16, w: width + 6, h: 24 };
          if (fits(box)) { occupied.push(box); ctx.fillText(text, x, y); }
        }
      }

      // Cluster labels
      ctx.font = "13px Helvetica, Arial, sans-serif";
      ctx.textAlign = "center";
      for (const [key, group] of byTheme) {
        if (group.length < 2 && key !== p.selectedTheme) continue;
        let cx = 0, cy = 0, top = Infinity;
        for (const s of group) { cx += s.x; cy += s.y; top = Math.min(top, s.y - s.r); }
        cx /= group.length; cy /= group.length;
        ctx.globalAlpha = p.selectedTheme === key ? 0.9 : 0.45;
        ctx.fillStyle = C.muted;
        const label = key === OPEN ? p.openLabel : p.themeLabels[key] ?? key;
        const width = ctx.measureText(label).width;
        const x = Math.max(width / 2 + 8, Math.min(w - width / 2 - 8, cx));
        const y = Math.max(16, top - 20);
        const box = { x: x - width / 2 - 4, y: y - 14, w: width + 8, h: 22 };
        if (fits(box)) { occupied.push(box); ctx.fillText(label, x, y); }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const onVis = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(step); }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const pick = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { best: null, x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    let best: Sim | null = null, bestD = 22;
    for (const s of simRef.current.values()) {
      const d = Math.hypot(s.x - x, s.y - y) - s.r;
      if (d < bestD) { bestD = d; best = s; }
    }
    return { best, x, y };
  };

  return (
    <div ref={wrapRef} className={`relative h-full w-full ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair touch-pan-y"
        role="img"
        aria-label="Living field of contributions"
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const { best, x, y } = pick(e.clientX, e.clientY);
          hoverRef.current = best?.id ?? null;
          const node = best ? nodesById.current.get(best.id) : undefined;
          setTip(node ? { x, y, node } : null);
        }}
        onPointerLeave={() => { hoverRef.current = null; setTip(null); }}
        onClick={(e) => {
          const { best, x, y } = pick(e.clientX, e.clientY);
          const node = best ? nodesById.current.get(best.id) : undefined;
          setTip(node ? { x, y, node } : null);
          onSelect?.(best?.id ?? null);
        }}
      />
      {tip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[min(16rem,calc(100%-16px))] bg-background/95 px-3 py-2 font-serif text-base leading-snug text-foreground shadow-sm"
          style={{ left: Math.max(8, Math.min(tip.x + 12, sizeRef.current.w - 264)), top: Math.max(8, Math.min(tip.y + 12, sizeRef.current.h - 150)) }}
        >
          {tip.node.art && <p><span className="text-xs italic text-muted-foreground">{promptLabels.art} </span>{tip.node.art}</p>}
          {tip.node.act && <p className="mt-1"><span className="text-xs italic text-muted-foreground">{promptLabels.act} </span>{tip.node.act}</p>}
        </div>
      )}
    </div>
  );
}
