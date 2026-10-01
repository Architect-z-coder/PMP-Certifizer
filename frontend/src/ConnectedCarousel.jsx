import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/*
  ConnectedCarousel — TRYOUT, not used by the app yet.
  Port of 21st.dev "Connected Carousel" (@arunachalam, component 27165) to Certifizer's stack:
  plain JS, inline styles + one scoped style block, CSS transitions instead of framer-motion,
  no new dependency.

  - One wide active card, narrow neighbours, curved "bridges" joining the cards.
  - Progress tabs fill over `interval` and advance (paused on hover / focus / reduced motion).
  - ← / → keys, swipe, click a neighbour or a tab.

  items: [{ id, label, art: ReactNode, content: ReactNode, sideLabel? }]
  `content` is shown on the active card (a white panel beside the art); `art` fills every card.
*/

const BRIDGE = "M0 0C0 0 1.2422 13.5759 10 13.5759C18.7578 13.5759 20 0 20 0V37.3338C20 37.3338 18.7578 23.7578 10 23.7578C1.2422 23.7578 0 37.3338 0 37.3338V0Z";
const EASE = "cubic-bezier(.22,.9,.24,1)";

function layoutFor(w) {
  if (w >= 1100) return { mode: "wide", A: 762, Ah: 513, S: [105, 74], Sh: [344, 205], g: [20, 16] };
  if (w >= 800) return { mode: "mid", A: Math.min(600, w - 2 * (16 + 90 + 12 + 56) - 16), Ah: 450, S: [90, 56], Sh: [330, 196], g: [16, 12] };
  return { mode: "narrow", A: Math.max(240, w - 2 * (10 + 22) - 4), Ah: 520, S: [22, 0], Sh: [380, 0], g: [10, 0] };
}

function geometry(L, off) {
  const { A, Ah, S, Sh, g } = L;
  const a = Math.abs(off), s = Math.sign(off);
  if (a === 0) return { x: -A / 2, w: A, h: Ah, o: 1 };
  if (a === 1) return { x: s > 0 ? A / 2 + g[0] : -A / 2 - g[0] - S[0], w: S[0], h: Sh[0], o: 1 };
  if (a === 2 && S[1]) return { x: s > 0 ? A / 2 + g[0] + S[0] + g[1] : -A / 2 - g[0] - S[0] - g[1] - S[1], w: S[1], h: Sh[1], o: 1 };
  const far = A / 2 + g[0] + S[0] + g[1] + (S[1] || 0) + 40;
  const w = S[1] || S[0];
  return { x: s > 0 ? far : -far - w, w, h: (Sh[1] || Sh[0]) * 0.8, o: 0 };
}

