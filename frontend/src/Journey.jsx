import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Target } from "lucide-react";
import { C, KA, PROC, PG, JT, lightColor } from "./pmp.js";

const CX = 200, CY = 200, R = 128;

export default function Journey({ lang, mastery, processes, recommended, onStudyArea }) {
  const [areaId, setAreaId] = useState(null);
  const j = (k) => JT[k][lang];

  const mById = Object.fromEntries((mastery || []).map((m) => [m.area, m]));
  const pById = Object.fromEntries((processes || []).map((p) => [p.pmbok_ref, p]));

  if (areaId) {
    return (
      <AreaJourney
        lang={lang} area={KA.find((k) => k.id === areaId)} pById={pById}
        onBack={() => setAreaId(null)} onStudyArea={onStudyArea} j={j}
      />
    );
  }

  const masteredCount = KA.filter((k) => { const m = mById[k.id]; return m && m.attempts > 0 && m.score >= 0.75; }).length;
  const overall = Math.round(KA.reduce((s, k) => { const m = mById[k.id]; return s + (m && m.attempts > 0 ? m.score : 0); }, 0) / KA.length * 100);

  const nodes = KA.map((k, i) => {
    const procs = PROC[k.id] || [];
    const m = mById[k.id];
    const score = m && m.attempts > 0 ? m.score : 0;
    const ang = (-90 + i * 36) * Math.PI / 180;
    return {
      ...k, i, score, attempts: m ? m.attempts : 0, procs,
      col: lightColor(m), locked: !m || m.attempts === 0,
      x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang), ang,
      r: 12 + procs.length * 1.5,
    };
  });

  return (
    <div className="ak-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 28px" }}>
      <style>{`@keyframes jpulse{0%{r:24px;opacity:.5}100%{r:42px;opacity:0}} .jp{animation:jpulse 1.9s ease-out infinite}
        @media (prefers-reduced-motion: reduce){.jp{animation:none}}`}</style>

      <div style={{ display: "flex", gap: 9, marginBottom: 6 }}>
        <Stat k={j("mastered")} v={`${masteredCount}`} sub="/10" />
        <Stat k={j("progress")} v={`${overall}`} sub="%" />
        <Stat k="ECO" v="09/07" small />
      </div>

      <svg viewBox="0 0 400 400" style={{ width: "100%", height: "auto", display: "block", touchAction: "manipulation" }}>
        <defs><linearGradient id="jg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.amber} /><stop offset="1" stopColor={C.teal} /></linearGradient></defs>
        {nodes.map((n) => {
          const mx = CX + (n.x - CX) * 0.5, my = CY + (n.y - CY) * 0.5;
          return <path key={"l" + n.id} d={`M${CX},${CY} Q${mx},${my} ${n.x},${n.y}`} fill="none"
            stroke={n.score > 0 ? "url(#jg)" : C.line} strokeWidth={n.score > 0 ? 2.4 : 1.4} />;
        })}
        {nodes.map((n) => {
          const rr = n.r + 4, circ = 2 * Math.PI * rr;
          const isRec = recommended && recommended.area === n.id;
          return (
            <g key={"n" + n.id} style={{ cursor: "pointer" }} onClick={() => setAreaId(n.id)}>
              {isRec && <circle cx={n.x} cy={n.y} r={n.r} fill="none" stroke={C.amber} strokeWidth="2" className="jp" />}
              <circle cx={n.x} cy={n.y} r={rr} fill="none" stroke="#D7DEE6" strokeWidth="2.4" />
              {n.score > 0 && <circle cx={n.x} cy={n.y} r={rr} fill="none" stroke={n.col} strokeWidth="2.8"
                strokeLinecap="round" strokeDasharray={`${n.score * circ} ${circ}`} transform={`rotate(-90 ${n.x} ${n.y})`} />}
              <circle cx={n.x} cy={n.y} r={n.r} fill={n.locked ? "#FFFFFF" : n.col} stroke={n.locked ? n.col : "none"} strokeWidth="1.6" />
              <text x={n.x} y={n.y + 3.6} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontWeight="600"
                fontSize={n.r * 0.72} fill={n.locked ? C.grey : (lightColor(mById[n.id]) === C.green ? "#08231b" : "#0E1A2B")}>{n.i + 1}</text>
              {(() => {
                const lx = CX + (R + n.r + 9) * Math.cos(n.ang), ly = CY + (R + n.r + 9) * Math.sin(n.ang);
                const anchor = Math.abs(Math.cos(n.ang)) < 0.25 ? "middle" : (Math.cos(n.ang) > 0 ? "start" : "end");
                return <text x={lx} y={ly + 3} textAnchor={anchor} fontFamily="'Inter', sans-serif" fontSize="8.6"
                  fill={isRec ? C.amber : C.muted} style={{ pointerEvents: "none" }}>{n[lang]}</text>;
              })()}
            </g>
          );
        })}
        <circle cx={CX} cy={CY} r="29" fill="#FFFFFF" stroke={C.amber} strokeWidth="1.6" />
        <polygon points="200,188 209,209 191,209" fill="none" stroke={C.amber} strokeWidth="2" strokeLinejoin="round" />
        <text x={CX} y={CY + 21} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight="700" fontSize="10" fill={C.text}>PMP</text>
      </svg>

      <div style={{ textAlign: "center", fontSize: 11.5, color: C.muted, marginTop: 6 }}>{j("mapHint")}</div>
      <div style={{ textAlign: "center", fontSize: 10.5, color: C.muted, marginTop: 12, fontFamily: "'IBM Plex Mono', monospace" }}>{j("legend")}</div>
    </div>
  );
}

