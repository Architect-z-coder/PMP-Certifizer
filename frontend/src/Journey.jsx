import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Target, ChevronRight } from "lucide-react";
import { C, KA, PROC, PG, JT, lightColor } from "./pmp.js";

const CX = 200, CY = 200, R = 128;

export default function Journey({ lang, mastery, processes, recommended, onStudyArea, isMobile }) {
  const [areaId, setAreaId] = useState(null);
  const j = (k) => JT[k][lang];
  const mById = Object.fromEntries((mastery || []).map((m) => [m.area, m]));
  const pById = Object.fromEntries((processes || []).map((p) => [p.pmbok_ref, p]));

  if (areaId) {
    return <AreaJourney lang={lang} area={KA.find((k) => k.id === areaId)} pById={pById}
      onBack={() => setAreaId(null)} onStudyArea={onStudyArea} j={j} isMobile={isMobile} />;
  }

  const masteredCount = KA.filter((k) => { const m = mById[k.id]; return m && m.attempts > 0 && m.score >= 0.75; }).length;
  const overall = Math.round(KA.reduce((s, k) => { const m = mById[k.id]; return s + (m && m.attempts > 0 ? m.score : 0); }, 0) / KA.length * 100);

  const nodes = KA.map((k, i) => {
    const procs = PROC[k.id] || [];
    const m = mById[k.id];
    const score = m && m.attempts > 0 ? m.score : 0;
    const ang = (-90 + i * 36) * Math.PI / 180;
    return { ...k, i, score, attempts: m ? m.attempts : 0, procs, col: lightColor(m),
      locked: !m || m.attempts === 0, x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang), ang, r: 12 + procs.length * 1.5 };
  });

  return (
    <div className="ak-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 28px" }}>
      <style>{`@keyframes jpulse{0%{r:24px;opacity:.5}100%{r:42px;opacity:0}} .jp{animation:jpulse 1.9s ease-out infinite}
        @media (prefers-reduced-motion: reduce){.jp{animation:none}}`}</style>
      <div style={{ display: "flex", gap: 9, marginBottom: 6, maxWidth: 560, marginInline: "auto" }}>
        <Stat k={j("mastered")} v={`${masteredCount}`} sub="/10" />
        <Stat k={j("progress")} v={`${overall}`} sub="%" />
        <Stat k="ECO" v="09/07" small />
      </div>
      <svg viewBox="0 0 400 400" style={{ width: "100%", height: "auto", display: "block", maxWidth: 520, margin: "0 auto", touchAction: "manipulation" }}>
        <defs><linearGradient id="jg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.amber} /><stop offset="1" stopColor={C.teal} /></linearGradient></defs>
        {nodes.map((n) => { const mx = CX + (n.x - CX) * 0.5, my = CY + (n.y - CY) * 0.5;
          return <path key={"l" + n.id} d={`M${CX},${CY} Q${mx},${my} ${n.x},${n.y}`} fill="none" stroke={n.score > 0 ? "url(#jg)" : C.line} strokeWidth={n.score > 0 ? 2.4 : 1.4} />; })}
        {nodes.map((n) => { const rr = n.r + 4, circ = 2 * Math.PI * rr; const isRec = recommended && recommended.area === n.id;
          return (
            <g key={"n" + n.id} style={{ cursor: "pointer" }} onClick={() => setAreaId(n.id)}>
              {isRec && <circle cx={n.x} cy={n.y} r={n.r} fill="none" stroke={C.amber} strokeWidth="2" className="jp" />}
              <circle cx={n.x} cy={n.y} r={rr} fill="none" stroke="#D7DEE6" strokeWidth="2.4" />
              {n.score > 0 && <circle cx={n.x} cy={n.y} r={rr} fill="none" stroke={n.col} strokeWidth="2.8" strokeLinecap="round" strokeDasharray={`${n.score * circ} ${circ}`} transform={`rotate(-90 ${n.x} ${n.y})`} />}
              <circle cx={n.x} cy={n.y} r={n.r} fill={n.locked ? "#FFFFFF" : n.col} stroke={n.locked ? n.col : "none"} strokeWidth="1.6" />
              <text x={n.x} y={n.y + 3.6} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontWeight="600" fontSize={n.r * 0.72} fill={n.locked ? C.grey : (n.col === C.green ? "#08231b" : "#0E1A2B")}>{n.i + 1}</text>
              {(() => { const lx = CX + (R + n.r + 9) * Math.cos(n.ang), ly = CY + (R + n.r + 9) * Math.sin(n.ang);
                const anchor = Math.abs(Math.cos(n.ang)) < 0.25 ? "middle" : (Math.cos(n.ang) > 0 ? "start" : "end");
                return <text x={lx} y={ly + 3} textAnchor={anchor} fontFamily="'Inter', sans-serif" fontSize="8.6" fill={isRec ? C.amber : C.muted} style={{ pointerEvents: "none" }}>{n[lang]}</text>; })()}
            </g>
          ); })}
        <circle cx={CX} cy={CY} r="29" fill="#FFFFFF" stroke={C.amber} strokeWidth="1.6" />
        <polygon points="200,188 209,209 191,209" fill="none" stroke={C.amber} strokeWidth="2" strokeLinejoin="round" />
        <text x={CX} y={CY + 21} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight="700" fontSize="10" fill={C.text}>PMP</text>
      </svg>
      <div style={{ textAlign: "center", fontSize: 11.5, color: C.muted, marginTop: 6 }}>{j("mapHint")}</div>
      <div style={{ textAlign: "center", fontSize: 10.5, color: C.muted, marginTop: 12, fontFamily: "'IBM Plex Mono', monospace" }}>{j("legend")}</div>
    </div>
  );
}

