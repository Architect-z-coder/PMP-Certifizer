import React, { useState, useEffect, useMemo } from "react";
import { C, KA, ECO_DOMAINS, ECO_TASKS } from "./pmp.js";
import { getCohortOverview, seedDemoCohort } from "./api.js";

/*
  CockpitFormateur — trainer action-cockpit.
  Wired to GET /api/cohort/overview which aggregates the whole cohort:
   size, learners[], readiness{score,ready,building,at_risk,active7},
   per_area[], fragile_topics[], critical_path[], groups{}, flags[].
  Access is gated in App.jsx (learner id "formateur"). Cohort is a neutral code.
*/

const DOMC = { people: "#8A6FB0", process: "#2E8C9E", business: "#E89A3C", biz: "#E89A3C" };
const DOMSHORT = { people: { fr: "Les gens", en: "People" }, process: { fr: "Le projet", en: "Process" }, business: { fr: "L'entreprise", en: "Business" } };

// area -> short label (reuse KA + ECO task labels)
const AREA_LABEL = {};
KA.forEach((k) => { AREA_LABEL[k.id] = { fr: k.fr, en: k.en }; });
["people", "process", "biz"].forEach((d) => (ECO_TASKS[d] || []).forEach((t) => { if (!AREA_LABEL[t.area]) AREA_LABEL[t.area] = { fr: t.fr, en: t.en }; }));
function areaLabel(area, lang) { const o = AREA_LABEL[area]; return o ? (lang === "en" ? o.en : o.fr) : area; }

function color(m) { return m >= 0.75 ? "#3DA776" : m >= 0.5 ? "#E8A765" : "#D2664E"; }

