// Écran « Mes faiblesses » de l'interface Chantier (ui2) : une cible — le centre est maîtrisé, le bord est fragile —
// et, à droite, jusqu'à trois tâches à reprendre.
// Données : `mastery` (prop, App2) → taskRollup sur les 26 tâches ECO 2026 de pmp.js (score, réponses, état) ;
// getMissed(learner, false) → erreurs en file par zone de connaissance (Σ miss_count) ; `readiness.stale_mastered`
// (prop) → « À entretenir ». Le rayon d'un point EST son score ; aucun autre nombre n'est inventé.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./weaknesses.css";
import { getMissed } from "../../api.js";
import { ALL_TASKS, DOMAIN_BY_ID, DOMAIN_SHORT, L, STATE_TEXT, areaName, evidenceLine, nodeState, pct, taskRollup } from "../engine.js";
import { gsap, rise, useGsap } from "../motion.js";

/* ---------- target geometry (mock-up `targetSVG`: viewBox 460 wide, centre (230, 225), rings 62 / 118 / 174) ---------- */
const VB_W = 460, VB_H = 440, CX = 230, CY = 225;
const RINGS = [62, 118, 174];
const R_MIN = 20;                    // a perfect score sits 20 px from the centre
const R_OUTER = RINGS[2];            // a 0 score sits on the outer ring
const R_UNTESTED = 186;              // never opened: just outside the target
const SECTOR_PAD = 6;                // degrees kept free at both edges of a sector
const MAX_LINE = 22;                 // a label longer than this is split in two lines
const REM_MAX = 3;                   // cards on the right
const FRAGILE_MIN_ATTEMPTS = 3;      // nodeState rule of engine.js: < 50 % needs ≥ 3 answers to be called fragile
const EDGE = 4;                      // texts stay this far inside the viewBox

const rad = (deg) => (deg * Math.PI) / 180;
const polar = (deg, r) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];
const fx = (n) => Math.round(n * 10) / 10;

/** The three sectors, sized by exam weight (pmp.js ECO_DOMAINS.wt: 33 / 41 / 26), starting at −90° (top). */
function sectors() {
  let a0 = -90;
  return Object.values(DOMAIN_BY_ID).map((d) => {
    const sweep = ((d.wt || 0) / 100) * 360;
    const s = { id: d.id, wt: d.wt, a0, a1: a0 + sweep };
    a0 += sweep;
    return s;
  });
}

/** Split a long name in two lines at the space nearest its middle (labels must stay inside the viewBox). */
function wrapName(name) {
  if (name.length <= MAX_LINE) return [name];
  let best = -1;
  for (let i = 0; i < name.length; i++) if (name[i] === " " && (best < 0 || Math.abs(i - name.length / 2) < Math.abs(best - name.length / 2))) best = i;
  return best < 0 ? [name] : [name.slice(0, best), name.slice(best + 1)];
}

/* ---------- a small text placer: texts never cover a dot or another text when a free spot exists ---------- */
/** Estimated box of a text whose first baseline is at (x, y0). `cw` = average glyph width for that font size. */
function tbox(x, y0, anchor, lines, fs, lh, cw) {
  const w = Math.max(...lines.map((s) => s.length)) * cw;
  const l = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
  return { l, r: l + w, t: y0 - fs * 0.95, b: y0 + (lines.length - 1) * lh + fs * 0.25 };
}
const overlap = (a, b, pad = 2) => {
  const w = Math.min(a.r, b.r) - Math.max(a.l, b.l) + pad, h = Math.min(a.b, b.b) - Math.max(a.t, b.t) + pad;
  return w > 0 && h > 0 ? w * h : 0;
};
const inside = (b) => b.l >= EDGE && b.r <= VB_W - EDGE && b.t >= EDGE && b.b <= VB_H - EDGE;
/** First candidate (in order) that overlaps nothing; otherwise the one that overlaps least (weighted). */
function pick(cands, obstacles, own) {
  let best = null;
  for (const c of cands) {
    if (!inside(c.box)) continue;
    let cost = 0;
    for (const o of obstacles) { if (own && o.own === own) continue; cost += overlap(c.box, o) * o.w; }
    if (cost === 0) return c;
    if (!best || cost < best.cost) best = { ...c, cost };
  }
  return best || cands[0];
}