// ---- Area view: two-pane master/detail (list left, detail right) ----
function AreaJourney({ lang, area, pById, onBack, onStudyArea, j, isMobile }) {
  const procs = PROC[area.id] || [];
  const [sel, setSel] = useState(isMobile ? null : 0);
  const areaNum = KA.findIndex((k) => k.id === area.id) + 1;
  const done = procs.filter((p) => { const m = pById[p.n]; return m && m.attempts > 0 && m.score >= 0.75; }).length;

  const Header = (
    <div>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.card, border: `1px solid ${C.line}`, color: C.muted, borderRadius: 9, padding: "7px 12px", fontSize: 13 }}>
        <ArrowLeft size={15} /> {j("back")}
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "14px 0 12px" }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: C.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 15, flex: "none" }}>{areaNum}</div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: C.text }}>{area[lang]}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: C.muted, marginTop: 2 }}>{procs.length} {j("processes")} · {done} {j("mastered").toLowerCase()}</div>
        </div>
      </div>
    </div>
  );

  const List = (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {procs.map((p, idx) => {
        const m = pById[p.n]; const score = m && m.attempts > 0 ? m.score : 0; const col = lightColor(m);
        const locked = !m || m.attempts === 0; const pct = Math.round(score * 100); const pg = PG[p.pg];
        const on = sel === idx;
        return (
          <button key={p.n} onClick={() => setSel(idx)} style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, cursor: "pointer",
            background: on ? "#FFFFFF" : C.card, border: `1px solid ${on ? C.teal : C.line}`, boxShadow: on ? "0 1px 8px rgba(46,140,158,0.12)" : "none" }}>
            <span style={{ width: 30, height: 30, flex: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 9.5, background: locked ? "#fff" : col, border: `2px solid ${col}`, color: locked ? col : (col === C.green ? "#08231b" : "#fff") }}>{!locked && score >= 0.75 ? "✓" : p.n}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13.5, color: C.text, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p[lang]}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: pg.c, flex: "none" }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: C.muted }}>{pg[lang]} · {pct}%</span>
              </span>
            </span>
            <ChevronRight size={15} color={on ? C.teal : "#C3CDD7"} />
          </button>
        );
      })}
    </div>
  );

  const Detail = (() => {
    if (sel == null) return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13, textAlign: "center", padding: 24 }}>{j("pick") || "Sélectionne un processus."}</div>
    );
    const p = procs[sel]; const m = pById[p.n]; const score = m && m.attempts > 0 ? m.score : 0;
    const col = lightColor(m); const pct = Math.round(score * 100); const pg = PG[p.pg];
    const role = lang === "fr" ? (p.roleFr || j("soon")) : (p.roleEn || j("soon"));
    return (
      <div style={{ padding: isMobile ? "0" : "2px 2px" }}>
        {isMobile && <button onClick={() => setSel(null)} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.card, border: `1px solid ${C.line}`, color: C.muted, borderRadius: 9, padding: "7px 12px", fontSize: 13, marginBottom: 12 }}><ArrowLeft size={15} /> {area[lang]}</button>}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "3px 8px", borderRadius: 7, fontWeight: 600, background: col, color: col === C.green ? "#08231b" : "#0E1A2B" }}>{p.n}</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, padding: "2px 8px", borderRadius: 20, fontWeight: 600, background: pg.c + "22", color: pg.c }}>{pg[lang]}</span>
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: C.text, lineHeight: 1.3, marginBottom: 12 }}>{p[lang]}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ flex: 1, height: 7, borderRadius: 4, background: "#E0E6EC", overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${pct}%`, background: col, borderRadius: 4 }} /></span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: C.muted, minWidth: 34, textAlign: "right" }}>{pct}%</span>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "1px", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>{j("notes") || "Notes"}</div>
        <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.6, background: C.card, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.teal}`, borderRadius: 10, padding: "12px 14px" }}>{role}</div>
        <button onClick={() => onStudyArea(area.id)} style={{ marginTop: 14, width: "100%", padding: "11px", border: "none", borderRadius: 11, background: C.amber, color: C.ink, fontWeight: 600, fontSize: 13.5, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          {j("review")} {p.n} <ArrowRight size={15} />
        </button>
      </div>
    );
  })();

  // ---- mobile: list OR detail (back navigates list -> map) ----
  if (isMobile) {
    return (
      <div className="ak-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 28px" }}>
        {sel == null ? <>{Header}{List}</> : Detail}
      </div>
    );
  }
  // ---- desktop: two columns side by side ----
  return (
    <div className="ak-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 18px 28px" }}>
      {Header}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: 300, flex: "none" }}>{List}</div>
        <div style={{ flex: 1, minWidth: 0, position: "sticky", top: 0, background: C.paper, borderRadius: 14, border: `1px solid ${C.line}`, padding: "16px 18px", minHeight: 220 }}>{Detail}</div>
      </div>
    </div>
  );
}

function Stat({ k, v, sub, small }) {
  return (
    <div style={{ flex: 1, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 12px" }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "1.1px", textTransform: "uppercase", color: C.muted }}>{k}</div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: small ? 15 : 19, color: C.text, marginTop: 2 }}>{v}<small style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{sub}</small></div>
    </div>
  );
}