export default function CockpitFormateur({ lang, isMobile, trainerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const t = (fr, en) => (lang === "en" ? en : fr);

  useEffect(() => {
    setLoading(true);
    getCohortOverview(null, trainerId).then((d) => { setData(d); setLoading(false); }).catch((e) => { setErr(String(e)); setLoading(false); });
  }, [trainerId]);

  if (loading) return <Center>{t("Chargement de la cohorte…", "Loading cohort…")}</Center>;
  if (err || !data) return <Center>{t("Impossible de charger la cohorte. Le serveur se réveille peut-être — réessayez.", "Could not load the cohort. The server may be waking up — try again.")}</Center>;
  if (!data.size) {
    return (
      <Center>
        <div style={{ maxWidth: 400 }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🎛️</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 6 }}>{t("Votre cohorte est vide pour l'instant", "Your cohort is empty for now")}</div>
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55, marginBottom: 16 }}>{t("Aucun apprenant n'est encore rattaché à vos cohortes. Pour une démonstration, vous pouvez configurer la cohorte de démonstration : elle rattache les apprenants existants à la cohorte PMP-2026-A et vous en donne l'animation.", "No learners are linked to your cohorts yet. For a demo, you can set up the demo cohort: it links existing learners to PMP-2026-A and makes you its trainer.")}</div>
          <button disabled={seeding} onClick={async () => {
            setSeeding(true);
            try { await seedDemoCohort(trainerId); const d = await getCohortOverview(null, trainerId); setData(d); } catch (e) { setErr(String(e)); }
            setSeeding(false);
          }} style={{ border: "none", borderRadius: 11, background: seeding ? "#C9D6E0" : C.amber, color: "#0E1A2B", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, padding: "12px 20px", cursor: seeding ? "default" : "pointer" }}>
            {seeding ? t("Configuration…", "Setting up…") : t("Configurer la cohorte de démonstration", "Set up the demo cohort")}
          </button>
        </div>
      </Center>
    );
  }

  const rd = data.readiness;
  const pct = Math.round(rd.score * 100);

  return (
    <div className="ak-scroll" style={{ flex: 1, overflowY: "auto", padding: isMobile ? 14 : 20, background: C.paper }}>
      {/* cohort code strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 12, color: C.muted }}>
        <span style={{ background: C.ink2, color: "#EAF0F6", borderRadius: 9, padding: "5px 11px", display: "flex", gap: 6, alignItems: "center" }}>
          {t("Cohorte", "Cohort")} <b style={{ fontFamily: "'IBM Plex Mono',monospace", color: "#7FD3E0" }}>PMP-2026-A</b> ▾
        </span>
        <span>{data.size} {t("apprenants", "learners")}</span>
        <span style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, background: "rgba(46,140,158,.15)", color: C.teal, border: `1px solid ${C.teal}`, borderRadius: 999, padding: "4px 11px" }}>● {t("accès formateur", "trainer access")}</span>
      </div>

      {/* BRIEF */}
      <div style={{ background: "linear-gradient(135deg,#1B2E45,#0E1A2B)", borderRadius: 16, padding: "18px 20px", color: "#EAF0F6", marginBottom: 16, display: isMobile ? "block" : "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 19, fontWeight: 700, marginBottom: 6 }}>{t("Brief formateur du jour", "Trainer brief of the day")}</div>
          <div style={{ fontSize: 13, color: "#B8C7D6", lineHeight: 1.55, maxWidth: 560 }}>
            {t("La cohorte progresse. Le chemin critique révèle ", "The cohort is progressing. The critical path reveals ")}
            <b style={{ color: C.amber }}>{data.critical_path.length} {t("sujets prioritaires", "priority topics")}</b>{t(" à traiter pour débloquer le plus de préparation.", " to unblock the most readiness.")}
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 13, flexWrap: "wrap" }}>
            <Kpi v={`${rd.active7}/${data.size}`} l={t("actifs (7 j)", "active (7d)")} />
            <Kpi v={`${pct}%`} l={t("prêt moyen", "avg ready")} c={pct >= 75 ? "#3DA776" : pct >= 50 ? "#E8A765" : "#D2664E"} />
            <Kpi v={rd.ready} l={t("prêts", "ready")} c="#3DA776" />
            <Kpi v={rd.at_risk} l={t("à risque", "at risk")} c="#D2664E" />
          </div>
        </div>
        <button onClick={() => { setToast(true); setTimeout(() => setToast(false), 3200); }} style={{ background: C.amber, color: C.ink, border: "none", borderRadius: 11, padding: "13px 18px", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap", marginTop: isMobile ? 14 : 0 }}>＋ {t("Créer une séance ciblée", "Create a targeted session")}</button>
      </div>

      {/* BLOCKERS */}
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{t("Ce qui bloque le plus la préparation collective", "What most blocks collective readiness")}</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{t("Les sujets les plus faibles de la cohorte, pondérés par leur poids à l'examen.", "The cohort's weakest topics, weighted by exam weight.")}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        {data.fragile_topics.map((b) => {
          const dom = b.domain || "process";
          return (
            <div key={b.area} style={{ flex: 1, minWidth: 130, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "11px 13px", borderTop: `3px solid ${DOMC[dom]}` }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 5 }}>{lang === "en" ? b.en : b.fr}</div>
              <div style={{ height: 6, background: "#E4EAF0", borderRadius: 5, overflow: "hidden", marginBottom: 5 }}><span style={{ display: "block", height: "100%", width: `${Math.round(b.avg * 100)}%`, background: color(b.avg), borderRadius: 5 }} /></div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.muted }}>{Math.round(b.avg * 100)}% {t("moyen", "avg")} · {b.learners_fragile}/{b.learners_tested} {t("fragiles", "fragile")}</div>
            </div>
          );
        })}
      </div>

      {/* INTERVENTIONS (generated from fragile topics + flags) */}
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, margin: "18px 0 3px" }}>{t("Interventions suggérées", "Suggested interventions")}</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{t("Actions concrètes générées à partir de l'état réel de la cohorte.", "Concrete actions generated from the cohort's real state.")}</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        <Intervention al={t("priorité 1", "priority 1")} alc="#B5432A" alb="#FBE7E1" title={t("Mini-session", "Mini-session") + " · " + (lang === "en" ? data.fragile_topics[0]?.en : data.fragile_topics[0]?.fr)} desc={`${data.fragile_topics[0]?.learners_fragile}/${data.fragile_topics[0]?.learners_tested} ${t("apprenants fragiles ici. À reprendre en priorité.", "learners fragile here. Address first.")}`} cta={t("Planifier 20 min →", "Schedule 20 min →")} amber impact={t("gain de points le plus élevé", "highest point gain")} />
        <Intervention al={t("qualité question", "question quality")} alc="#9A651E" alb="#FBF1E1" title={`${data.flags.length} ${t("items signalés", "flagged items")}`} desc={t("Signalements d'apprenants à revoir (formulation, traduction).", "Learner flags to review (wording, translation).")} cta={t("Ouvrir la revue →", "Open review →")} impact={t("réduit l'échec parasite", "cuts noise failures")} />
        <Intervention al={t("suivi", "follow-up")} alc="#2C68A0" alb="#E7F0FB" title={`${data.groups.accompany.length} ${t("apprenants à risque", "learners at risk")}`} desc={t("Faible activité ou progression bloquée depuis plus de 7 jours.", "Low activity or blocked progress for 7+ days.")} cta={t("Voir le groupe →", "See the group →")} impact={t("évite des décrochages", "prevents dropouts")} />
        <Intervention al={t("entretien", "maintenance")} alc="#2E7D57" alb="#E4F3EC" title={t("Rappel collectif", "Collective refresh")} desc={t("Sujets acquis mais peu pratiqués récemment par la cohorte.", "Topics mastered but little practised lately by the cohort.")} cta={t("Ajouter un rappel →", "Add a refresh →")} impact={t("maintient l'acquis", "keeps mastery fresh")} />
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 6, marginBottom: 13, flexWrap: "wrap" }}>
        {[t("Carte cohorte", "Cohort map"), t("Groupes d'action", "Action groups"), t("Heatmap détaillée", "Detailed heatmap"), t("Qualité des questions", "Question quality")].map((lbl, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ border: `1px solid ${tab === i ? C.ink : C.line}`, background: tab === i ? C.ink : "#fff", color: tab === i ? "#fff" : C.muted, fontSize: 12.5, fontWeight: 700, borderRadius: 999, padding: "8px 14px", cursor: "pointer" }}>{lbl}</button>
        ))}
      </div>

      {tab === 0 && <CohortMap data={data} lang={lang} isMobile={isMobile} />}
      {tab === 1 && <ActionGroups data={data} lang={lang} isMobile={isMobile} />}
      {tab === 2 && <Heatmap data={data} lang={lang} />}
      {tab === 3 && <Quality data={data} lang={lang} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#0E1A2B", color: "#EAF0F6", border: "1px solid #3DA776", borderRadius: 12, padding: "13px 18px", fontSize: 13, zIndex: 200, boxShadow: "0 12px 40px rgba(0,0,0,.4)", display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#3DA776", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✓</span>
          <span>{t("Séance ciblée créée — ", "Targeted session created — ")}<b style={{ color: "#3DA776" }}>{data.critical_path.slice(0, 2).map((c) => (lang === "en" ? c.en : c.fr)).join(" + ")}</b>{t(" · 10 questions.", " · 10 questions.")}</span>
        </div>
      )}
    </div>
  );
}

