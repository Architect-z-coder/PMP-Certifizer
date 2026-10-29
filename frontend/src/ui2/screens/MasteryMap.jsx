// Écran « Carte et chemin critique » de l'interface Chantier (ui2) : les 12 stations de la maquette, de gauche à
// droite par niveau. L'état de chaque station vient de `mastery` (taskRollup → aggregate → nodeState), la route ambre
// de `readiness.top_levers` (STATION_OF_ENGINE). Rien n'est inventé : chaque nombre est un champ de l'API, avec son
// nombre de réponses (evidenceLine). Pas de journal du jour, pas de « théorie / pratique réelle », pas d'examen blanc :
// l'API ne les fournit pas → « bientôt ».
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./masterymap.css";
import { DOMAIN_CHIP, DOMAIN_OF_KEY, DOMAIN_SHORT, L, STATE_CHIP, STATE_TEXT, TASK_BY_ID, aggregate, evidenceLine, nodeState, pct, taskRollup } from "../engine.js";
import { COLS, LEVELS, LINKS, STATIONS, STATION_BY_ID, STATION_OF_ENGINE } from "../stations.js";
import { gsap, rise, useGsap } from "../motion.js";

const R = 14; // node radius, as drawn in the mock-up (760×420 viewBox)
const labelW = (t) => Math.min(150, t.length * 5.1 + 16);
const badgeW = (t) => t.length * 5 + 16;
const f1 = (n) => Math.round(n * 10) / 10;

/** Soft cubic link between two station centres, shortened by the node radius (a little more at the arrow end). */
function edgePath(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const x1 = a.x + ux * (R + 3), y1 = a.y + uy * (R + 3), x2 = b.x - ux * (R + 7), y2 = b.y - uy * (R + 7);
  const k = Math.abs(x2 - x1) * 0.5;
  return `M${f1(x1)} ${f1(y1)} C${f1(x1 + k)} ${f1(y1)} ${f1(x2 - k)} ${f1(y2)} ${f1(x2)} ${f1(y2)}`;
}

/** The glyph of a station: full disc + check (mastered) · ring + dot (progress) · ring + ! (fragile) ·
 *  dashed ring (untested) · dashed ring + lock (N12, not in the API yet). */
function Glyph({ state, x, y }) {
  if (state === "mastered") return <><circle className="g-full" cx={x} cy={y} r={R} /><path className="g-check" d={`M${x - 6} ${y} l4 4 l8 -8`} /></>;
  if (state === "progress") return <><circle className="g-ring progress" cx={x} cy={y} r={R} /><circle className="g-dot" cx={x} cy={y} r="4" /></>;
  if (state === "fragile") return <><circle className="g-ring fragile" cx={x} cy={y} r={R} /><path className="g-bang" d={`M${x} ${y - 6} v7 M${x} ${y + 5} v1.5`} /></>;
  if (state === "lock") return <><circle className="g-ring lock" cx={x} cy={y} r={R} /><rect className="g-lock" x={x - 4.5} y={y - 1} width="9" height="7" rx="1.5" /><path className="g-lock" d={`M${x - 3} ${y - 1} v-2.5 a3 3 0 0 1 6 0 v2.5`} /></>;
  return <circle className="g-ring untested" cx={x} cy={y} r={R} />;
}

