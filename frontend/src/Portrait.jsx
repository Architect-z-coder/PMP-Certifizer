import React, { useEffect, useState, useMemo } from "react";
import { getPortrait } from "./api.js";

/* ======================================================================
   v40 — Portrait d'apprentissage.

   Ce n'est pas un tableau de bord : c'est un document. Il emprunte au monde
   du chef de projet — un cartouche de plan, un diagramme de réseau, un chemin
   critique — parce que c'est le vocabulaire que l'apprenant reconnaît.

   Il montre ce qui est acquis ET ce qui attend. Les zones pâles ne sont pas des
   trous : ce sont les domaines qui s'allumeront ensuite. Le document est
   imprimable (→ PDF) et se suffit à lui-même si on le partage.
   ====================================================================== */

const C = {
  ink: "#0E1A2B", paper: "#F7F9FA", rule: "#C9D3DC", rule2: "#E4EAEF",
  text: "#16202E", muted: "#66788A",
  amber: "#E89A3C", teal: "#2E8C9E", green: "#3DA776", red: "#D2664E",
  future: "#B7C4CF",
};

const STATE_COLOR = {
  acquired: C.green, in_progress: C.amber, fragile: C.red, untouched: null,
};

const T = {
  eyebrow: { fr: "Portrait d'apprentissage", en: "Learning portrait" },
  title: { fr: "Ce que vous avez construit —\net ce qui vous attend.", en: "What you've built —\nand what awaits you." },
  prep: { fr: "Préparation", en: "Readiness" },
  answers: { fr: "Réponses", en: "Answers" },
  acquired: { fr: "Acquis", en: "Acquired" },
  reflexes: { fr: "Réflexes", en: "Reflexes" },
  edited: { fr: "Édité le", en: "Issued" },
  s1: { fr: "Votre carte — et votre chemin critique", en: "Your map — and your critical path" },
  s1hint: { fr: "domaines · acquis · devant vous", en: "areas · acquired · ahead of you" },
  lead: {
    fr: "Ces domaines ne s'apprennent pas côte à côte : ils s'appuient les uns sur les autres. La chaîne en ambre est celle qui commande réellement votre date de réussite. Les zones pâles ne sont pas des trous — ce sont les domaines qui s'allumeront ensuite. Votre carte n'est pas incomplète : elle est en cours.",
    en: "These areas aren't learned side by side: they rest on one another. The amber chain is the one that actually governs your date. The pale zones aren't gaps — they're the areas that will light up next. Your map isn't incomplete: it's in progress.",
  },
  reading: { fr: "Lecture", en: "Reading" },
  legAcq: { fr: "acquis", en: "acquired" },
  legProg: { fr: "en cours", en: "in progress" },
  legFrag: { fr: "fragile", en: "fragile" },
  legWait: { fr: "vous attend", en: "awaits you" },
  legCp: { fr: "chemin critique", en: "critical path" },
  s2: { fr: "Votre trajectoire", en: "Your trajectory" },
  s2hint: { fr: "et la pente devant", en: "and the slope ahead" },
  atPace: { fr: "À ce rythme", en: "At this pace" },
  threshold: { fr: "seuil visé", en: "target" },
  today: { fr: "aujourd'hui", en: "today" },
  proj: { fr: "projection", en: "projection" },
  s3: { fr: "Face à l'examen réel", en: "Against the real exam" },
  s3hint: { fr: "pondération officielle ECO 2026", en: "official ECO 2026 weighting" },
  s4: { fr: "Vos réflexes", en: "Your reflexes" },
  s4hint: { fr: "ce que vous avez décidé de retenir — vos mots", en: "what you chose to keep — your words" },
  noRefl: { fr: "Vos réflexes s'écriront dans « Cas réel ».", en: "Your reflexes will be written in \u201cReal case\u201d." },
  nextRefl: { fr: "Le prochain s'écrira\nà votre prochaine séance.", en: "The next one will be written\nat your next session." },
  print: { fr: "Imprimer / PDF", en: "Print / PDF" },
  own: { fr: "Document généré à partir de vos données — elles vous appartiennent.", en: "Generated from your data — it belongs to you." },
  loading: { fr: "Composition de votre portrait…", en: "Composing your portrait…" },
  empty: { fr: "Répondez à quelques questions et votre portrait prendra forme.", en: "Answer a few questions and your portrait will take shape." },
};