function AreaJourney({ lang, area, pById, onBack, onStudyArea, j }) {
  const [open, setOpen] = useState(null);
  const procs = PROC[area.id] || [];
  const done = procs.filter((p) => { const m = pById[p.n]; return m && m.attempts > 0 && m.score >= 0.75; }).length;

  return (
    <div className="ak-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 28px" }}>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.card, border: `1px solid ${C.line}`, color: C.muted, borderRadius: 9, padding: "7px 12px", fontSize: 13 }}>
        <ArrowLeft size={15} /> {j("back")}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "14px 0 4px" }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: C.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 15, flex: "none" }}>{KA.findIndex((k) => k.id === area.id) + 1}</div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: C.text }}>{area[lang]}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: C.muted, marginTop: 2 }}>{procs.length} {j("processes")} · {done} {j("mastered").toLowerCase()}</div>
        </div>
      </div>

      <div style={{ position: "relative", marginTop: 16, paddingLeft: 42 }}>
        <div style={{ position: "absolute", left: 17, top: 6, bottom: 8, width: 3, borderRadius: 3, background: C.line }} />
        {procs.map((p, idx) => {
          const m = pById[p.n];
          const score = m && m.attempts > 0 ? m.score : 0;
          const col = lightColor(m);
          const locked = !m || m.attempts === 0;
          const pct = Math.round(score * 100);
          const pg = PG[p.pg];
          const role = lang === "fr" ? (p.roleFr || j("soon")) : (p.roleEn || j("soon"));
          const isOpen = open === idx;
          return (
            <div key={p.n} style={{ position: "relative", marginBottom: 12 }}>
              <div style={{ position: "absolute", left: -42, top: 3, width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 10.5, background: locked ? C.card : col, border: `2px solid ${col}`, color: locked ? col : (col === C.green ? "#08231b" : "#fff"), zIndex: 2 }}>
                {!locked && score >= 0.75 ? "✓" : p.n}
              </div>
              <div onClick={() => setOpen(isOpen ? null : idx)} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "11px 13px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: C.text, flex: 1, lineHeight: 1.3 }}>{p[lang]}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, padding: "2px 7px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap", background: pg.c + "22", color: pg.c }}>{pg[lang]}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span style={{ flex: 1, height: 5, borderRadius: 4, background: "#E0E6EC", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${pct}%`, background: col, borderRadius: 4 }} />
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.muted, minWidth: 32, textAlign: "right" }}>{pct}%</span>
                </div>
                {isOpen && (
                  <div style={{ paddingTop: 10, marginTop: 10, borderTop: `1px solid ${C.line}` }}>
                    <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.55 }}>{role}</div>
                    <button onClick={(e) => { e.stopPropagation(); onStudyArea(area.id); }} style={{ marginTop: 10, padding: "8px 14px", border: "none", borderRadius: 9, background: C.amber, color: C.ink, fontWeight: 600, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {j("review")} {p.n} <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ k, v, sub, small }) {
  return (
    <div style={{ flex: 1, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 12px" }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "1.1px", textTransform: "uppercase", color: C.muted }}>{k}</div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: small ? 15 : 19, color: C.text, marginTop: 2 }}>
        {v}<small style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{sub}</small>
      </div>
    </div>
  );
}
