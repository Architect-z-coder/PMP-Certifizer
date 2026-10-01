import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

/*
  SqueezeCarousel — TRYOUT (not used by the app yet).
  Port of 21st.dev "Squeeze Carousel" by @yura (id 25474) to this codebase:
  plain JS, inline styles + one scoped <style> block, no Tailwind, no TypeScript.
  One wide open panel, the rest squeezed into slats; clicking a panel slides it open
  and the copy underneath cross-fades. Arrows, ←/→ keys, hover-grow, optional autoplay,
  honours prefers-reduced-motion.

  slides: [{ id, title, description, background | render, overlay, action, onAction }]
*/

const SHARES = [-0.06, 0.61, 0.3, 0.15];
const STRETCHED = [0, 0.71, 0.4, 0.25];
const SQUEEZED = [-0.12, 0.59, 0.28, 0.13];

const size = (v) => (typeof v === "number" ? `${v}px` : v);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(q.matches);
    read();
    q.addEventListener("change", read);
    return () => q.removeEventListener("change", read);
  }, []);
  return reduced;
}

const CSS = `
.sq-panel:focus-visible,.sq-arrow:focus-visible,.sq-action:focus-visible{outline:2px solid var(--sq-fill);outline-offset:2px}
.sq-arrow:hover,.sq-action:hover{opacity:.85}
.sq-action:hover .sq-chev{transform:translateX(2px)}
.sq-copy{display:flex;flex-direction:column;gap:16px}
.sq-text{font-size:15px}
@container (min-width: 640px){.sq-copy{flex-direction:row;align-items:flex-start;justify-content:space-between;gap:40px}.sq-text{font-size:17px}}
`;