// Positions du réseau : 3 colonnes de dépendance (socle → milieu → aval).
// On place chaque domaine selon sa profondeur dans le graphe, ce qui rend la
// lecture juste : ce qui est à gauche porte ce qui est à droite.
function layout(nodes) {
  const byId = Object.fromEntries(nodes.map((n) => [n.area, n]));
  const depth = {};
  const compute = (id, seen = new Set()) => {
    if (depth[id] != null) return depth[id];
    if (seen.has(id)) return 0;
    const deps = byId[id]?.depends_on || [];
    const d = deps.length ? 1 + Math.max(...deps.map((x) => compute(x, new Set([...seen, id])))) : 0;
    depth[id] = d;
    return d;
  };
  nodes.forEach((n) => compute(n.area));
  const cols = {};
  nodes.forEach((n) => { (cols[depth[n.area]] ||= []).push(n.area); });
  const maxD = Math.max(...Object.keys(cols).map(Number));
  const W = 780, H = 300, padX = 54, padY = 34;
  const colW = (W - padX * 2) / Math.max(1, maxD);
  const pos = {};
  Object.entries(cols).forEach(([d, ids]) => {
    const x = padX + Number(d) * colW;
    const rowH = (H - padY * 2) / Math.max(1, ids.length);
    ids.forEach((id, i) => {
      pos[id] = { x, y: padY + rowH * i + rowH / 2 };
    });
  });
  return pos;
}