export default function MasteryMap({ lang, mastery, readiness, go, refresh, reduced }) {
  const T = (fr, en) => (lang === "en" ? en : fr);
  const ready = mastery !== null && readiness !== null;

  // after 8 s of loading, offer a reload (the free-tier backend may be waking up); nothing is shown as zero meanwhile
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (ready) { setSlow(false); return undefined; }
    const id = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(id);
  }, [ready]);

  // station states from getMastery()
  const roll = useMemo(() => taskRollup(mastery), [mastery]);
  const nodes = useMemo(() => STATIONS.map((s) => {
    const agg = aggregate(s.tasks, roll);
    return { s, agg, state: s.soon ? "lock" : nodeState(agg) };
  }), [roll]);

  // amber route from getReadiness().top_levers (engine ids PE1…BE8 → stations, ordered, unique)
  const levers = readiness && Array.isArray(readiness.top_levers) ? readiness.top_levers : null;
  const routeIds = useMemo(() => {
    const out = [];
    (levers || []).forEach((lv) => { const id = STATION_OF_ENGINE[lv.area]; if (id && !out.includes(id)) out.push(id); });
    return out;
  }, [levers]);
  const stepOf = useMemo(() => Object.fromEntries(routeIds.map((id, i) => [id, i + 1])), [routeIds]);
  const first = routeIds.length ? STATION_BY_ID[routeIds[0]] : null;

  // selection: default = first station of the route, else N1
  const [picked, setPicked] = useState(null);
  const selectedId = picked && STATION_BY_ID[picked] ? picked : (routeIds[0] || "N1");
  const sel = nodes.find((n) => n.s.id === selectedId) || nodes[0];
  const select = (id) => setPicked(id);

  const nodeLabel = (n) => (n.s.soon ? T("Examen blanc · bientôt", "Mock exam · soon") : L(n.s, lang));
  const stateText = (n) => (n.state === "lock" ? T("Pas encore ouvert · bientôt", "Not open yet · soon") : L(STATE_TEXT[n.state], lang));

  // entrance (once data is loaded): rise of the blocks, nodes fade in with a short stagger, the route draws itself
  const root = useGsap((el) => {
    if (!ready) return;
    rise(el.querySelectorAll(".main > *"));
    gsap.from(el.querySelectorAll(".jmap .nd"), { opacity: 0, duration: 0.4, stagger: 0.03, delay: 0.15, ease: "power2.out", clearProps: "opacity" });
    const nx = el.querySelector(".jmap .next");
    if (nx && typeof nx.getTotalLength === "function") {
      const len = nx.getTotalLength();
      if (len > 0) gsap.fromTo(nx, { strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.2, delay: 0.5, ease: "power2.inOut", onComplete: () => gsap.set(nx, { clearProps: "strokeDasharray,strokeDashoffset" }) });
    }
    const here = el.querySelector(".jmap .here");
    if (here) gsap.from(here, { opacity: 0, duration: 0.4, delay: 1.4, clearProps: "opacity" });
  }, [ready], reduced);

  // the dark card rises on each selection change (not on the first paint: the entrance already covers it)
  const firstSel = useRef(true);
  const side = useGsap((el) => {
    if (!ready) return;
    if (firstSel.current) { firstSel.current = false; return; }
    rise(Array.from(el.children), { duration: 0.32, stagger: 0.04 });
  }, [selectedId, ready], reduced);

  if (!ready) {
    return (
      <div className="main mm">
        <div className="hd"><h3>{T("Carte de maîtrise", "Mastery map")}</h3></div>
        <div className="card">
          <p className="muted" aria-live="polite">{T("Chargement…", "Loading…")}</p>
          {slow && (
            <div className="row">
              <button type="button" className="btn btn-g" onClick={() => refresh && refresh()}>{T("Le serveur se réveille — réessayer", "The server is waking up — retry")}</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const selName = nodeLabel(sel);
  const selStep = stepOf[sel.s.id];
  const leverCount = levers ? levers.length : 0;

  return (
    <div className="main mm" ref={root}>
      <div className="hd">
        <h3>{T("Carte de maîtrise", "Mastery map")}</h3>
        <div className="row">
          <button type="button" className="btn btn-g btn-s" onClick={() => go("weak")}>{T("Mes faiblesses", "My weaknesses")} →</button>
          <button type="button" className="btn btn-p btn-s" onClick={() => go("quiz")}>{T("Me tester", "Quiz me")}</button>
        </div>
      </div>

      <div className="jleg" role="list" aria-label={T("Légende", "Legend")}>
        <span role="listitem"><i className="i-full" aria-hidden="true" />{T("Maîtrisé", "Mastered")}</span>
        <span role="listitem"><i className="i-now" aria-hidden="true" />{T("En cours", "In progress")}</span>
        <span role="listitem"><i className="i-weak" aria-hidden="true" />{T("Fragile · à reprendre", "Fragile · to redo")}</span>
        <span role="listitem"><i className="i-lock" aria-hidden="true" />{T("Pas encore ouvert", "Not open yet")}</span>
        <span role="listitem" className="soon">{T("théorie / pratique réelle : bientôt", "theory / real practice: soon")}</span>
        <span role="listitem" className="lvl">{T("Niveaux : connaître → appliquer → décider en situation → juger sous pression", "Levels: know → apply → decide in context → judge under pressure")}</span>
      </div>

      <div className="g21 mm-grid">
        <div className="mapbox">
          <svg className="jmap" viewBox="0 0 760 420" role="group" aria-label={T("Carte de maîtrise : douze stations, de gauche à droite par niveau", "Mastery map: twelve stations, left to right by level")}>
            <defs>
              <pattern id="mm-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="var(--line)" /></pattern>
              <marker id="mm-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="var(--line)" strokeWidth="1.6" /></marker>
            </defs>
            <rect x="0" y="0" width="760" height="420" rx="14" fill="url(#mm-dots)" />
            {LEVELS.map((lv, k) => (
              <g key={k}>
                {k < LEVELS.length - 1 && <line className="col" x1={COLS[k + 1]} y1="30" x2={COLS[k + 1]} y2="392" />}
                <text className="lv" x={(COLS[k] + COLS[k + 1]) / 2} y="408" textAnchor="middle">{lang === "en" ? lv[1] : lv[0]}</text>
              </g>
            ))}
            {LINKS.map(([a, b]) => (STATION_BY_ID[a] && STATION_BY_ID[b] ? <path key={`${a}-${b}`} className="ed" d={edgePath(STATION_BY_ID[a], STATION_BY_ID[b])} markerEnd="url(#mm-arr)" /> : null))}
            {routeIds.length > 1 && <polyline className="next" points={routeIds.map((id) => `${STATION_BY_ID[id].x},${STATION_BY_ID[id].y}`).join(" ")} />}
            {first && <circle className="halo" cx={first.x} cy={first.y} r="16" />}
            {nodes.map((n) => {
              const { s } = n;
              const name = nodeLabel(n);
              const w = labelW(name);
              const lx = Math.min(Math.max(s.x - w / 2, 4), 760 - 4 - w); // the pill stays inside the drawing
              const step = stepOf[s.id];
              const stepTxt = step ? T(`étape ${step}`, `step ${step}`) : null;
              const bw = stepTxt ? badgeW(stepTxt) : 0;
              const isSel = s.id === selectedId;
              const aria = `${name} · ${stateText(n)}${s.soon ? "" : ` · ${evidenceLine(n.agg, lang)}`}`;
              return (
                <g key={s.id} className={`nd ${isSel ? "sel" : ""}`} role="button" tabIndex={0} aria-label={aria} aria-pressed={isSel}
                  onClick={() => select(s.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(s.id); } }}>
                  <circle className="hit" cx={s.x} cy={s.y} r="43" fill="none" pointerEvents="all" />
                  <Glyph state={n.state} x={s.x} y={s.y} />
                  <rect className="lblbg" x={f1(lx)} y={s.y + 22} width={f1(w)} height="18" rx="5" />
                  <text className="lbl" x={f1(lx + w / 2)} y={s.y + 34.3} textAnchor="middle">{name}</text>
                  {stepTxt && (
                    <g className="bdg">
                      <rect x={f1(s.x - bw / 2)} y={s.y + 44} width={bw} height="15" rx="7.5" />
                      <text x={s.x} y={s.y + 54.6} textAnchor="middle">{stepTxt}</text>
                    </g>
                  )}
                </g>
              );
            })}
            {first && <text className="here" x={first.x} y={first.y - 24} textAnchor="middle">{T("vous êtes ici", "you are here")}</text>}
          </svg>
          <p className="cap">
            {leverCount
              ? T(`Route ambre : les ${leverCount} leviers du moteur, poids à l'examen × (1 − maîtrise).`, `Amber route: the engine's ${leverCount} levers, exam weight × (1 − mastery).`)
              : <span className="soon">{T("Chemin critique : bientôt", "Critical path: soon")}</span>}
          </p>
        </div>

        <div className="card path">
          <span className="k">{T("Chemin critique", "Critical path")}</span>
          {leverCount ? (
            <div className="list levers">
              {levers.map((lv, i) => {
                const sid = STATION_OF_ENGINE[lv.area] || null;
                const dk = DOMAIN_OF_KEY[lv.domain];
                return (
                  <button type="button" key={`${lv.area}-${i}`} aria-pressed={!!sid && sid === selectedId}
                    onClick={() => (sid ? select(sid) : go("quiz"))}>
                    <span className="ix" aria-hidden="true">{i + 1}</span>
                    <span className="nm">{L(lv, lang)}</span>
                    <span className={`chip ${(dk && DOMAIN_CHIP[dk]) || ""}`}>{dk ? L(DOMAIN_SHORT[dk], lang) : lv.domain}</span>
                    <span className="mono">{pct(lv.score)} %</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="soon">{T("Chemin critique : bientôt", "Critical path: soon")}</span>
          )}
        </div>

        <div className="card dark side" ref={side}>
          <span className="k">{stateText(sel)}</span>
          <h4>{selName}</h4>
          {sel.s.soon
            ? <p className="muted ev">{T("L'examen blanc n'existe pas encore dans cette version.", "The mock exam does not exist yet in this version.")}</p>
            : <span className="ev">{evidenceLine(sel.agg, lang)}</span>}
          {sel.s.tasks.length > 0 && (
            <div className="list tasks">
              {sel.s.tasks.map((tid) => {
                const t = TASK_BY_ID[tid];
                if (!t) return null;
                const r = roll[tid];
                const st = nodeState(r);
                return (
                  <div key={tid}>
                    <span className="tname">{L(t, lang)}</span>
                    <span className="tr">
                      <span className={`chip ${STATE_CHIP[st] || "nt"}`}>{L(STATE_TEXT[st], lang)}</span>
                      <span className="mono">{evidenceLine(r, lang)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {selStep && <span className="stp">{T(`Étape ${selStep} du chemin critique`, `Step ${selStep} of the critical path`)}</span>}
          {sel.s.soon
            ? <span className="soon">{T("Examen blanc : bientôt", "Mock exam: soon")}</span>
            : <div className="row act"><button type="button" className="btn btn-p" onClick={() => go("quiz", { area: sel.s.area })}>{T("Me tester sur ce sujet", "Quiz me on this topic")}</button></div>}
        </div>
      </div>
    </div>
  );
}