/** Place the 26 tasks on the target (radius = score, or just outside when untested), then the texts:
 *  sector names, ring words, and a label for each progress / fragile task. */
function layout(roll, lang) {
  const secs = sectors();
  const nodes = [];
  secs.forEach((s) => {
    const tasks = ALL_TASKS.filter((t) => t.d === s.id);
    const span = s.a1 - s.a0 - 2 * SECTOR_PAD;
    tasks.forEach((t, i) => {
      const r = roll[t.id] || { score: 0, attempts: 0, has: false };
      const state = nodeState(r);
      const ang = s.a0 + SECTOR_PAD + (tasks.length > 1 ? (span * i) / (tasks.length - 1) : span / 2);
      const radius = state === "untested" ? R_UNTESTED : R_MIN + (1 - r.score) * (R_OUTER - R_MIN);
      const [x, y] = polar(ang, radius);
      nodes.push({ task: t, d: s.id, state, score: r.score, attempts: r.attempts, has: r.has, x, y, dotR: state === "fragile" ? 11 : state === "progress" ? 7 : state === "mastered" ? 5.5 : 6 });
    });
  });
  // dots are data: they are placed first and every text avoids them (a ringed dot weighs more than a plain one)
  const obstacles = nodes.map((n) => ({ l: n.x - n.dotR - 1, r: n.x + n.dotR + 1, t: n.y - n.dotR - 1, b: n.y + n.dotR + 1, w: n.state === "fragile" || n.state === "progress" ? 3 : 1, own: n }));

  // sector names outside the outer ring, at the sector's middle angle when that spot is free
  const sectorLabels = secs.map((s) => {
    const txt = `${L(DOMAIN_SHORT[s.id], lang)} · ${s.wt} %`;
    const mid = (s.a0 + s.a1) / 2;
    const cands = [];
    [196, 204, 212].forEach((r) => [0, 8, -8, 16, -16].forEach((da) => { const [x, y] = polar(mid + da, r); cands.push({ x, y, anchor: "middle", box: tbox(x, y, "middle", [txt], 10.5, 12, 5.4) }); }));
    const c = pick(cands, obstacles);
    obstacles.push({ ...c.box, w: 4 });
    return { id: s.id, txt, x: c.x, y: c.y };
  });
  // ring words at the top of each ring, shifted left / right / down when a dot sits there
  const ringWords = RINGS.map((r, i) => {
    const txt = lang === "en" ? ["mastered", "in progress", "fragile"][i] : ["maîtrisé", "en cours", "fragile"][i];
    const y = CY - r + 14;
    const cands = [[CX, y, "middle"], [CX - 5, y, "end"], [CX + 5, y, "start"], [CX, y + 10, "middle"], [CX - 5, y + 10, "end"], [CX + 5, y + 10, "start"]]
      .map(([x, yy, anchor]) => ({ x, y: yy, anchor, box: tbox(x, yy, anchor, [txt], 8.5, 10, 5.4) }));
    const c = pick(cands, obstacles);
    obstacles.push({ ...c.box, w: 4 });
    return { txt, x: c.x, y: c.y, anchor: c.anchor };
  });
  // task labels: fragile first (they matter most), above or below the dot, elsewhere around it only when needed
  nodes.filter((n) => n.state === "fragile" || n.state === "progress")
    .sort((a, b) => (a.state === b.state ? b.attempts - a.attempts : a.state === "fragile" ? -1 : 1))
    .forEach((n) => {
      const big = n.state === "fragile";
      const fs = big ? 9.4 : 8.6, lh = fs * 1.15, cw = fs * (big ? 0.56 : 0.52);
      const lines = wrapName(L(n.task, lang));
      const w = Math.max(...lines.map((s) => s.length)) * cw;
      const xm = Math.min(Math.max(n.x, 40, EDGE + w / 2), VB_W - 40, VB_W - EDGE - w / 2);
      const R = n.dotR, extra = (lines.length - 1) * lh, d = R * 0.72 + 2;
      const N = (k) => ({ x: xm, y: n.y - (big ? 16 : 11) - extra - k * lh, anchor: "middle" });
      const S = (k) => ({ x: xm, y: n.y + (big ? 24 : 17) + k * lh, anchor: "middle" });
      const vmid = n.y + fs * 0.35 - extra / 2;
      const E = { x: n.x + R + 4, y: vmid, anchor: "start" }, W = { x: n.x - R - 4, y: vmid, anchor: "end" };
      const NE = { x: n.x + d, y: n.y - d - 2 - extra, anchor: "start" }, NW = { x: n.x - d, y: n.y - d - 2 - extra, anchor: "end" };
      const SE = { x: n.x + d, y: n.y + d + fs * 0.9, anchor: "start" }, SW = { x: n.x - d, y: n.y + d + fs * 0.9, anchor: "end" };
      const order = n.y < CY ? [N(0), S(0), NE, NW, E, W, SE, SW, N(1), S(1), N(2), S(2)] : [S(0), N(0), SE, SW, E, W, NE, NW, S(1), N(1), S(2), N(2)];
      const c = pick(order.map((o) => ({ ...o, box: tbox(o.x, o.y, o.anchor, lines, fs, lh, cw) })), obstacles, n);
      obstacles.push({ ...c.box, w: 4 });
      n.label = { x: c.x, y0: c.y, anchor: c.anchor, lines, lh, big };
    });
  return { secs, nodes, sectorLabels, ringWords };
}