export default function Portrait({ learnerId, lang = "fr" }) {
  const [p, setP] = useState(null);
  const [err, setErr] = useState(null);
  const t = (k) => T[k][lang] || T[k].fr;

  useEffect(() => {
    let alive = true;
    getPortrait(learnerId, lang)
      .then((d) => { if (alive) setP(d); })
      .catch((e) => { if (alive) setErr(String(e)); });
    return () => { alive = false; };
  }, [learnerId, lang]);

  const pos = useMemo(() => (p ? layout(p.nodes) : {}), [p]);

  if (err) return <div style={{ flex: 1, padding: 24, color: C.red, fontSize: 13, overflowY: "auto" }}>{err}</div>;
  if (!p) return <div style={{ flex: 1, padding: 40, textAlign: "center", color: C.muted, fontSize: 13.5 }}>{t("loading")}</div>;

  const hasData = p.total_answers > 0;
  const cp = p.critical_path || [];
  const cpSet = new Set(cp);
  const cpEdges = cp.slice(0, -1).map((a, i) => [a, cp[i + 1]]);
  const cpKey = (a, b) => `${a}>${b}`;
  const cpEdgeSet = new Set(cpEdges.map(([a, b]) => cpKey(a, b)));

  const date = new Date(p.generated_at || Date.now());
  const dd = (d) => `${String(d.getDate()).padStart(2, "0")}·${String(d.getMonth() + 1).padStart(2, "0")}·${String(d.getFullYear()).slice(2)}`;

  const pj = p.projection || {};
  const traj = p.trajectory || [];

  return (
    <div className="ak-scroll" style={{ background: "#0A1422", padding: "22px 14px 40px", flex: 1, minHeight: 0, overflowY: "auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .pt-sheet{background:${C.paper};border:1px solid ${C.rule};max-width:840px;margin:0 auto;
          background-image:linear-gradient(rgba(46,140,158,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(46,140,158,.05) 1px,transparent 1px);
          background-size:26px 26px;box-shadow:0 24px 60px rgba(0,0,0,.4);}
        .pt-band{margin-bottom:24px}
        .pt-bt{display:flex;align-items:baseline;gap:10px;border-bottom:1px solid ${C.rule};padding-bottom:6px;margin-bottom:13px}
        .pt-bt h2{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:15px;color:${C.text}}
        .pt-bn{font-family:'IBM Plex Mono',monospace;font-size:10px;color:${C.muted};border:1px solid ${C.rule};border-radius:3px;padding:1px 6px}
        .pt-hint{margin-left:auto;font-size:11px;color:${C.muted}}
        .pt-card{background:#fff;border:1px solid ${C.rule};padding:13px 14px}
        @media print{
          body *{visibility:hidden}
          .pt-sheet,.pt-sheet *{visibility:visible}
          .pt-sheet{position:absolute;left:0;top:0;box-shadow:none;border:none;max-width:none}
          .pt-noprint{display:none !important}
        }
      `}</style>

      {/* action (jamais imprimée) */}
      <div className="pt-noprint" style={{ maxWidth: 840, margin: "0 auto 12px", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => window.print()}
          style={{ background: C.amber, color: C.ink, border: "none", borderRadius: 8, padding: "8px 15px", fontWeight: 700, fontSize: 12.5, fontFamily: "'Space Grotesk',sans-serif", cursor: "pointer" }}>
          ⭳ {t("print")}
        </button>
      </div>

      <div className="pt-sheet">
        {/* ---------- CARTOUCHE ---------- */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", background: C.ink, color: "#fff", borderBottom: `2px solid ${C.amber}` }}>
          <div style={{ padding: "17px 20px" }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, letterSpacing: 2.2, textTransform: "uppercase", color: C.amber, marginBottom: 6 }}>{t("eyebrow")}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 24, lineHeight: 1.15, whiteSpace: "pre-line", letterSpacing: "-.3px" }}>{t("title")}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(92px,auto))", borderLeft: "1px solid rgba(255,255,255,.12)" }}>
            {[
              [t("prep"), `${Math.round(p.readiness * 100)} %`, true],
              [t("acquired"), `${p.acquired} / ${p.total_areas}`, false],
              [t("answers"), String(p.total_answers), false],
              [t("reflexes"), String((p.reflexes || []).length), false],
              [t("edited"), dd(date), false],
              ["ECO", "2026", false],
            ].map(([l, v, hi], i) => (
              <div key={i} style={{ padding: "8px 13px", borderBottom: "1px solid rgba(255,255,255,.10)", borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,.10)" : "none" }}>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, letterSpacing: 1.3, textTransform: "uppercase", color: "#7E93A8", marginBottom: 3 }}>{l}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, fontWeight: 600, color: hi ? C.amber : "#fff" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "22px 20px 24px" }}>
          {!hasData ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: C.muted, fontSize: 13.5 }}>{t("empty")}</div>
          ) : (
            <>
              {/* ---------- 01 · CARTE + CHEMIN CRITIQUE ---------- */}
              <div className="pt-band">
                <div className="pt-bt">
                  <span className="pt-bn">01</span>
                  <h2>{t("s1")}</h2>
                  <span className="pt-hint">{p.total_areas} · {p.acquired} {t("legAcq")} · {p.total_areas - p.acquired} {lang === "en" ? "ahead" : "devant vous"}</span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: C.text, marginBottom: 12, maxWidth: 660 }}>{t("lead")}</div>

                <svg viewBox="0 0 780 300" style={{ width: "100%", height: 300, display: "block" }} role="img">
                  {/* liens */}
                  {p.nodes.flatMap((n) =>
                    (n.depends_on || []).map((d) => {
                      const a = pos[d], b = pos[n.area];
                      if (!a || !b) return null;
                      const onCp = cpEdgeSet.has(cpKey(d, n.area));
                      const toFuture = n.state === "untouched";
                      return (
                        <line key={`${d}-${n.area}`} x1={a.x + 44} y1={a.y} x2={b.x - 44} y2={b.y}
                          stroke={onCp ? C.amber : toFuture ? C.future : C.rule}
                          strokeWidth={onCp ? 3.2 : 1.6}
                          strokeDasharray={toFuture && !onCp ? "4 4" : undefined}
                          strokeLinecap="round" />
                      );
                    })
                  )}
                  {/* nœuds */}
                  {p.nodes.map((n) => {
                    const q = pos[n.area];
                    if (!q) return null;
                    const fill = STATE_COLOR[n.state];
                    const future = n.state === "untouched";
                    const label = { acquired: t("legAcq"), in_progress: t("legProg"), fragile: t("legFrag"), untouched: t("legWait") }[n.state];
                    return (
                      <g key={n.area}>
                        <rect x={q.x - 44} y={q.y - 20} width={88} height={40} rx={3}
                          fill={future ? "none" : fill}
                          stroke={future ? C.future : "none"} strokeWidth={1.5}
                          strokeDasharray={future ? "4 3" : undefined} />
                        <text x={q.x} y={q.y - 2} textAnchor="middle"
                          style={{ fontFamily: "'Inter',sans-serif", fontSize: 9.5, fontWeight: 600, fill: future ? "#7E8FA0" : "#fff" }}>
                          {n.label.length > 13 ? n.label.slice(0, 12) + "." : n.label}
                        </text>
                        <text x={q.x} y={q.y + 10} textAnchor="middle"
                          style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 7.5, fill: future ? "#9AA9B6" : "#fff", opacity: future ? 1 : 0.9 }}>
                          {future ? label : `${label} · ${Math.round(n.score * 100)}%`}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 6, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.muted }}>
                  {[[C.green, t("legAcq")], [C.amber, t("legProg")], [C.red, t("legFrag")]].map(([c, l]) => (
                    <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <i style={{ width: 9, height: 9, borderRadius: 2, background: c }} />{l}
                    </span>
                  ))}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <i style={{ width: 9, height: 9, borderRadius: 2, border: `1.5px dashed ${C.future}` }} />{t("legWait")}
                  </span>
                  <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <i style={{ width: 18, height: 3, borderRadius: 2, background: C.amber }} />{t("legCp")}
                  </span>
                </div>

                <div style={{ marginTop: 13, background: "#fff", border: `1px solid ${C.rule}`, borderLeft: `3px solid ${C.amber}`, padding: "12px 14px", fontSize: 12.8, lineHeight: 1.65 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 1.4, textTransform: "uppercase", color: "#B5701E", marginBottom: 5 }}>{t("reading")}</div>
                  <span dangerouslySetInnerHTML={{ __html: (p.reading || "").replace(/\*\*(.+?)\*\*/g, `<b style="color:${C.ink}">$1</b>`) }} />
                </div>
              </div>

              {/* ---------- 02 · TRAJECTOIRE + PROJECTION ---------- */}
              <div className="pt-band">
                <div className="pt-bt">
                  <span className="pt-bn">02</span>
                  <h2>{t("s2")}</h2>
                  <span className="pt-hint">{t("s2hint")}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: traj.length >= 2 ? "1.5fr 1fr" : "1fr", gap: 13 }}>
                  {traj.length >= 2 && (
                    <svg viewBox="0 0 520 150" style={{ width: "100%", height: 150 }} role="img">
                      <line x1="0" y1="24" x2="520" y2="24" stroke={C.green} strokeWidth="1.4" strokeDasharray="5 4" />
                      <text x="516" y="18" textAnchor="end" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8.5, fill: C.green }}>
                        {t("threshold")} · {Math.round(p.target * 100)} %
                      </text>
                      {[66, 108].map((y) => <line key={y} x1="0" y1={y} x2="520" y2={y} stroke={C.rule2} strokeWidth="1" />)}
                      {(() => {
                        const n = traj.length;
                        const X = (i) => 18 + (i * (382 / Math.max(1, n - 1)));
                        const Y = (v) => 108 - (v / p.target) * 84;
                        const d = traj.map((s, i) => `${i ? "L" : "M"}${X(i)},${Math.max(20, Y(s.readiness))}`).join(" ");
                        const last = traj[n - 1];
                        const lx = X(n - 1), ly = Math.max(20, Y(last.readiness));
                        return (
                          <>
                            <path d={d} fill="none" stroke={C.teal} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                            {traj.slice(0, -1).map((s, i) => <circle key={i} cx={X(i)} cy={Math.max(20, Y(s.readiness))} r="3.2" fill={C.teal} />)}
                            <circle cx={lx} cy={ly} r="5" fill={C.amber} />
                            <text x={lx} y={ly - 10} textAnchor="middle" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fill: "#B5701E", fontWeight: 600 }}>
                              {Math.round(last.readiness * 100)} %
                            </text>
                            {pj.enough && !pj.reached && pj.eta && (
                              <>
                                <path d={`M${lx},${ly} L500,24`} fill="none" stroke={C.amber} strokeWidth="2" strokeDasharray="5 4" opacity=".85" />
                                <circle cx="500" cy="24" r="4.5" fill="none" stroke={C.amber} strokeWidth="2" />
                                <text x="504" y="130" textAnchor="end" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fill: "#B5701E" }}>{t("proj")}</text>
                              </>
                            )}
                            <text x="18" y="130" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fill: C.muted }}>1</text>
                            <text x={lx} y="130" textAnchor="middle" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fill: C.muted }}>{t("today")}</text>
                          </>
                        );
                      })()}
                    </svg>
                  )}
                  <div style={{ background: C.ink, color: "#fff", padding: "14px 15px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 1.4, textTransform: "uppercase", color: "#7E93A8", marginBottom: 6 }}>{t("atPace")}</div>
                    {pj.enough && !pj.reached && pj.eta ? (
                      <>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 21, color: C.amber, lineHeight: 1.2, letterSpacing: "-.4px" }}>
                          {lang === "en" ? "Target around" : "Seuil atteint vers le"}<br />
                          {new Date(pj.eta).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long" })}
                        </div>
                        <div style={{ fontSize: 11.5, lineHeight: 1.55, color: "#9DB0C2", marginTop: 8 }}>
                          {lang === "en"
                            ? <>You have <b style={{ color: "#EAF0F6" }}>{pj.remaining_points} points</b> to gain. Your pace is <b style={{ color: "#EAF0F6" }}>+{(pj.per_week * 100).toFixed(1)} pts/week</b>.</>
                            : <>Il vous reste <b style={{ color: "#EAF0F6" }}>{pj.remaining_points} points</b> à gagner. Votre rythme est de <b style={{ color: "#EAF0F6" }}>+{(pj.per_week * 100).toFixed(1)} pts/semaine</b>.</>}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15, color: "#EAF0F6", lineHeight: 1.5 }}>{pj.note}</div>
                    )}
                    {pj.enough && !pj.reached && pj.eta && (
                      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8.5, color: "#7E93A8", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.12)", lineHeight: 1.5 }}>
                        {pj.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ---------- 03 · ECO ---------- */}
              <div className="pt-band">
                <div className="pt-bt">
                  <span className="pt-bn">03</span>
                  <h2>{t("s3")}</h2>
                  <span className="pt-hint">{t("s3hint")}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 11 }}>
                  {[["people", "People", 33], ["process", "Process", 41], ["business", "Business", 26]].map(([k, lbl, w]) => {
                    const v = (p.eco || {})[k] || 0;
                    const col = v >= 0.70 ? C.green : v >= 0.45 ? C.amber : C.red;
                    const gap = Math.max(0, p.target - v);
                    return (
                      <div key={k} className="pt-card">
                        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 1.3, textTransform: "uppercase", color: C.muted, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                          <span>{lbl}</span><span>{w} %</span>
                        </div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 26, lineHeight: 1, color: col, letterSpacing: "-1px" }}>
                          {Math.round(v * 100)}<span style={{ fontSize: 14 }}>%</span>
                        </div>
                        <div style={{ height: 5, background: C.rule2, marginTop: 10, position: "relative" }}>
                          <span style={{ position: "absolute", left: `${v * 100}%`, width: `${gap * 100}%`, top: 0, height: "100%", background: "repeating-linear-gradient(45deg,#CBD5DE,#CBD5DE 2px,transparent 2px,transparent 4px)" }} />
                          <span style={{ display: "block", height: "100%", width: `${v * 100}%`, background: col }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ---------- 04 · RÉFLEXES ---------- */}
              <div className="pt-band">
                <div className="pt-bt">
                  <span className="pt-bn">04</span>
                  <h2>{t("s4")}</h2>
                  <span className="pt-hint">{t("s4hint")}</span>
                </div>
                {(p.reflexes || []).length === 0 ? (
                  <div style={{ border: `1px dashed ${C.future}`, padding: "22px", textAlign: "center", color: "#7E8FA0", fontSize: 12.5 }}>{t("noRefl")}</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
                    {(p.reflexes || []).slice(0, 3).map((x, i) => (
                      <div key={i} className="pt-card">
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, fontSize: 13, lineHeight: 1.55, color: C.ink }}>« {x.text} »</div>
                        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: C.muted, marginTop: 9, paddingTop: 8, borderTop: `1px solid ${C.rule2}`, display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ color: C.teal }}>{x.seat_label}</span>
                          <span>{x.at ? new Date(x.at).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "short" }) : ""}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ border: `1px dashed ${C.future}`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 14 }}>
                      <div style={{ fontSize: 12.5, color: "#7E8FA0", lineHeight: 1.55, whiteSpace: "pre-line" }}>{t("nextRefl")}</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ---------- PIED ---------- */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", borderTop: `1px solid ${C.rule}`, marginTop: 22, paddingTop: 11, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, color: C.muted }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: C.ink, fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 40 40"><polygon points="20,6 34,32 6,32" fill="none" stroke={C.amber} strokeWidth="2.4" strokeLinejoin="round" /></svg>
              Certifizer
            </div>
            <div>{t("own")}</div>
            <div>certifizer.app</div>
          </div>
        </div>
      </div>
    </div>
  );
}