const reduced = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ConnectedCarousel({ items, interval = 6000, autoplay = true, bridgeColor = "#15263a", accent = "#E89A3C", label = "Carrousel", tabColor = "#16202E", mutedColor = "#5E6E7F" }) {
  const n = items.length;
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [W, setW] = useState(1200);
  const [paused, setPaused] = useState(false);
  const [noMotion, setNoMotion] = useState(reduced);
  const wrapRef = useRef(null);
  const prevOff = useRef({});
  const swipe = useRef(null);

  useLayoutEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el); setW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq) return; const on = () => setNoMotion(mq.matches);
    mq.addEventListener("change", on); return () => mq.removeEventListener("change", on);
  }, []);

  const go = useCallback((i) => { setActive(((i % n) + n) % n); setCycle((c) => c + 1); }, [n]);
  const next = useCallback(() => go(active + 1), [go, active]);
  const prev = useCallback(() => go(active - 1), [go, active]);

  const L = layoutFor(W);
  const offsets = items.map((_, i) => { let o = (((i - active) % n) + n) % n; if (o > Math.floor(n / 2)) o -= n; return o; });
  useEffect(() => { const m = {}; items.forEach((it, i) => { m[it.id] = offsets[i]; }); prevOff.current = m; });

  const running = autoplay && !paused && !noMotion;
  const stageH = L.Ah + 8;
  const bridgeH = (gap) => gap * (37.3338 / 20);

  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
  };

  return (
    <div
      ref={wrapRef}
      role="region"
      aria-roledescription="carrousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKey}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }}
      className="cc-root"
      style={{ position: "relative", width: "100%", outline: "none", overflowX: "clip", overflowY: "visible", paddingBottom: 4 }}
    >
      <style>{`
        .cc-root:focus-visible { outline: 2px solid ${accent} !important; outline-offset: 6px; border-radius: 18px; }
        .cc-card { position: absolute; top: 50%; left: 50%; overflow: hidden; border-radius: ${L.mode === "narrow" ? 22 : 30}px; background: #fff; box-shadow: 0 24px 50px -30px rgba(14,26,43,.45); }
        .cc-side { cursor: pointer; border: 0; padding: 0; }
        .cc-side:focus-visible { outline: 2px solid ${accent}; outline-offset: 3px; }
        .cc-tab { flex: 1 1 0; min-width: 0; background: none; border: 0; padding: 10px 2px 4px; cursor: pointer; text-align: left; font: inherit; color: ${mutedColor}; }
        .cc-tab[aria-selected="true"] { color: ${tabColor}; }
        .cc-tab:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; border-radius: 6px; }
        .cc-track { display: block; height: 3px; border-radius: 3px; background: rgba(14,26,43,.12); overflow: hidden; margin-bottom: 8px; }
        .cc-fill { display: block; height: 100%; width: 100%; background: ${tabColor}; transform-origin: left; transform: scaleX(0); }
        .cc-fill.is-done { transform: scaleX(1); }
        .cc-fill.is-run { animation: cc-fill var(--cc-int) linear forwards; }
        .cc-fill.is-paused { animation-play-state: paused; }
        @keyframes cc-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) { .cc-card, .cc-layer { transition: none !important; } }
      `}</style>

      <div
        style={{ position: "relative", height: stageH, touchAction: "pan-y" }}
        onPointerDown={(e) => { swipe.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => {
          const s = swipe.current; swipe.current = null; if (!s) return;
          const dx = e.clientX - s.x; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) (dx < 0 ? next : prev)();
        }}
      >
        {/* bridges sit in the fixed gaps between card slots */}
        {[[1, 0], [-1, 0], [2, 1], [-2, 1]].map(([side, gi]) => {
          const gap = L.g[gi]; if (!gap || (gi === 1 && !L.S[1])) return null;
          const inner = gi === 0 ? L.A / 2 : L.A / 2 + L.g[0] + L.S[0];
          const x = side > 0 ? inner : -inner - gap;
          const h = bridgeH(gap);
          return (
            <svg key={side} aria-hidden="true" width={gap} height={h} viewBox="0 0 20 37.3338" preserveAspectRatio="none"
              style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(${x}px, ${-h / 2}px)`, pointerEvents: "none" }}>
              <path d={BRIDGE} fill={bridgeColor} />
            </svg>
          );
        })}

        {items.map((it, i) => {
          const off = offsets[i];
          const g = geometry(L, off);
          const prevO = prevOff.current[it.id];
          const jump = prevO !== undefined && Math.abs(prevO - off) > 1;
          const isActive = off === 0;
          const visible = g.o > 0;
          const t = jump ? `opacity 420ms ${EASE}` : `transform 720ms ${EASE}, width 720ms ${EASE}, height 720ms ${EASE}, opacity 420ms ${EASE}, border-radius 720ms ${EASE}`;
          const style = { width: g.w, height: g.h, transform: `translate(${g.x}px, -50%)`, opacity: g.o, transition: t, zIndex: isActive ? 3 : 2 - Math.min(2, Math.abs(off)), visibility: visible ? "visible" : "hidden" };
          const narrow = L.mode === "narrow";
          const inner = (
            <>
              {/* art layer: full card; on the active wide card it sits on the right */}
              <div className="cc-layer" style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: isActive && !narrow ? "54%" : "100%", height: isActive && narrow ? "40%" : "100%", transition: `width 720ms ${EASE}, height 720ms ${EASE}` }}>{it.art}</div>
              {/* content layer, laid out at the final active size so it never reflows mid-animation */}
              <div className="cc-layer" aria-hidden={!isActive}
                style={{ position: "absolute", left: 0, bottom: 0, width: narrow ? L.A : L.A * 0.46, height: narrow ? L.Ah * 0.6 : L.Ah, opacity: isActive ? 1 : 0, transition: `opacity ${isActive ? 520 : 200}ms ${EASE} ${isActive ? 220 : 0}ms`, pointerEvents: isActive ? "auto" : "none", background: "#fff" }}>
                {it.content}
              </div>
            </>
          );
          return isActive || !visible ? (
            <div key={it.id} className="cc-card" role="group" aria-roledescription="diapositive" aria-label={`${i + 1} sur ${n} : ${it.label}`} aria-hidden={!isActive} style={style}>{inner}</div>
          ) : (
            <button key={it.id} type="button" className="cc-card cc-side" tabIndex={-1} aria-label={`Aller à : ${it.label}`} onClick={() => go(i)} style={style}>{inner}</button>
          );
        })}
      </div>

      <div role="tablist" aria-label={`${label} — diapositives`} style={{ display: "flex", gap: L.mode === "narrow" ? 6 : 14, maxWidth: Math.max(L.A, 320), margin: "18px auto 0" }}>
        {items.map((it, i) => {
          const sel = i === active;
          const cls = "cc-fill" + (sel && running ? " is-run" : sel && !running ? (noMotion || !autoplay ? " is-done" : " is-run is-paused") : "");
          return (
            <button key={it.id} type="button" role="tab" aria-selected={sel} className="cc-tab" onClick={() => go(i)}>
              <span className="cc-track"><span key={sel ? `${cycle}` : "x"} className={cls} style={{ "--cc-int": `${interval}ms` }} onAnimationEnd={sel ? next : undefined} /></span>
              {L.mode !== "narrow" && <span style={{ display: "block", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</span>}
            </button>
          );
        })}
      </div>
      <div aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{running ? "" : `Diapositive ${active + 1} sur ${n} : ${items[active].label}`}</div>
    </div>
  );
}