export default function SqueezeCarousel({
  slides,
  defaultIndex = 0,
  onIndexChange,
  height = "clamp(180px, 32cqi, 340px)",
  slatWidth = 8,
  slatGap = 8,
  gap = 16,
  radius = 10,
  duration = 1000,
  hoverGrow = true,
  autoplay = false,
  interval = 6000,
  controls = true,
  accent = "#15263a",
  accentForeground = "#ffffff",
  textColor = "#15263a",
  mutedColor = "#5a6b7e",
  label = "Featured",
  style,
}) {
  const count = slides.length;
  const wrap = (i) => ((i % count) + count) % count;
  const slats = clamp(count - 4, 1, 3);
  const visible = 4 + slats;

  const reduced = useReducedMotion();
  const ms = reduced ? 0 : duration;
  const ids = useId();
  const seed = useRef(0);

  const [cards, setCards] = useState(() =>
    Array.from({ length: visible }, (_, p) => ({ key: seed.current++, slide: wrap(defaultIndex + p) }))
  );
  const [column, setColumn] = useState(0);
  const columnRef = useRef(0);
  const forward = useRef(true);
  const [slid, setSlid] = useState(0);
  const [still, setStill] = useState(false);
  const [hover, setHover] = useState(-1);
  const open = cards[-column]?.slide ?? defaultIndex;
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const settle = useCallback(() => {
    setCards((s) => (forward.current ? s.slice(-visible) : s.slice(0, visible)));
    columnRef.current = 0;
    setColumn(0);
    setSlid(0);
    setStill(true);
  }, [visible]);

  useLayoutEffect(() => {
    if (!still) return;
    const id = requestAnimationFrame(() => setStill(false));
    return () => cancelAnimationFrame(id);
  }, [still]);

  const step = useCallback(
    (by) => {
      if (count < 2 || by === 0) return;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      forward.current = by > 0;
      if (by > 0) {
        setCards((s) => [
          ...s,
          ...Array.from({ length: by }, (_, k) => ({ key: seed.current++, slide: wrap(s[s.length - 1].slide + 1 + k) })),
        ]);
        columnRef.current -= by;
        setColumn(columnRef.current);
        setSlid((x) => x - by);
      } else {
        setCards((s) => [
          ...Array.from({ length: -by }, (_, k) => ({ key: seed.current++, slide: wrap(s[0].slide - (-by - k)) })),
          ...s,
        ]);
        setSlid((x) => x + by);
        setStill(true);
        timers.current.push(window.setTimeout(() => setSlid(0), 0));
      }
      timers.current.push(window.setTimeout(settle, ms + 20));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, ms, settle]
  );

  useEffect(() => {
    onIndexChange?.(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!autoplay || paused || reduced || count < 2) return;
    const t = window.setTimeout(() => step(1), interval);
    return () => clearTimeout(t);
  }, [autoplay, paused, reduced, count, open, interval, step]);

  const onKeyDown = (e) => {
    const by = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (by === undefined) return;
    e.preventDefault();
    step(by);
  };

  if (!count) return null;

  const slat = size(slatWidth);
  const useBase = !(hoverGrow && hover >= 0 && hover <= 3 && !reduced);
  const shareOf = (col) => (useBase ? SHARES[col] : hover === col ? STRETCHED[col] : SQUEEZED[col]);
  const widthOf = (col) => {
    if (col < 0 || col > 3) return slat;
    if (col === 0) return `calc(var(--sq-hero) + var(--sq-room) * ${shareOf(0)})`;
    return `calc(var(--sq-room) * ${shareOf(col)})`;
  };

  const vars = {
    "--sq-h": size(height),
    "--sq-gap": size(gap),
    "--sq-slat-gap": size(slatGap),
    "--sq-radius": size(radius),
    "--sq-ms": `${ms}ms`,
    "--sq-ease": "cubic-bezier(0.16, 1, 0.3, 1)",
    "--sq-fill": accent,
    "--sq-on-fill": accentForeground,
    "--sq-hero": "calc(var(--sq-h) * 16 / 9)",
    "--sq-room": `calc(100cqi - var(--sq-hero) - ${slats} * var(--sq-slat-gap) - 3 * var(--sq-gap) - ${slats} * ${slat})`,
  };

  const arrowStyle = { width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 8, border: "none", cursor: "pointer", background: "var(--sq-fill)", color: "var(--sq-on-fill)", transition: "opacity .2s" };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", width: "100%", containerType: "inline-size", ...vars, ...style }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setHover(-1); }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <style>{CSS}</style>

      {controls && count > 1 && (
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="sq-arrow" aria-label="Précédent" onClick={() => step(-1)} style={arrowStyle}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M9.6 2.6 5.1 7.1h9.1v1.8H5.1l4.5 4.5-1.2 1.2-6-6L1.8 8l.6-.6 6-6 1.2 1.2Z" /></svg>
          </button>
          <button type="button" className="sq-arrow" aria-label="Suivant" onClick={() => step(1)} style={arrowStyle}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6.4 2.6l4.5 4.5H1.8v1.8h9.1l-4.5 4.5 1.2 1.2 6-6 .6-.6-.6-.6-6-6-1.2 1.2Z" /></svg>
          </button>
        </div>
      )}

      <div style={{ width: "100%", overflow: "hidden", height: "var(--sq-h)" }}>
        <div
          role="tablist"
          aria-label={label}
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          style={{
            display: "flex", height: "100%", width: "max-content",
            transform: `translateX(calc(${slid} * (${slat} + var(--sq-gap))))`,
            transition: still ? "none" : "transform var(--sq-ms) var(--sq-ease)",
          }}
        >
          {cards.map((card, place) => {
            const col = place + column;
            const s = slides[card.slide];
            const front = col === 0;
            return (
              <button
                key={card.key}
                type="button"
                role="tab"
                className="sq-panel"
                id={`${ids}-tab-${card.key}`}
                aria-selected={front}
                aria-controls={`${ids}-panel`}
                aria-label={s.title}
                tabIndex={front ? 0 : -1}
                onMouseMove={() => hoverGrow && setHover(col)}
                onClick={() => col > 0 && step(col)}
                style={{
                  position: "relative", isolation: "isolate", height: "100%", flexShrink: 0, cursor: "pointer",
                  overflow: "hidden", padding: 0, border: "none", background: "#dfe7ef",
                  width: widthOf(col),
                  marginLeft: place === 0 ? 0 : col < 4 ? "var(--sq-gap)" : "var(--sq-slat-gap)",
                  borderRadius: `min(var(--sq-radius), calc(${widthOf(col)} / 2))`,
                  transitionProperty: "width, margin-left",
                  transitionDuration: still ? "0s" : "var(--sq-ms)",
                  transitionTimingFunction: "var(--sq-ease)",
                }}
              >
                {/* Drawn at a fixed 16:9 block and centred: the card only changes how much you see. */}
                <span aria-hidden="true" style={{ position: "absolute", top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)", width: "var(--sq-hero)", minWidth: "100%", background: s.background }}>
                  {s.render ? s.render(front) : null}
                </span>
                {s.overlay && (
                  <span aria-hidden="true" style={{
                    pointerEvents: "none", position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", alignItems: "flex-end",
                    padding: "64px 20px 18px", opacity: front ? 1 : 0, transition: "opacity var(--sq-ms) var(--sq-ease)",
                    backgroundImage: "linear-gradient(to top, rgb(10 20 34 / 0.55), transparent)",
                  }}>{s.overlay}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div id={`${ids}-panel`} role="tabpanel" aria-live="polite" style={{ marginTop: 24, display: "grid" }}>
        {slides.map((s, i) => {
          const shown = i === open;
          return (
            <div key={s.id ?? i} aria-hidden={!shown} className="sq-copy" style={{
              gridColumnStart: 1, gridRowStart: 1,
              opacity: shown ? 1 : 0, visibility: shown ? "visible" : "hidden", pointerEvents: shown ? "auto" : "none",
              transition: "opacity var(--sq-ms) var(--sq-ease), visibility var(--sq-ms)",
            }}>
              <p className="sq-text" style={{ margin: 0, maxWidth: "46rem", lineHeight: 1.6, textWrap: "balance" }}>
                <span style={{ color: textColor, fontWeight: 500 }}>{s.title}</span>{" "}
                {s.description && <span style={{ color: mutedColor }}>{s.description}</span>}
              </p>
              {s.action && (
                <button type="button" className="sq-action" tabIndex={shown ? 0 : -1} onClick={s.onAction} disabled={!s.onAction}
                  style={{ display: "inline-flex", flexShrink: 0, alignItems: "center", gap: 8, borderRadius: 8, border: "none", cursor: s.onAction ? "pointer" : "default", background: "var(--sq-fill)", color: "var(--sq-on-fill)", padding: "10px 16px", fontSize: 14, fontWeight: 500, alignSelf: "flex-start", transition: "opacity .2s" }}>
                  {s.action}
                  <svg className="sq-chev" width="6" height="9" viewBox="0 0 6 9" fill="none" aria-hidden="true" style={{ transition: "transform .2s" }}><path d="M1.2 1 4.7 4.5 1.2 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
