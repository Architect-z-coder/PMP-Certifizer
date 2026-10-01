import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/*
  LinearCarousel — TRYOUT, not used by the app yet.
  Port of 21st.dev "Linear Carousel" (animbits, component 20150) to Certifizer's stack:
  plain JS, inline styles + one scoped style block, no motion library.

  - Endless horizontal strip (items rendered twice, scroll position wraps at the halfway point).
  - Drag with the mouse, native swipe on touch, ← / → buttons, optional slow drift (autoplay).
  - Clicking a card grows it into a dialog from the card's own position (the original's
    shared-element "layoutId" expansion, done with a FLIP-style transition).
  - Drift stops on hover, focus, drag, open dialog, hidden tab and prefers-reduced-motion.

  items: [{ id, category, title, art: ReactNode, detail: ReactNode }]
*/

const EASE = "cubic-bezier(.22,.9,.24,1)";
const reduced = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function LinearCarousel({ items, autoplay = true, speed = 28, label = "Carrousel", accent = "#E89A3C", ink = "#0E1A2B", textColor = "#16202E", mutedColor = "#5E6E7F" }) {
  const scroller = useRef(null);
  const drag = useRef({ down: false, moved: false, x: 0, sl: 0 });
  const smoothUntil = useRef(0);
  const [hover, setHover] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState(null); // { item, rect, origin }
  const [phase, setPhase] = useState("closed"); // closed | from | to
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [noMotion, setNoMotion] = useState(reduced);

  useEffect(() => {
    const on = () => setVw(window.innerWidth); window.addEventListener("resize", on);
    const mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setNoMotion(mq.matches); mq && mq.addEventListener("change", onMq);
    return () => { window.removeEventListener("resize", on); mq && mq.removeEventListener("change", onMq); };
  }, []);

  const narrow = vw < 640;
  const cardW = narrow ? 224 : 320, cardH = narrow ? 268 : 384, gap = 16, step = cardW + gap;

  const wrap = useCallback(() => {
    const el = scroller.current; if (!el) return;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    else if (el.scrollLeft <= 0) el.scrollLeft += half;
  }, []);

  // slow drift
  const running = autoplay && !noMotion && !hover && !focusIn && !dragging && !open;
  useEffect(() => {
    if (!running) return;
    let raf, last = performance.now(), acc = 0;
    const tick = (t) => {
      const el = scroller.current;
      if (el && !document.hidden && t > smoothUntil.current) {
        acc += (speed * (t - last)) / 1000;
        const whole = Math.floor(acc); // scrollLeft is integer in some engines
        if (whole) { el.scrollLeft += whole; acc -= whole; if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft -= el.scrollWidth / 2; }
      }
      last = t; raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, speed]);

  const nudge = (dir) => {
    const el = scroller.current; if (!el) return;
    const half = el.scrollWidth / 2;
    if (dir < 0 && el.scrollLeft - step <= 0) el.scrollLeft += half;
    if (dir > 0 && el.scrollLeft + step >= half) el.scrollLeft -= half;
    smoothUntil.current = performance.now() + (noMotion ? 0 : 600);
    el.scrollBy({ left: dir * step, behavior: noMotion ? "auto" : "smooth" });
  };

  const onScroll = () => { if (performance.now() > smoothUntil.current) wrap(); };

  // mouse drag (touch keeps native scrolling)
  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { down: true, moved: false, x: e.clientX, sl: scroller.current.scrollLeft };
  };
  const onPointerMove = (e) => {
    const d = drag.current; if (!d.down) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) { d.moved = true; setDragging(true); scroller.current.setPointerCapture?.(e.pointerId); }
    if (d.moved) {
      const el = scroller.current; const half = el.scrollWidth / 2;
      let sl = d.sl - dx * 1.4;
      if (sl >= half) { sl -= half; d.sl -= half; } else if (sl <= 0) { sl += half; d.sl += half; }
      el.scrollLeft = sl;
    }
  };
  const endDrag = () => { const d = drag.current; d.down = false; if (d.moved) setTimeout(() => { d.moved = false; setDragging(false); }, 0); };

  // expand-to-dialog
  const openCard = (item, el) => {
    if (drag.current.moved) return;
    const r = el.getBoundingClientRect();
    setOpen({ item, rect: { left: r.left, top: r.top, width: r.width, height: r.height }, origin: el });
    setPhase(noMotion ? "to" : "from");
  };
  useLayoutEffect(() => {
    if (phase !== "from" || !open) return;
    let r2; const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setPhase("to")); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [phase, open]);
  const close = useCallback(() => {
    if (!open) return;
    const origin = open.origin;
    const done = () => { setOpen(null); setPhase("closed"); origin && origin.focus({ preventScroll: true }); };
    if (noMotion) return done();
    // re-measure: the strip may have moved while the dialog was open (it doesn't drift, but be safe)
    const r = origin && origin.getBoundingClientRect();
    if (r) setOpen((o) => ({ ...o, rect: { left: r.left, top: r.top, width: r.width, height: r.height } }));
    setPhase("from");
    setTimeout(done, 460);
  }, [open, noMotion]);

  const dialogRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    const t = setTimeout(() => dialogRef.current?.querySelector("[data-close]")?.focus(), 30);
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "Tab" && dialogRef.current) {
        const f = [...dialogRef.current.querySelectorAll("button, [href], input, [tabindex]:not([tabindex='-1'])")].filter((x) => !x.disabled);
        if (!f.length) return; const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [open, close]);

  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const target = narrow
    ? { left: 12, top: 12, width: vw - 24, height: vh - 24 }
    : (() => { const w = Math.min(900, vw - 48), h = Math.min(540, vh - 48); return { left: (vw - w) / 2, top: (vh - h) / 2, width: w, height: h }; })();
  const box = open && (phase === "to" ? target : open.rect);
  const isTo = phase === "to";

  const doubled = [...items, ...items];

  return (
    <div role="region" aria-roledescription="carrousel" aria-label={label} style={{ position: "relative" }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocus={() => setFocusIn(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocusIn(false); }}>
      <style>{`
        .lc-strip { scrollbar-width: none; -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%); mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%); }
        .lc-strip::-webkit-scrollbar { display: none; }
        .lc-card { transition: transform 380ms ${EASE}, box-shadow 380ms ${EASE}; }
        .lc-card:hover { transform: translateY(-4px); box-shadow: 0 26px 40px -28px rgba(14,26,43,.55); }
        .lc-card:hover .lc-art { transform: scale(1.04); }
        .lc-art { transition: transform 700ms ${EASE}; }
        .lc-card:focus-visible, .lc-btn:focus-visible, .lc-dialog button:focus-visible { outline: 2px solid ${accent}; outline-offset: 3px; }
        .lc-btn { width: 40px; height: 40px; border-radius: 999px; border: 1px solid rgba(14,26,43,.14); background: #fff; color: ${ink}; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background 200ms, transform 200ms; }
        .lc-btn:hover { background: ${ink}; color: #fff; }
        .lc-btn:active { transform: scale(.94); }
        @media (prefers-reduced-motion: reduce) { .lc-card, .lc-art, .lc-dialog, .lc-dialog * { transition: none !important; } }
      `}</style>

      <div ref={scroller} className="lc-strip" onScroll={onScroll}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onPointerLeave={endDrag}
        style={{ display: "flex", gap, overflowX: "auto", padding: "8px 0 18px", cursor: dragging ? "grabbing" : "grab", userSelect: dragging ? "none" : undefined }}>
        {doubled.map((it, k) => {
          const clone = k >= items.length;
          return (
            <button key={`${it.id}-${k}`} type="button" className="lc-card" aria-haspopup="dialog" aria-hidden={clone || undefined} tabIndex={clone ? -1 : 0}
              aria-label={`${it.title} — ${it.category}. Ouvrir le détail`}
              onClick={(e) => openCard(it, e.currentTarget)}
              onDragStart={(e) => e.preventDefault()}
              style={{ position: "relative", flex: "0 0 auto", width: cardW, height: cardH, borderRadius: 24, overflow: "hidden", border: 0, padding: 0, background: ink, cursor: "inherit", textAlign: "left", visibility: open && open.item.id === it.id && !clone && isTo ? "hidden" : "visible" }}>
              <div className="lc-art" style={{ position: "absolute", inset: 0 }}>{it.art}</div>
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(14,26,43,.86) 0%, rgba(14,26,43,.25) 42%, transparent 62%)" }} />
              <div style={{ position: "absolute", left: 18, right: 18, bottom: 16, color: "#fff" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.8 }}>{it.category}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: narrow ? 18 : 22, lineHeight: 1.15, marginTop: 4 }}>{it.title}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" className="lc-btn" aria-label="Précédent" onClick={() => nudge(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button type="button" className="lc-btn" aria-label="Suivant" onClick={() => nudge(1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>

      {open && (
        <div className="lc-dialog" style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <div aria-hidden="true" onClick={close} style={{ position: "absolute", inset: 0, background: "rgba(14,26,43,.45)", backdropFilter: "blur(3px)", opacity: isTo ? 1 : 0, transition: `opacity 420ms ${EASE}` }} />
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="lc-dialog-title"
            style={{ position: "fixed", ...box, borderRadius: isTo ? 28 : 24, overflow: "hidden", background: "#fff", boxShadow: "0 40px 80px -30px rgba(14,26,43,.6)", transition: `left 460ms ${EASE}, top 460ms ${EASE}, width 460ms ${EASE}, height 460ms ${EASE}, border-radius 460ms ${EASE}`, display: "flex", flexDirection: narrow ? "column" : "row" }}>
            <div style={{ position: "relative", flex: narrow ? "0 0 38%" : `0 0 ${isTo ? "44%" : "100%"}`, transition: `flex-basis 460ms ${EASE}`, minHeight: 0, minWidth: 0 }}>
              <div style={{ position: "absolute", inset: 0 }}>{open.item.art}</div>
            </div>
            <div style={{ flex: "1 1 auto", minWidth: 0, overflowY: "auto", padding: narrow ? "20px 20px 24px" : "34px 36px", opacity: isTo ? 1 : 0, transform: isTo ? "none" : "translateY(8px)", transition: `opacity 320ms ${EASE} ${isTo ? 180 : 0}ms, transform 320ms ${EASE} ${isTo ? 180 : 0}ms`, color: textColor }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: mutedColor }}>{open.item.category}</div>
              <h3 id="lc-dialog-title" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: narrow ? 24 : 30, lineHeight: 1.1, margin: "6px 0 14px" }}>{open.item.title}</h3>
              {open.item.detail}
            </div>
            <button type="button" data-close aria-label="Fermer" onClick={close}
              style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: 999, border: 0, background: "rgba(255,255,255,.92)", color: ink, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px -6px rgba(14,26,43,.4)", opacity: isTo ? 1 : 0, transition: "opacity 200ms" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
