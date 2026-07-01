import React, { useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { C, ECO_DOMAINS, ECO_TASKS, ECOT, ECO_STATUS_COLOR } from "./pmp.js";

function taskScore(task, procByRef, areaById) {
  if (task.refs) {
    const rows = task.refs.map((r) => procByRef[r]).filter((p) => p && p.attempts > 0);
    if (rows.length) return { score: rows.reduce((a, p) => a + p.score, 0) / rows.length, attempts: rows.reduce((a, p) => a + p.attempts, 0), has: true };
  }
  if (task.area) {
    const m = areaById[task.area];
    if (m && m.attempts > 0) return { score: m.score, attempts: m.attempts, has: true };
  }
  return { score: 0, attempts: 0, has: false };
}

export default function Journey({ lang, mastery, processes, recommended, onStudyArea, isMobile }) {
  const [domId, setDomId] = useState(null);
  const e = (k) => ECOT[k][lang];
  const procByRef = Object.fromEntries((processes || []).map((p) => [p.pmbok_ref, p]));
  const areaById = Object.fromEntries((mastery || []).map((m) => [m.area, m]));

  if (domId) {
    return <DomainView lang={lang} domain={ECO_DOMAINS.find((d) => d.id === domId)} procByRef={procByRef} areaById={areaById}
      onBack={() => setDomId(null)} onStudyArea={onStudyArea} e={e} isMobile={isMobile} />;
  }

  return (
    <div className="ak-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 28px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 3 }}>{e("title")}</div>
        <div style={{ background: "linear-gradient(90deg,#EFE9F5,#EAF1F3,#FBEEDD)", border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 13px", fontSize: 12, color: C.text, margin: "10px 0 16px" }}>{e("agile")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {ECO_DOMAINS.map((d) => {
            const tasks = ECO_TASKS[d.id];
            const counts = { solid: 0, amorce: 0, build: 0 };
            let sum = 0, n = 0;
            tasks.forEach((t) => { counts[t.status]++; const ts = taskScore(t, procByRef, areaById); if (ts.has) { sum += ts.score; n++; } });
            const pct = n ? Math.round((sum / n) * 100) : 0;
            const seg = (k) => (counts[k] / tasks.length) * 100;
            const isRec = recommended && ECO_TASKS[d.id].some((t) => t.area === recommended.area);
            return (
              <button key={d.id} onClick={() => setDomId(d.id)} style={{ textAlign: "left", background: C.card, border: `1px solid ${isRec ? d.c : C.line}`, borderTop: `3px solid ${d.c}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30, color: d.c, lineHeight: 1, minWidth: 62 }}>{d.wt}<span style={{ fontSize: 15 }}>%</span></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: C.text }}>{d[lang]}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: C.muted, margin: "2px 0 8px" }}>{tasks.length} {e("tasks")}{n ? ` · ${pct}%` : ""}</div>
                  <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", background: "#E0E6EC" }}>
                    <span style={{ width: `${seg("solid")}%`, background: ECO_STATUS_COLOR.solid }} />
                    <span style={{ width: `${seg("amorce")}%`, background: ECO_STATUS_COLOR.amorce }} />
                    <span style={{ width: `${seg("build")}%`, background: ECO_STATUS_COLOR.build }} />
                  </div>
                </div>
                <ChevronRight size={18} color="#C3CDD7" />
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14, fontSize: 10.5, color: C.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
          {[["solid", ECO_STATUS_COLOR.solid], ["amorce", ECO_STATUS_COLOR.amorce], ["build", ECO_STATUS_COLOR.build]].map(([k, col], i) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><i style={{ width: 9, height: 9, borderRadius: 3, background: col, display: "inline-block" }} />{e("legend").split(" · ")[i]}</span>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 11.5, color: C.muted, marginTop: 14 }}>{e("hint")}</div>
      </div>
    </div>
  );
}

function DomainView({ lang, domain, procByRef, areaById, onBack, onStudyArea, e, isMobile }) {
  const tasks = ECO_TASKS[domain.id];
  const [sel, setSel] = useState(isMobile ? null : 0);

  const List = (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {tasks.map((t, idx) => {
        const ts = taskScore(t, procByRef, areaById);
        const pct = Math.round(ts.score * 100);
        const scol = ECO_STATUS_COLOR[t.status];
        const on = sel === idx;
        return (
          <button key={t.id} onClick={() => setSel(idx)} style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, cursor: "pointer", background: on ? "#FFFFFF" : C.card, border: `1px solid ${on ? domain.c : C.line}`, boxShadow: on ? "0 1px 8px rgba(14,26,43,0.10)" : "none" }}>
            <span style={{ width: 26, height: 26, flex: "none", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 11, background: "#EEF2F6", color: C.muted }}>{idx + 1}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, lineHeight: 1.3 }}>{t[lang]}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: scol, flex: "none" }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: C.muted }}>{e("legend").split(" · ")[t.status === "solid" ? 0 : t.status === "amorce" ? 1 : 2]}{ts.has ? ` · ${pct}%` : ""}</span>
              </span>
            </span>
            <ChevronRight size={15} color={on ? domain.c : "#C3CDD7"} />
          </button>
        );
      })}
    </div>
  );

  const Detail = (() => {
    if (sel == null) return <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13, textAlign: "center", padding: 24 }}>{e("pick")}</div>;
    const t = tasks[sel];
    const ts = taskScore(t, procByRef, areaById);
    const pct = Math.round(ts.score * 100);
    const scol = ECO_STATUS_COLOR[t.status];
    const src = lang === "fr" ? t.srcFr : t.srcEn;
    return (
      <div>
        {isMobile && <button onClick={() => setSel(null)} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.card, border: `1px solid ${C.line}`, color: C.muted, borderRadius: 9, padding: "7px 12px", fontSize: 13, marginBottom: 12 }}><ArrowLeft size={15} /> {domain[lang]}</button>}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: scol + "26", color: scol === "#B8C2CC" ? "#7E8C9C" : scol }}>{e("legend").split(" · ")[t.status === "solid" ? 0 : t.status === "amorce" ? 1 : 2]}</span>
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: C.text, lineHeight: 1.3, marginBottom: 12 }}>{t[lang]}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ flex: 1, height: 7, borderRadius: 4, background: "#E0E6EC", overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${pct}%`, background: scol, borderRadius: 4 }} /></span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: C.muted, minWidth: 34, textAlign: "right" }}>{pct}%</span>
        </div>
        {src && <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.55, background: C.card, border: `1px solid ${C.line}`, borderLeft: `3px solid ${domain.c}`, borderRadius: 10, padding: "11px 13px", marginBottom: 12 }}>{src}</div>}
        {t.area ? (
          <button onClick={() => onStudyArea(t.area)} style={{ width: "100%", padding: "11px", border: "none", borderRadius: 11, background: C.amber, color: C.ink, fontWeight: 600, fontSize: 13.5, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>{e("review")} <ArrowRight size={15} /></button>
        ) : (
          <div style={{ textAlign: "center", fontSize: 12, color: C.muted, fontStyle: "italic", padding: "10px" }}>{e("toBuild")}</div>
        )}
      </div>
    );
  })();

  const Header = (
    <div>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.card, border: `1px solid ${C.line}`, color: C.muted, borderRadius: 9, padding: "7px 12px", fontSize: 13 }}><ArrowLeft size={15} /> {e("back")}</button>
      <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "14px 0 12px" }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: domain.c, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, flex: "none" }}>{domain.wt}</div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: C.text }}>{domain[lang]}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: C.muted, marginTop: 2 }}>{tasks.length} {e("tasks")} · {domain.wt}%</div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return <div className="ak-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 28px" }}>{sel == null ? <>{Header}{List}</> : Detail}</div>;
  }
  return (
    <div className="ak-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 18px 28px" }}>
      {Header}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: 320, flex: "none" }}>{List}</div>
        <div style={{ flex: 1, minWidth: 0, position: "sticky", top: 0, background: C.paper, borderRadius: 14, border: `1px solid ${C.line}`, padding: "16px 18px", minHeight: 220 }}>{Detail}</div>
      </div>
    </div>
  );
}