function CohortMap({ data, lang, isMobile }) {
  const t = (fr, en) => (lang === "en" ? en : fr);
  // build nodes from per_area, grouped by domain, sun layout
  const byDom = { people: [], process: [], business: [] };
  data.per_area.forEach((a) => { const d = a.domain || "process"; if (byDom[d]) byDom[d].push(a); });
  const CENTER = { x: 450, y: 220 }, HUB = { people: { x: 230, y: 130 }, process: { x: 680, y: 135 }, business: { x: 640, y: 330 } };
  const P = {};
  Object.keys(byDom).forEach((d) => {
    const hub = HUB[d], list = byDom[d], n = list.length || 1;
    const outA = Math.atan2(hub.y - CENTER.y, hub.x - CENTER.x), spread = Math.PI * 0.95, start = outA - spread / 2;
    list.forEach((a, i) => { const ang = n > 1 ? start + spread * (i / (n - 1)) : outA, r = 95 + (i % 2 ? 18 : 0); P[a.area] = { x: hub.x + Math.cos(ang) * r, y: hub.y + Math.sin(ang) * r }; });
  });
  const crit = data.critical_path.map((c) => c.area);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 15 }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{t("La carte PMP colorée par la moyenne de ", "The PMP map coloured by the average of ")}<b>{t("toute la cohorte", "the whole cohort")}</b>{t(". Les nœuds rouges = la cohorte bloque ici.", ". Red nodes = the cohort is stuck here.")}</div>
      <svg viewBox="0 0 900 420" style={{ width: "100%", height: isMobile ? 300 : 420, display: "block" }}>
        {Object.keys(HUB).map((d) => <line key={d} x1={CENTER.x} y1={CENTER.y} x2={HUB[d].x} y2={HUB[d].y} stroke="#C4D0DB" strokeWidth="2" />)}
        {data.per_area.map((a) => { const p = P[a.area]; if (!p) return null; const hub = HUB[a.domain] || HUB.process; return <path key={"e" + a.area} d={`M${hub.x} ${hub.y} Q ${(hub.x + p.x) / 2} ${(hub.y + p.y) / 2} ${p.x} ${p.y}`} fill="none" stroke="#C4D0DB" strokeWidth="1.2" />; })}
        {crit.map((area, i) => { if (i === crit.length - 1) return null; const a = P[area], b = P[crit[i + 1]]; if (!a || !b) return null; return <path key={"c" + i} d={`M${a.x} ${a.y} C ${(a.x + b.x) / 2} ${a.y},${(a.x + b.x) / 2} ${b.y},${b.x} ${b.y}`} fill="none" stroke="#8A6FB0" strokeWidth="3" strokeDasharray="7 5" />; })}
        <circle cx={CENTER.x} cy={CENTER.y} r="40" fill="#0E1A2B" stroke={C.amber} strokeWidth="3" />
        <text x={CENTER.x} y={CENTER.y - 2} textAnchor="middle" fill="#fff" style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13 }}>{t("Cohorte", "Cohort")}</text>
        <text x={CENTER.x} y={CENTER.y + 12} textAnchor="middle" fill="#9DB0C2" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8 }}>{Math.round(data.readiness.score * 100)}% {t("moyen", "avg")}</text>
        {Object.keys(HUB).map((d) => <g key={"h" + d}><circle cx={HUB[d].x} cy={HUB[d].y} r="34" fill={DOMC[d]} stroke="#fff" strokeWidth="3" /><text x={HUB[d].x} y={HUB[d].y + 4} textAnchor="middle" fill="#fff" style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11 }}>{DOMSHORT[d][lang] || DOMSHORT[d].fr}</text></g>)}
        {data.per_area.map((a) => { const p = P[a.area]; if (!p) return null; const r = 15, tested = a.learners_tested > 0; return (
          <g key={"n" + a.area}>
            <circle cx={p.x} cy={p.y} r={r} fill={tested ? color(a.avg) : "#C9D6E0"} stroke="#fff" strokeWidth="2.2" />
            <text x={p.x} y={p.y + r + 11} textAnchor="middle" style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, fontWeight: 600, fill: C.text }}>{lang === "en" ? a.en : a.fr}</text>
          </g>
        ); })}
      </svg>
      <div style={{ display: "flex", gap: 13, flexWrap: "wrap", fontSize: 10.5, color: C.muted, marginTop: 8 }}>
        <Lg c="#D2664E" x={t("cohorte fragile", "cohort fragile")} /><Lg c="#E8A765" x={t("en progrès", "in progress")} /><Lg c="#3DA776" x={t("acquise", "mastered")} /><Lg c="#8A6FB0" x={t("chemin critique collectif", "collective critical path")} />
      </div>
    </div>
  );
}

