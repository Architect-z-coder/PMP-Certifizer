import React, { useState, useMemo } from "react";
import { C, ECO_DOMAINS, ECO_TASKS, PT } from "./pmp.js";

/*
  CarteMentale — the PMP mind-map that lives INSIDE "Ma préparation".
  Data model (all real, no backend change):
   - mastery: rows [{area, score, attempts, days_since?, light}] from getMastery()
   - readiness: {score, label, domains:{people,process,biz:{score,weight}}}
   - levers: top_levers[] from getReadiness() -> the "chemin critique" (exam_weight x weakness)
   - onStudyArea(area): jumps into quiz mode for that KA/area (same as leviers)
  The 13-theme grouping is pure frontend, computed from ECO_TASKS.
*/

// --- 13-theme grouping of the 26 ECO tasks (frontend-only, memorable) ---
const THEMES = [
  { id: "t1", d: "people", fr: "Mener l'équipe", en: "Lead the team", sub: ["pe3", "pe4", "pe1"] },
  { id: "t2", d: "people", fr: "Tensions & accord", en: "Tension & agreement", sub: ["pe2", "pe6"] },
  { id: "t3", d: "people", fr: "Impliquer", en: "Engage", sub: ["pe5", "pe8"] },
  { id: "t4", d: "people", fr: "Transmettre", en: "Transfer knowledge", sub: ["pe7"] },
  { id: "t5", d: "process", fr: "Cadrer", en: "Frame", sub: ["pr1", "pr2"] },
  { id: "t6", d: "process", fr: "Temps & argent", en: "Time & money", sub: ["pr8", "pr6"] },
  { id: "t7", d: "process", fr: "Ressources & achats", en: "Resources & procurement", sub: ["pr4", "pr5"] },
  { id: "t8", d: "process", fr: "Qualité & valeur", en: "Quality & value", sub: ["pr7", "pr3"] },
  { id: "t9", d: "process", fr: "Suivre & clôturer", en: "Track & close", sub: ["pr9", "pr10"] },
  { id: "t10", d: "biz", fr: "Gouvernance", en: "Governance", sub: ["be1", "be2"] },
  { id: "t11", d: "biz", fr: "Risques", en: "Risk", sub: ["be4"] },
  { id: "t12", d: "biz", fr: "Changement", en: "Change", sub: ["be3", "be6"] },
  { id: "t13", d: "biz", fr: "Valeur & externe", en: "Value & external", sub: ["be7", "be5", "be8"] },
];

// domain id normalisation: ECO_DOMAINS uses people/process/biz
const DOMSHORT = {
  people: { fr: "Les gens", en: "People" },
  process: { fr: "Le projet", en: "Process" },
  biz: { fr: "L'entreprise", en: "Business" },
};
const DOMSUB = {
  people: { fr: "équipe · parties prenantes", en: "team · stakeholders" },
  process: { fr: "planifier · exécuter · contrôler", en: "plan · execute · control" },
  biz: { fr: "valeur · gouvernance · risques", en: "value · governance · risk" },
};
const DOMC = Object.fromEntries(ECO_DOMAINS.map((d) => [d.id, d.c]));

// flatten ECO tasks -> {id,d,fr,en,area}
const ALL_TASKS = [];
["people", "process", "biz"].forEach((d) => {
  (ECO_TASKS[d] || []).forEach((t) => ALL_TASKS.push({ id: t.id, d, fr: t.fr, en: t.en, area: t.area }));
});
const TASK_BY_ID = Object.fromEntries(ALL_TASKS.map((t) => [t.id, t]));

function nodeColor(o) {
  if (o.untested) return "#C9D6E0";
  return o.m >= 0.75 ? "#3DA776" : o.m >= 0.5 ? "#E8A765" : "#D2664E";
}