/** One API call with its own loading / error state; a response that arrives after the learner changed is ignored. */
function useLoad(loader, deps) {
  const [st, setSt] = useState({ data: null, loading: true, error: false });
  const seq = useRef(0);
  const load = useCallback(() => {
    const id = ++seq.current;
    setSt({ data: null, loading: true, error: false });
    loader()
      .then((d) => { if (id === seq.current) setSt({ data: d, loading: false, error: false }); })
      .catch(() => { if (id === seq.current) setSt({ data: null, loading: false, error: true }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); return () => { seq.current++; }; }, [load]);
  return [st, load];
}

const EMPTY = { secs: [], nodes: [], sectorLabels: [], ringWords: [] };

export default function Weaknesses({ lang, learner, mastery, readiness, go, reduced }) {
  const T = (fr, en) => (lang === "en" ? en : fr);
  // FR: singular for 0 and 1 · EN: singular for 1 only
  const plural = (n, one, many) => ((lang === "en" ? n !== 1 : n > 1) ? many : one);
  const ready = mastery !== null && mastery !== undefined;

  // every unresolved miss, summed per knowledge area
  const [missed, loadMissed] = useLoad(() => getMissed(learner, false), [learner]);
  const errorsByArea = useMemo(() => {
    const out = {};
    const items = missed.data && Array.isArray(missed.data.items) ? missed.data.items : [];
    items.forEach((m) => { out[m.knowledge_area] = (out[m.knowledge_area] || 0) + (m.miss_count || 0); });
    return out;
  }, [missed.data]);

  const roll = useMemo(() => (ready ? taskRollup(mastery) : {}), [ready, mastery]);
  const { secs, nodes, sectorLabels, ringWords } = useMemo(() => (ready ? layout(roll, lang) : EMPTY), [ready, roll, lang]);

  const counts = { fragile: 0, progress: 0, mastered: 0, untested: 0 };
  nodes.forEach((n) => { counts[n.state] += 1; });
  const fragile = nodes.filter((n) => n.state === "fragile").sort((a, b) => b.attempts - a.attempts || a.score - b.score).slice(0, REM_MAX);
  const toConfirm = nodes.filter((n) => n.attempts > 0 && n.attempts < FRAGILE_MIN_ATTEMPTS && n.score < 0.5);
  const stale = readiness && Array.isArray(readiness.stale_mastered) ? readiness.stale_mastered : [];

  const root = useGsap((el) => {
    if (!ready) return;
    rise(el.querySelectorAll(".main > *"));
    const rings = el.querySelectorAll(".t-r");
    // GSAP pins an SVG element's transform-origin inline while it scales it; clearProps does not remove that pin.
    if (rings.length) gsap.from(rings, { scale: 0.6, transformOrigin: "50% 50%", opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", clearProps: "transform,opacity", onComplete: () => rings.forEach((r) => r.style.removeProperty("transform-origin")) });
    const dots = el.querySelectorAll(".t-n");
    if (dots.length) gsap.from(dots, { opacity: 0, duration: 0.4, stagger: 0.03, delay: 0.3, clearProps: "opacity" });
    const rems = el.querySelectorAll(".rem");
    if (rems.length) gsap.from(rems, { x: 16, opacity: 0, duration: 0.5, stagger: 0.12, delay: 0.2, ease: "power3.out", clearProps: "transform,opacity" });
  }, [ready], reduced);

  const errorsText = (area) => {
    if (missed.loading) return T("erreurs en file : chargement…", "errors queued: loading…");
    if (missed.error) return T("erreurs en file : indisponibles", "errors queued: unavailable");
    const n = errorsByArea[area] || 0;
    return `${n}\u00a0${plural(n, T("erreur en file", "error queued"), T("erreurs en file", "errors queued"))}`;
  };
  const stateTitle = (n) => `${L(n.task, lang)} · ${L(STATE_TEXT[n.state], lang)} · ${evidenceLine(n, lang)}`;

  return (
    <div className="main weak" ref={root}>
      <div className="hd">
        <h3>{T("Vos faiblesses", "Your weaknesses")}</h3>
        <div className="row">
          {ready && (
            <span className="chip wrap">
              {counts.fragile}{"\u00a0"}{plural(counts.fragile, "fragile", T("fragiles", "fragile"))} · {counts.progress}{"\u00a0"}{T("en cours", "in progress")} · {counts.mastered}{"\u00a0"}{plural(counts.mastered, T("maîtrisée", "mastered"), T("maîtrisées", "mastered"))} · {counts.untested}{"\u00a0"}{T("à ouvrir", "to open")}
            </span>
          )}
          <button type="button" className="btn btn-g btn-s" onClick={() => go("map")}>{T("Carte de maîtrise", "Mastery map")} →</button>
        </div>
      </div>

      {!ready ? <p className="muted">{T("Chargement…", "Loading…")}</p> : (
        <div className="g21 tgt">
          {/* ---------- the target ---------- */}
          <div className="tcol">
            <svg className="tmap" viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label={T("Carte des faiblesses : le centre est maîtrisé, le bord est fragile", "Weakness map: the centre is mastered, the edge is fragile")}>
              {secs.map((s) => {
                const R = R_OUTER + 2;
                const [x1, y1] = polar(s.a0, R), [x2, y2] = polar(s.a1, R);
                return <path key={s.id} className={`t-sec ${s.id}`} d={`M${CX} ${CY} L${fx(x1)} ${fx(y1)} A${R} ${R} 0 ${s.a1 - s.a0 > 180 ? 1 : 0} 1 ${fx(x2)} ${fx(y2)} Z`} />;
              })}
              {RINGS.map((r) => <circle key={r} className="t-r" cx={CX} cy={CY} r={r} />)}
              {secs.map((s) => { const [x, y] = polar(s.a0, R_OUTER + 2); return <line key={s.id} className="t-sep" x1={CX} y1={CY} x2={fx(x)} y2={fx(y)} />; })}
              {sectorLabels.map((f) => <text key={f.id} className="t-sl" x={fx(f.x)} y={fx(f.y)} textAnchor="middle" fill={`var(--${f.id})`}>{f.txt}</text>)}
              {ringWords.map((w) => <text key={w.txt} className="t-rl" x={fx(w.x)} y={fx(w.y)} textAnchor={w.anchor}>{w.txt}</text>)}
              {nodes.map((n) => {
                const x = fx(n.x), y = fx(n.y);
                return (
                  <g className={`t-n ${n.state}`} key={n.task.id}>
                    <title>{stateTitle(n)}</title>
                    {n.state === "mastered" && <circle className="t-ok" cx={x} cy={y} r={5.5} />}
                    {n.state === "progress" && <><circle className="t-ring now" cx={x} cy={y} r={7} /><circle className="t-dot" cx={x} cy={y} r={3.2} /></>}
                    {n.state === "fragile" && <><circle className="t-ring weak" cx={x} cy={y} r={11} /><text className="t-x" x={x} y={fx(n.y + 3.6)} textAnchor="middle">!</text></>}
                    {n.state === "untested" && <circle className="t-ring open" cx={x} cy={y} r={6} />}
                    {n.label && (
                      <text className={`t-l ${n.label.big ? "b" : ""}`} x={fx(n.label.x)} y={fx(n.label.y0)} textAnchor={n.label.anchor}>
                        {n.label.lines.map((s, i) => <tspan key={i} x={fx(n.label.x)} dy={i === 0 ? 0 : fx(n.label.lh)}>{s}</tspan>)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <p className="muted tfoot">
              {T("Plus c'est loin du centre, plus c'est à travailler.", "The further from the centre, the more work.")}{" "}
              {T("La taille d'un secteur, c'est son poids à l'examen. Les points verts sans nom sont maîtrisés ; les cercles pointillés hors cible ne sont pas encore ouverts.", "A sector's size is its weight at the exam. Unnamed green dots are mastered; the dashed circles outside the target are not open yet.")}
            </p>
          </div>

          {/* ---------- the remedies ---------- */}
          <div className="rems">
            {missed.error && (
              <div className="card flat">
                <span className="k">{T("Erreurs en file", "Errors queued")}</span>
                <div className="row"><button type="button" className="btn btn-g btn-s" onClick={loadMissed}>{T("Le serveur se réveille — réessayer", "The server is waking up — retry")}</button></div>
              </div>
            )}
            {fragile.length === 0 ? (
              <section className="card nofrag">
                <h4>{T("Aucune faiblesse confirmée pour l'instant", "No confirmed weakness for now")}</h4>
                <p className="muted">{T("Il faut au moins trois réponses sous 50 % sur une tâche pour la dire fragile.", "A task needs at least three answers under 50 % to be called fragile.")}</p>
                <div className="row"><button type="button" className="btn btn-p btn-s" onClick={() => go("quiz")}>{T("Me tester", "Quiz me")} →</button></div>
              </section>
            ) : fragile.map((n, i) => (
              <section className={`rem d-${n.d}`} key={n.task.id} aria-label={`${i + 1} · ${L(n.task, lang)}`}>
                <div className="row top">
                  <span className="soon kind">{T("Genre et cause : bientôt", "Kind and cause: soon")}</span>
                  <span className="mono muted rank">{i + 1}</span>
                </div>
                <h4>{L(n.task, lang)}</h4>
                <p>
                  {errorsText(n.task.area)} · {T("zone", "area")} {areaName(n.task.area, lang)} · {n.attempts}{"\u00a0"}{plural(n.attempts, T("réponse", "answer"), T("réponses", "answers"))} · score {pct(n.score)}{"\u00a0"}%
                </p>
                <button type="button" className="btn btn-p btn-s" onClick={() => go("quiz", { area: n.task.area })}>{T("Me tester · ce sujet", "Quiz me · this topic")} →</button>
              </section>
            ))}
            {(toConfirm.length > 0 || stale.length > 0) && (
              <p className="muted notes">
                {toConfirm.length > 0 && (
                  <span className="note">
                    <b>{T("À confirmer", "To confirm")}</b> · {toConfirm.map((n) => `${L(n.task, lang)} (${n.attempts}\u00a0${plural(n.attempts, T("réponse", "answer"), T("réponses", "answers"))})`).join(", ")} : {T("trop tôt pour conclure.", "too early to conclude.")}
                  </span>
                )}
                {stale.length > 0 && (
                  <span className="note">
                    <b>{T("À entretenir", "To maintain")}</b> · {stale.map((s) => `${areaName(s.area, lang)} (${pct(s.score)}\u00a0%), ${T("pas revu depuis plus de", "not reviewed for more than")} ${s.level === "stale" ? 14 : 30}\u00a0${T("jours", "days")}.`).join(" ")}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