function ActionGroups({ data, lang, isMobile }) {
  const t = (fr, en) => (lang === "en" ? en : fr);
  const cols = [
    { key: "accompany", h: t("À accompagner", "To support"), s: t("bloqués / inactifs", "blocked / inactive"), c: "#D2664E" },
    { key: "consolidate", h: t("À consolider", "To consolidate"), s: t("proches du seuil", "near threshold"), c: "#E8A765" },
    { key: "challenge", h: t("À challenger", "To challenge"), s: t("solides, niveau examen", "solid, exam level"), c: "#2E8C9E" },
    { key: "maintain", h: t("À maintenir", "To maintain"), s: t("prêts, entretien léger", "ready, light upkeep"), c: "#3DA776" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12 }}>
      {cols.map((col) => {
        const list = data.groups[col.key] || [];
        return (
          <div key={col.key} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 14px", borderTop: `3px solid ${col.c}` }}>
            <div style={{ float: "right", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 20, color: col.c }}>{list.length}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13 }}>{col.h}</div>
            <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 11 }}>{col.s}</div>
            {list.slice(0, 8).map((l) => (
              <div key={l.learner_id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.line}`, fontSize: 12 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.muted, flex: "none" }}>{(l.name.match(/[A-ZÀ-Ü]/g) || []).slice(0, 2).join("")}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name}</span>
                {l.days_inactive != null && l.days_inactive > 7 ? <span style={{ color: "#D2664E", fontSize: 10 }}>· {Math.round(l.days_inactive)}j</span> : null}
                <span style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: C.muted }}>{Math.round(l.readiness * 100)}%</span>
              </div>
            ))}
            {list.length === 0 ? <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic", paddingTop: 4 }}>{t("aucun", "none")}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

function Heatmap({ data, lang }) {
  const t = (fr, en) => (lang === "en" ? en : fr);
  // columns = attempted areas (fragile first for signal), rows = learners
  const areas = data.per_area.filter((a) => a.learners_tested > 0).slice(0, 12);
  // we only have cohort averages per area from overview, not per-learner-per-area.
  // Show per-learner readiness heat across domains as an honest approximation label.
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 15, overflowX: "auto" }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{t("Maîtrise moyenne de la cohorte par sujet. Le détail par apprenant arrivera dans une prochaine version.", "Cohort average mastery per topic. Per-learner detail is coming in a later version.")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {areas.map((a) => (
          <div key={a.area} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 150, fontSize: 12, fontWeight: 600, flex: "none" }}>{lang === "en" ? a.en : a.fr}</div>
            <div style={{ flex: 1, height: 18, background: "#E4EAF0", borderRadius: 5, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${Math.round(a.avg * 100)}%`, background: color(a.avg) }} /></div>
            <div style={{ width: 96, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: C.muted, textAlign: "right" }}>{Math.round(a.avg * 100)}% · {a.learners_fragile}/{a.learners_tested} {t("frag.", "frag.")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Quality({ data, lang }) {
  const t = (fr, en) => (lang === "en" ? en : fr);
  if (!data.flags.length) return <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20, textAlign: "center", color: C.muted, fontSize: 13 }}>{t("Aucune question signalée pour l'instant.", "No flagged questions yet.")}</div>;
  return (
    <div>
      {data.flags.map((f) => (
        <div key={f.external_id} style={{ display: "flex", gap: 11, alignItems: "flex-start", background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", marginBottom: 9 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "#FBEDE9", color: "#D2664E", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>⚑</div>
          <div><div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>{f.external_id}</div><div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.muted }}>{f.count} {t("signalement(s)", "flag(s)")}{f.reasons[0] ? ` · « ${f.reasons[0]} »` : ""}</div></div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 7, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: C.muted }}>{t("Voir", "View")}</button>
            <button style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 7, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: C.muted }}>{t("Corriger", "Fix")}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Intervention({ al, alc, alb, title, desc, cta, amber, impact }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 15px", display: "flex", flexDirection: "column" }}>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: 600, padding: "2px 8px", borderRadius: 6, alignSelf: "flex-start", marginBottom: 9, background: alb, color: alc }}>{al}</span>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, flex: 1, marginBottom: 11 }}>{desc}</div>
      {impact ? <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#2E7D57", background: "#E4F3EC", borderRadius: 6, padding: "2px 8px", marginBottom: 9, alignSelf: "flex-start" }}>{impact}</div> : null}
      <button style={{ border: "none", borderRadius: 9, padding: 9, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer", background: amber ? C.amber : C.ink, color: amber ? C.ink : "#fff", width: "100%" }}>{cta}</button>
    </div>
  );
}

function Kpi({ v, l, c }) { return <div><div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: c || "#fff" }}>{v}</div><div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8.5, letterSpacing: 0.5, textTransform: "uppercase", color: "#8FA6BC", marginTop: 2 }}>{l}</div></div>; }
function Lg({ c, x }) { return <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: c, display: "inline-block" }} />{x}</span>; }
function Center({ children }) { return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13, padding: 30, textAlign: "center", lineHeight: 1.6 }}>{children}</div>; }
