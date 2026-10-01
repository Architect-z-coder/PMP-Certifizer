import React, { useCallback, useEffect, useRef, useState } from "react";

/*
  CoverflowCarousel — TRYOUT, not used by the app yet.
  Port of 21st.dev "Coverflow Carousel" (@educalvolpz, component 29138) to Certifizer's stack:
  plain JS, CSS 3D transforms + transitions instead of motion/react, no new dependency.

  - Centre card faces you; neighbours turn away in 3D, recede and shrink.
  - Swipe/drag (80 px or a quick flick), ← / → / Home / End keys, Prev / Next buttons,
    click any visible card to bring it forward. Optional loop and autoplay.
  - Screen readers hear "x sur y : <label>" on every change.

  items: [{ id, label }]   renderCard(item, { active }) -> ReactNode
*/

const EASE = "cubic-bezier(.25,1.1,.4,1)"; // light overshoot, like the original's bounce 0.1 spring
const MAX_VISIBLE = 3;
const reduced = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function CoverflowCarousel({ items, renderCard, loop = true, autoplay = false, interval = 4000, cardWidth = 300, cardHeight = 240, label = "Carrousel", accent = "#E89A3C", ink = "#0E1A2B", startIndex = 0 }) {
  const n = items.length;
  const [active, setActive] = useState(Math.min(startIndex, Math.max(0, n - 1)));
  const [paused, setPaused] = useState(false);
  const [noMotion, setNoMotion] = useState(reduced);
  const [dragX, setDragX] = useState(0);
  const drag = useRef(null);
  const prevOff = useRef({});

  useEffect(() => { setActive((a) => Math.min(a, Math.max(0, n - 1))); }, [n]);
  useEffect(() => {
    const mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq) return; const on = () => setNoMotion(mq.matches);
    mq.addEventListener("change", on); return () => mq.removeEventListener("change", on);
  }, []);

  const go = useCallback((i) => {
    if (!n) return;
    if (loop) setActive(((i % n) + n) % n);
    else setActive(Math.max(0, Math.min(n - 1, i)));
  }, [n, loop]);
  const next = useCallback(() => go(active + 1), [go, active]);
  const prev = useCallback(() => go(active - 1), [go, active]);

  useEffect(() => {
    if (!autoplay || paused || noMotion || n < 2) return;
    const t = setTimeout(next, interval);
    return () => clearTimeout(t);
  }, [autoplay, paused, noMotion, interval, next, n, active]);

  const offsetOf = (i) => {
    let o = i - active;
    if (loop && n > 1) { o = ((o % n) + n) % n; if (o > Math.floor(n / 2)) o -= n; }
    return o;
  };
  useEffect(() => { const m = {}; items.forEach((it, i) => { m[it.id] = offsetOf(i); }); prevOff.current = m; });

  const onKey = (e) => {
    const k = e.key;
    if (k === "ArrowRight") { e.preventDefault(); next(); }
    else if (k === "ArrowLeft") { e.preventDefault(); prev(); }
    else if (k === "Home") { e.preventDefault(); go(0); }
    else if (k === "End") { e.preventDefault(); go(n - 1); }
  };

  const onDown = (e) => { if (e.button && e.button !== 0) return; drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false }; };
  const onMove = (e) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - d.y)) { d.moved = true; e.currentTarget.setPointerCapture?.(e.pointerId); }
    if (d.moved) setDragX(dx);
  };
  const onUp = (e) => {
    const d = drag.current; drag.current = null; if (!d) return;
    if (d.moved) {
      const dx = e.clientX - d.x; const v = Math.abs(dx) / Math.max(1, performance.now() - d.t); // px per ms
      if (Math.abs(dx) > 80 || v > 0.5) (dx < 0 ? next : prev)();
      // swallow the click that follows a drag
      const stop = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener("click", stop, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 0);
    }
    setDragX(0);
  };

  const spread = cardWidth * 0.74, step = cardWidth * 0.4;
  const shift = dragX / cardWidth; // live drag preview, in "cards"
  const atStart = !loop && active === 0, atEnd = !loop && active === n - 1;

  return (
    <div role="region" aria-roledescription="carrousel" aria-label={label} tabIndex={0} onKeyDown={onKey} className="cf-root"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }}
      style={{ position: "relative", outline: "none" }}>
      <style>{`
        .cf-root:focus-visible { outline: 2px solid ${accent} !important; outline-offset: 6px; border-radius: 18px; }
        .cf-card:focus-visible, .cf-pill:focus-visible { outline: 2px solid ${accent}; outline-offset: 3px; }
        .cf-pill { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 999px; border: 1px solid rgba(14,26,43,.14); background: #fff; color: ${ink}; font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 200ms, color 200ms, transform 160ms; }
        .cf-pill:hover:not(:disabled) { background: ${ink}; color: #fff; }
        .cf-pill:active:not(:disabled) { transform: scale(.96); }
        .cf-pill:disabled { opacity: .4; cursor: not-allowed; }
        @media (prefers-reduced-motion: reduce) { .cf-card { transition: opacity 1ms !important; } }
      `}</style>

      <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { drag.current = null; setDragX(0); }}
        style={{ position: "relative", height: cardHeight + 60, perspective: 1200, perspectiveOrigin: "50% 45%", touchAction: "pan-y", cursor: drag.current?.moved ? "grabbing" : "grab", overflow: "hidden" }}>
        {items.map((it, i) => {
          const off = offsetOf(i);
          const o = off + shift;
          const a = Math.abs(o), s = Math.sign(o);
          const visible = Math.abs(off) <= MAX_VISIBLE;
          const near = Math.min(a, 1);
          const x = s * (near * spread + Math.max(0, a - 1) * step);
          const rot = -s * near * 48;
          const z = -a * 140 - near * 40;
          const scale = Math.max(1 - a * 0.1, 0.6);
          const prevO = prevOff.current[it.id];
          const jump = prevO !== undefined && Math.abs(prevO - off) > 1;
          const isActive = off === 0;
          const tr = dragX ? "none" : jump ? "opacity 300ms ease" : `transform 520ms ${EASE}, opacity 360ms ease, filter 360ms ease`;
          return (
            <div key={it.id} className="cf-card" role="group" aria-roledescription="diapositive" aria-label={`${i + 1} sur ${n} : ${it.label}`} aria-hidden={!isActive}
              onClick={() => { if (!isActive && visible) go(i); }}
              style={{ position: "absolute", left: "50%", top: 24, width: cardWidth, height: cardHeight, marginLeft: -cardWidth / 2,
                transform: `translateX(${x}px) translateZ(${z}px) rotateY(${rot}deg) scale(${scale})`,
                opacity: visible ? 1 - Math.max(0, a - 2) * 0.5 : 0, visibility: visible ? "visible" : "hidden",
                zIndex: 100 - Math.round(a * 10), transition: tr, cursor: isActive ? "default" : "pointer",
                filter: isActive ? "none" : `brightness(${1 - near * 0.06})`, transformStyle: "preserve-3d", willChange: "transform" }}>
              {renderCard(it, { active: isActive })}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 6 }}>
        <button type="button" className="cf-pill" onClick={prev} disabled={atStart} aria-label="Précédent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>Précédent
        </button>
        <span aria-hidden="true" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#5E6E7F", minWidth: 56, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{n ? active + 1 : 0} / {n}</span>
        <button type="button" className="cf-pill" onClick={next} disabled={atEnd} aria-label="Suivant">
          Suivant<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>
      <div aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{n ? `${active + 1} sur ${n} : ${items[active].label}` : ""}</div>
    </div>
  );
}