export default function CarteMentale({ lang, readiness, levers, features, masteryByArea, onStudyArea, isMobile }) {
  const [dens, setDens] = useState(13);
  const [selected, setSelected] = useState(null);
  const [focus, setFocus] = useState(false);
  const [pres, setPres] = useState(false);
  const [mapUpgrade, setMapUpgrade] = useState(false);
  const L = (o) => (lang === "en" ? o.en : o.fr);

  // mastery lookup per area -> {score, attempts, days_since}
  const mA = masteryByArea || {};
  function taskInfo(id) {
    const t = TASK_BY_ID[id];
    const row = mA[t.area];
    const attempts = row ? row.attempts || 0 : 0;
    const m = attempts > 0 ? row.score : 0;
    const days = row && row.days_since != null ? row.days_since : null;
    const stale = attempts > 0 && m >= 0.75 && days != null && days > 21;
    const miss = row && row.light === "red" && attempts > 0 && m < 0.5;
    return { id, d: t.d, l: L(t), area: t.area, m, attempts, untested: attempts === 0, stale, miss };
  }
  function themeInfo(th) {
    const infos = th.sub.map(taskInfo);
    const tested = infos.filter((i) => !i.untested);
    const m = tested.length ? tested.reduce((s, i) => s + i.m, 0) / tested.length : 0;
    return {
      id: th.id, d: th.d, l: L(th), m,
      untested: tested.length === 0,
      stale: infos.some((i) => i.stale),
      miss: infos.some((i) => i.miss),
      sub: th.sub,
    };
  }

  // recommended path = "chemin critique" from top_levers (map area -> a node in current density)
  const recNodeIds = useMemo(() => {
    const areas = (levers || []).map((l) => l.area);
    const ids = [];
    areas.forEach((area) => {
      if (dens === 26) {
        const t = ALL_TASKS.find((t) => t.area === area);
        if (t && ids.indexOf(t.id) < 0) ids.push(t.id);
      } else {
        const th = THEMES.find((th) => th.sub.some((sid) => TASK_BY_ID[sid].area === area));
        if (th && ids.indexOf(th.id) < 0) ids.push(th.id);
      }
    });
    return ids.slice(0, 4);
  }, [levers, dens]);

  // Freemium gate: the critical path is a premium intelligent feature.
  // Free plan gets a preview (first N steps); the rest is teased, not hidden.
  const cpFeature = features && features.full_critical_path;
  const cpPreview = cpFeature && cpFeature.access === "preview";
  const cpLimit = (cpFeature && cpFeature.preview_limit) || 2;
  const recNodeShown = cpPreview ? recNodeIds.slice(0, cpLimit) : recNodeIds;
  const cpHidden = Math.max(0, recNodeIds.length - recNodeShown.length);
  const recIndex = (id) => { const i = recNodeShown.indexOf(id); return i < 0 ? 0 : i + 1; };

  // nodes for current density
  const nodes = dens === 13 ? THEMES.map((t) => ({ id: t.id, d: t.d })) : ALL_TASKS.map((t) => ({ id: t.id, d: t.d }));
  const infoOf = (id) => (dens === 13 ? themeInfo(THEMES.find((t) => t.id === id)) : taskInfo(id));

  // --- layout: fixed asymmetric hubs, calculated fan-out (no overlap) ---
  const CENTER = { x: 470, y: 350 };
  const HUB = { people: { x: 250, y: 210 }, process: { x: 720, y: 205 }, biz: { x: 690, y: 490 } };
  const P = useMemo(() => {
    const pos = {}; const byDom = { people: [], process: [], biz: [] };
    nodes.forEach((n) => byDom[n.d].push(n.id));
    ["people", "process", "biz"].forEach((d) => {
      const hub = HUB[d], list = byDom[d], n = list.length;
      const outA = Math.atan2(hub.y - CENTER.y, hub.x - CENTER.x);
      const spread = Math.PI * (n > 6 ? 1.25 : n > 3 ? 0.95 : 0.6);
      const R = n > 6 ? 150 : 120, start = outA - spread / 2;
      list.forEach((id, i) => {
        const a = n > 1 ? start + spread * (i / (n - 1)) : outA;
        const rr = R + (i % 2 ? 22 : 0);
        pos[id] = { x: hub.x + Math.cos(a) * rr, y: hub.y + Math.sin(a) * rr };
      });
    });
    return pos;
  }, [dens, nodes.length]);

  const pct = readiness ? Math.round(readiness.score * 100) : 0;
  const t = (fr, en) => (lang === "en" ? en : fr);

  // ---- side panel content ----
  function statusInfo(o) {
    if (o.untested) return { t: t("À découvrir", "To discover"), e: "⚪", c: "#7E8B99" };
    if (o.stale) return { t: t("Maîtrisé — révision d’entretien recommandée", "Mastered — maintenance review recommended"), e: "🔄", c: "#E89A3C" };
    if (o.miss) return { t: t("À revoir — réponses incorrectes récentes", "To review — recent incorrect answers"), e: "📌", c: "#D2664E" };
    if (o.m >= 0.75) return { t: t("Sujet maîtrisé", "Mastered"), e: "✅", c: "#3DA776" };
    if (o.m >= 0.5) return { t: t("En progression", "In progress"), e: "🟠", c: "#E8A765" };
    return { t: t("Fragile — à renforcer", "Fragile — to strengthen"), e: "🔴", c: "#D2664E" };
  }
  const sel = selected ? infoOf(selected) : null;

  const svgH = isMobile ? 360 : 560;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
      {/* toolbar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "11px 14px", borderBottom: `1px solid ${C.line}`, background: "#F7FAFC" }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: C.text, marginRight: 4 }}>{t("Carte mentale PMP", "PMP mind-map")}</div>
        <div style={{ display: "flex", gap: 3, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, padding: 3 }}>
          {[13, 26].map((n) => {
            // full_map detailed view (26 tasks) is a premium feature; free = preview (13 themes).
            const mapPreview = features && features.full_map && features.full_map.access === "preview";
            const locked = n === 26 && mapPreview;
            return (
              <button key={n} onClick={() => { if (locked) { setMapUpgrade(true); return; } setDens(n); setSelected(null); }}
                style={{ border: "none", background: dens === n ? C.ink : "transparent", color: dens === n ? "#fff" : C.muted, fontWeight: 700, fontSize: 11.5, padding: "6px 11px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                {n === 13 ? t("13 thèmes", "13 themes") : t("26 tâches", "26 tasks")}{locked ? <span style={{ fontSize: 10 }}>🔒</span> : null}
              </button>
            );
          })}
        </div>
        <button onClick={() => { setFocus(!focus); }} style={{ border: `1px solid ${focus ? C.amber : C.line}`, background: focus ? "rgba(232,154,60,.12)" : "#fff", color: focus ? "#9A651E" : C.muted, fontWeight: 700, fontSize: 11.5, padding: "6px 11px", borderRadius: 9, cursor: "pointer" }}>🎯 {t("Chemin critique", "Critical path")}</button>
        <button onClick={() => { setPres(!pres); setFocus(!pres); }} style={{ border: `1px solid ${pres ? C.ink : C.line}`, background: pres ? C.ink : "#fff", color: pres ? "#fff" : C.muted, fontWeight: 700, fontSize: 11.5, padding: "6px 11px", borderRadius: 9, cursor: "pointer" }}>{t("Mode présentation", "Presentation")}</button>
        <div style={{ marginLeft: "auto", background: C.ink, color: "#fff", borderRadius: 999, padding: "6px 12px", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5 }}>{dens === 13 ? t("13 thèmes", "13 themes") : t("26 tâches", "26 tasks")} · 3 {t("domaines", "domains")}</div>
      </div>

      {mapUpgrade && (
        <div style={{ margin: "11px 14px 0", background: "linear-gradient(180deg,rgba(232,154,60,.07),rgba(232,154,60,.14))", border: `1px dashed ${C.amber}`, borderRadius: 11, padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ fontSize: 17 }}>🗺️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#16202E" }}>{t("La carte détaillée (26 tâches) est une fonction Premium", "The detailed map (26 tasks) is a Premium feature")}</div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{t("Votre carte de base (13 thèmes) reste complète et gratuite. Premium ajoute le détail par tâche ECO.", "Your base map (13 themes) stays complete and free. Premium adds per-ECO-task detail.")}</div>
          </div>
          <button style={{ border: "none", borderRadius: 9, background: C.amber, color: "#0E1A2B", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11.5, padding: "8px 13px", cursor: "pointer", whiteSpace: "nowrap" }}>{t("Voir Premium", "See Premium")}</button>
          <button onClick={() => setMapUpgrade(false)} style={{ border: "none", background: "none", color: C.muted, fontSize: 16, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
      )}

      {pres && (
        <div style={{ margin: "12px 14px 0", background: "linear-gradient(135deg,#172A42,#0E1A2B)", color: "#EAF0F6", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase", color: C.amber, marginBottom: 6 }}>{t("Script simple pour présenter", "Simple script to present")}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#D6E0EA" }}>
            {t("« Voici ma carte PMP. En vert, les sujets maîtrisés ; en orange, en progression ; en rouge, mes priorités. Mon chemin critique : ",
               "\u201cHere is my PMP map. Green means mastered, orange in progress, red my priorities. My critical path: ")}
            <b style={{ color: C.amber }}>{recNodeShown.map((id) => infoOf(id).l).join(" → ")}</b>. »
          </div>
        </div>
      )}

      <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: "1fr 300px" }}>
        {/* map */}
        <div style={{ position: "relative", background: "radial-gradient(900px 600px at 45% 42%,#F8FBFD 0%,#E6ECF2 100%)" }}>
          <svg viewBox="0 0 1000 660" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: svgH, display: "block" }}>
            <defs><marker id="cmArw" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#8A6FB0" /></marker></defs>
            {/* center->hub */}
            {["people", "process", "biz"].map((d) => (
              <line key={"h" + d} x1={CENTER.x} y1={CENTER.y} x2={HUB[d].x} y2={HUB[d].y} stroke="#C4D0DB" strokeWidth="2.4" />
            ))}
            {/* hub->node */}
            {nodes.map((n) => {
              const hub = HUB[n.d], p = P[n.id]; if (!p) return null;
              const dim = focus && recIndex(n.id) === 0;
              return <path key={"e" + n.id} d={`M${hub.x} ${hub.y} Q ${(hub.x + p.x) / 2} ${(hub.y + p.y) / 2} ${p.x} ${p.y}`} fill="none" stroke="#C4D0DB" strokeWidth="1.4" style={{ opacity: dim ? 0.18 : 0.9 }} />;
            })}
            {/* recommended path (chemin critique) */}
            {recNodeShown.map((id, i) => {
              if (i === recNodeShown.length - 1) return null;
              const a = P[id], b = P[recNodeShown[i + 1]]; if (!a || !b) return null;
              return <path key={"rec" + i} d={`M${a.x} ${a.y} C ${(a.x + b.x) / 2} ${a.y},${(a.x + b.x) / 2} ${b.y},${b.x} ${b.y}`} fill="none" stroke="#8A6FB0" strokeWidth="3.4" strokeDasharray="7 5" markerEnd="url(#cmArw)">
                <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.1s" repeatCount="indefinite" /></path>;
            })}
            {/* center */}
            <circle cx={CENTER.x} cy={CENTER.y} r="50" fill="#0E1A2B" stroke={C.amber} strokeWidth="3" />
            <text x={CENTER.x} y={CENTER.y - 3} textAnchor="middle" style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 700, fill: "#fff" }}>PMP</text>
            <text x={CENTER.x} y={CENTER.y + 13} textAnchor="middle" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 7.5, fill: "#9DB0C2" }}>{pct}% · {readiness ? L(readiness.label) : ""}</text>
            {/* hubs */}
            {["people", "process", "biz"].map((d) => {
              const hub = HUB[d];
              return <g key={"hub" + d}>
                <circle cx={hub.x} cy={hub.y} r="46" fill={DOMC[d]} stroke="#fff" strokeWidth="3" opacity="0.96" />
                <text x={hub.x} y={hub.y - 2} textAnchor="middle" style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 700, fill: "#fff" }}>{L(DOMSHORT[d])}</text>
                <text x={hub.x} y={hub.y + 12} textAnchor="middle" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 7, fill: "#E7EEF4" }}>{L(DOMSUB[d])}</text>
              </g>;
            })}
            {/* nodes */}
            {nodes.map((n) => {
              const o = infoOf(n.id), p = P[n.id]; if (!p) return null;
              const r = dens === 13 ? 20 : 15, on = selected === n.id, num = recIndex(n.id), dim = focus && num === 0;
              const col = nodeColor(o);
              const badge = o.untested ? "" : o.stale ? "🔄" : o.miss ? "📌" : o.m >= 0.75 ? "✓" : "";
              return <g key={"n" + n.id} style={{ opacity: dim ? 0.22 : 1, cursor: "pointer" }} onClick={() => setSelected(n.id)}>
                {num ? <circle cx={p.x} cy={p.y} r={r + 6} fill="none" stroke="#8A6FB0" strokeWidth="2.8" /> : null}
                {on ? <circle cx={p.x} cy={p.y} r={r + 9} fill="none" stroke={DOMC[o.d]} strokeWidth="2.6" /> : null}
                <circle cx={p.x} cy={p.y} r={r} fill={col} stroke="#fff" strokeWidth="2.4" />
                {num ? <><circle cx={p.x - r + 3} cy={p.y - r + 3} r="10" fill={C.amber} stroke="#fff" strokeWidth="2" /><text x={p.x - r + 3} y={p.y - r + 6} textAnchor="middle" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fontWeight: 800, fill: C.ink }}>{num}</text></> : null}
                {badge ? <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fill="#fff">{badge}</text> : null}
                <text x={p.x} y={p.y + r + 12} textAnchor="middle" style={{ fontFamily: "'Inter',sans-serif", fontSize: 9.5, fontWeight: 600, fill: C.text, pointerEvents: "none" }}>{o.l}</text>
                <text x={p.x} y={p.y + r + 22} textAnchor="middle" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 7.5, fill: C.muted, pointerEvents: "none" }}>{o.untested ? t("à découvrir", "new") : Math.round(o.m * 100) + "%"}</text>
              </g>;
            })}
          </svg>
          {cpHidden > 0 && (
            <div style={{ margin: "0 13px 10px", background: "linear-gradient(180deg,rgba(232,154,60,.06),rgba(232,154,60,.13))", border: `1px dashed ${C.amber}`, borderRadius: 11, padding: "11px 13px", display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ fontSize: 17 }}>✨</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#16202E" }}>{t(`+ ${cpHidden} étape${cpHidden > 1 ? "s" : ""} de votre chemin critique en Premium`, `+ ${cpHidden} more step${cpHidden > 1 ? "s" : ""} of your critical path with Premium`)}</div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{t("Premium révèle votre chemin critique complet, calculé sur toutes vos zones.", "Premium reveals your full critical path, computed across all your areas.")}</div>
              </div>
              <button style={{ border: "none", borderRadius: 9, background: C.amber, color: "#0E1A2B", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11.5, padding: "8px 13px", cursor: "pointer", whiteSpace: "nowrap" }}>{t("Voir Premium", "See Premium")}</button>
            </div>
          )}
          {/* legend */}
          <div style={{ display: "flex", gap: 11, flexWrap: "wrap", alignItems: "center", padding: "9px 13px", borderTop: `1px solid ${C.line}`, background: "rgba(255,255,255,.94)", fontSize: 10.5, color: C.muted }}>
            <Lg c="#D2664E" x={t("Fragile", "Fragile")} />
            <Lg c="#E8A765" x={t("En progrès", "In progress")} />
            <Lg c="#3DA776" x={t("Acquis", "Mastered")} />
            <span>🔄 {t("révision d’entretien", "maintenance review")}</span>
            <span>📌 {t("à revoir", "to review")}</span>
            <Lg c="#C9D6E0" x={t("à découvrir", "to discover")} />
            <Lg c="#8A6FB0" x={t("votre chemin critique", "your critical path")} />
          </div>
        </div>

        {/* side panel */}
        <div style={{ borderLeft: isMobile ? "none" : `1px solid ${C.line}`, borderTop: isMobile ? `1px solid ${C.line}` : "none", padding: 16, background: C.card, minHeight: isMobile ? 0 : svgH }}>
          {!sel ? (
            <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, textAlign: "center", marginTop: isMobile ? 10 : 60 }}>
              {t("Sélectionnez un sujet sur la carte pour voir votre niveau et l'action recommandée.", "Select a topic on the map to see your level and the recommended action.")}
            </div>
          ) : (() => {
            const si = statusInfo(sel), num = recIndex(sel.id), col = nodeColor(sel);
            return (
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: DOMC[sel.d], marginBottom: 6, fontWeight: 600 }}>{ECO_DOMAINS.find((d) => d.id === sel.d)[lang]}</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, lineHeight: 1.25, marginBottom: 12 }}>{sel.l}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13, marginBottom: 12 }}><span style={{ fontSize: 18 }}>{si.e}</span><span style={{ color: si.c }}>{si.t}</span></div>
                <div style={{ height: 12, background: "#E4EAF0", borderRadius: 8, overflow: "hidden", marginBottom: 6 }}><span style={{ display: "block", height: "100%", width: `${sel.untested ? 0 : Math.round(sel.m * 100)}%`, background: col, borderRadius: 8 }} /></div>
                <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 13 }}>{sel.untested ? t("Sujet pas encore travaillé.", "Not yet practised.") : (<>{t("Vous réussissez environ ", "You get about ")}<b style={{ color: C.text }}>{Math.round(sel.m * 100)}%</b>{t(" des questions" + (dens === 13 ? " de ce thème" : " sur ce sujet") + ".", " of the questions" + (dens === 13 ? " in this theme" : " on this topic") + ".")}</>)}</div>
                {num ? (
                  <div style={{ background: "#F1EAF7", border: "1px solid #DBC9EC", borderRadius: 11, padding: "11px 12px", marginBottom: 12 }}>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, color: "#5E4980", marginBottom: 4 }}>🎯 {t("Étape " + num + " de votre chemin critique", "Step " + num + " of your critical path")}</div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#4A3B63" }}>{t("Comme en gestion de projet, le chemin critique est la séquence qui détermine la date de fin. Ces sujets conditionnent votre préparation dans les délais.", "As in project management, the critical path is the sequence that drives the finish date. These topics decide whether you're ready in time.")}</div>
                  </div>
                ) : null}
                {sel.sub ? (
                  <div style={{ marginBottom: 12, borderTop: `1px solid ${C.line}`, paddingTop: 11 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>{t("Ce thème contient", "This theme contains")} ({sel.sub.length})</div>
                    {sel.sub.map((sid) => { const ti = taskInfo(sid); return (
                      <div key={sid} onClick={() => { setDens(26); setTimeout(() => setSelected(sid), 40); }} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "5px 0", cursor: "pointer" }}>
                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: nodeColor(ti), flex: "none" }} />{ti.l}
                        <span style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: C.muted }}>{ti.untested ? t("à découvrir", "new") : Math.round(ti.m * 100) + "%"}</span>
                      </div>); })}
                  </div>
                ) : null}
                <button onClick={() => onStudyArea(dens === 13 ? TASK_BY_ID[sel.sub[0]].area : sel.area)} style={{ width: "100%", border: "none", borderRadius: 10, padding: 11, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", background: C.amber, color: C.ink }}>
                  {sel.untested ? t("Commencer ce sujet →", "Start this topic →") : sel.m >= 0.75 ? t("Maintenir le niveau →", "Maintain level →") : t("Renforcer ce sujet →", "Strengthen this topic →")}
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function Lg({ c, x }) {
  return <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: c, display: "inline-block" }} />{x}</span>;
}
