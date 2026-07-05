import React, { useState, useEffect, useMemo } from "react";
import { C, KA, ECO_DOMAINS, ECO_TASKS } from "./pmp.js";
import { getCohortOverview, seedDemoCohort, createTargetedSession, getTargetedSessions, getSessionPreview, getQuestionBank, createTrainerItem, polishQuestion, createInvitations, getInvitations, revokeInvitation } from "./api.js";

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
  const [toast, setToast] = useState(null);   // null | {title, assigned}
  const [seeding, setSeeding] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState(null);     // {concepts, items} being reviewed
  const [previewLoading, setPreviewLoading] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);   // v35 — panneau d'invitations
  const t = (fr, en) => (lang === "en" ? en : fr);

  useEffect(() => {
    setLoading(true);
    getCohortOverview(null, trainerId).then((d) => { setData(d); setLoading(false); }).catch((e) => { setErr(String(e)); setLoading(false); });
    getTargetedSessions(trainerId).then(setSessions).catch(() => {});
  }, [trainerId]);

  async function onOpenPreview() {
    if (previewLoading) return;
    setPreviewLoading(true);
    try {
      const pv = await getSessionPreview(trainerId, null, 10);
      if (pv && pv.items) setPreview(pv);
    } catch (e) { /* cockpit stays usable */ }
    setPreviewLoading(false);
  }

  async function onConfirmCreate(editedItems, learnerIds) {
    if (creating || !preview) return;
    const finalItems = editedItems || preview.items;
    setCreating(true);
    try {
      const ids = finalItems.map((x) => x.external_id);
      const r = await createTargetedSession(trainerId, {
        concepts: preview.concepts, question_count: ids.length, item_ids: ids,
        learner_ids: learnerIds || [],
      });
      if (r && r.session_id) {
        setPreview(null);
        setToast({ title: r.title, assigned: r.assigned_count });
        setTimeout(() => setToast(null), 4200);
        getTargetedSessions(trainerId).then(setSessions).catch(() => {});
      }
    } catch (e) { /* keep calm */ }
    setCreating(false);
  }

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
        <button onClick={() => setInvitesOpen(true)} style={{ border: `1px dashed ${C.teal}`, background: "rgba(46,140,158,.08)", color: C.teal, borderRadius: 999, padding: "4px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
          ✉ {t("Inviter des apprenants", "Invite learners")}
        </button>
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
        <button onClick={onOpenPreview} disabled={previewLoading} style={{ background: previewLoading ? "#C9D6E0" : C.amber, color: C.ink, border: "none", borderRadius: 11, padding: "13px 18px", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: previewLoading ? "default" : "pointer", whiteSpace: "nowrap", marginTop: isMobile ? 14 : 0 }}>＋ {previewLoading ? t("Préparation…", "Preparing…") : t("Créer une séance ciblée", "Create a targeted session")}</button>
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

      {sessions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{t("Séances ciblées créées", "Created targeted sessions")}</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{t("Assignées à la cohorte — suivi de réalisation.", "Assigned to the cohort — completion tracking.")}</div>
          {sessions.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 11, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "11px 14px", marginBottom: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F1EAF7", color: "#5E4980", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", fontSize: 14 }}>🎯</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.muted }}>{s.question_count} {t("questions", "questions")} · {s.concepts.join(", ")}</div>
              </div>
              <div style={{ textAlign: "right", flex: "none" }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: s.completed === s.assigned && s.assigned > 0 ? "#3DA776" : C.text }}>{s.completed}/{s.assigned}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: C.muted }}>{t("terminées", "completed")}</div>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {preview && (
        <SessionEditor lang={lang} trainerId={trainerId} preview={preview} creating={creating}
          learners={data.learners || []}
          onCancel={() => setPreview(null)} onConfirm={onConfirmCreate} />
      )}

      {invitesOpen && (
        <InvitePanel lang={lang} trainerId={trainerId} onClose={() => setInvitesOpen(false)} />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#0E1A2B", color: "#EAF0F6", border: "1px solid #3DA776", borderRadius: 12, padding: "13px 18px", fontSize: 13, zIndex: 200, boxShadow: "0 12px 40px rgba(0,0,0,.4)", display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#3DA776", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✓</span>
          <span>{t("Séance ciblée créée — ", "Targeted session created — ")}<b style={{ color: "#3DA776" }}>{toast.title}</b>{t(` · assignée à ${toast.assigned} apprenant${toast.assigned > 1 ? "s" : ""}.`, ` · assigned to ${toast.assigned} learner${toast.assigned > 1 ? "s" : ""}.`)}</span>
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

/* ======================================================================
   v34 — SessionEditor : la boîte à outils d'édition du formateur.
   Quatre outils : retirer (✕), remplacer (↻ suggestion même zone),
   réordonner (▲▼), ajouter (banque cloisonnée) — plus « Créer ma question »
   avec correction de formulation par l'IA (proposition, jamais imposée).
   NOTE PRODUIT : version volontairement légère. Un véritable outil d'auteur
   (brouillons, relecture, versions) viendra plus tard si le besoin se confirme.
   ====================================================================== */
function SessionEditor({ lang, trainerId, preview, creating, onCancel, onConfirm, learners = [] }) {
  const t = (fr, en) => (lang === "en" ? en : fr);
  const [items, setItems] = useState(preview.items);
  // v36 — destinataires : tous cochés par défaut (cas rapide « toute la cohorte »)
  const [recipients, setRecipients] = useState(() => new Set(learners.map((l) => l.learner_id)));
  const toggleRecipient = (lid) => setRecipients((prev) => {
    const next = new Set(prev); next.has(lid) ? next.delete(lid) : next.add(lid); return next;
  });
  const allCohort = learners.length > 0 && recipients.size === learners.length;
  const [bank, setBank] = useState(null);            // cache de la banque cloisonnée
  const [bankLoading, setBankLoading] = useState(false);
  const [panel, setPanel] = useState(null);          // null | "bank" | "author"
  const [bSearch, setBSearch] = useState("");
  const [bArea, setBArea] = useState("");
  const [bDiff, setBDiff] = useState("");
  const [swap, setSwap] = useState(null);            // {forId, candidate, tried:[]}
  // formulaire « ma question »
  const emptyForm = { prompt: "", opts: ["", "", "", ""], good: -1, rationale: "", area: (preview.concepts && preview.concepts[0]) || "integration", diff: 2 };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [polishBusy, setPolishBusy] = useState(false);
  const [proposal, setProposal] = useState(null);    // {prompt, options, rationale} | {msg}

  const inSel = (eid) => items.some((x) => x.external_id === eid);
  const areaOptions = useMemo(() => {
    const ids = [...new Set([...(preview.concepts || []), ...KA.map((k) => k.id)])];
    return ids;
  }, [preview.concepts]);

  async function loadBank() {
    if (bank || bankLoading) return bank;
    setBankLoading(true);
    try { const r = await getQuestionBank(trainerId, {}); const b = (r && r.items) || []; setBank(b); setBankLoading(false); return b; }
    catch (e) { setBankLoading(false); return []; }
  }

  function move(i, dir) {
    const next = [...items]; const tmp = next[i]; next[i] = next[i + dir]; next[i + dir] = tmp;
    setItems(next);
  }
  function removeQ(eid) {
    setItems(items.filter((x) => x.external_id !== eid));
    if (swap && swap.forId === eid) setSwap(null);
  }
  async function suggestSwap(eid) {
    const b = (await loadBank()) || bank || [];
    const q = items.find((x) => x.external_id === eid);
    if (!q) return;
    const tried = swap && swap.forId === eid ? swap.tried : [];
    let pool = b.filter((x) => x.area === q.area && !inSel(x.external_id) && !tried.includes(x.external_id));
    if (!pool.length) pool = b.filter((x) => !inSel(x.external_id) && !tried.includes(x.external_id));
    if (!pool.length) { setSwap({ forId: eid, candidate: null, tried }); return; }
    pool.sort((a, c) => Math.abs(a.difficulty - q.difficulty) - Math.abs(c.difficulty - q.difficulty));
    setSwap({ forId: eid, candidate: pool[0], tried: [...tried, pool[0].external_id] });
  }
  function doSwap() {
    if (!swap || !swap.candidate) return;
    setItems(items.map((x) => (x.external_id === swap.forId ? swap.candidate : x)));
    setSwap(null);
  }
  function addFromBank(b) { if (!inSel(b.external_id)) setItems([...items, b]); }

  async function openPanel(which) {
    setPanel(panel === which ? null : which);
    setProposal(null);
    if (which === "bank") loadBank();
  }

  async function onPolish() {
    if (polishBusy) return;
    const opts = form.opts.map((o) => o.trim());
    if (!form.prompt.trim() || opts.some((o) => !o)) {
      setProposal({ msg: t("Complétez d'abord l'énoncé et les quatre réponses — la correction s'occupe du reste.", "Fill in the statement and all four answers first — polishing takes care of the rest.") });
      return;
    }
    setPolishBusy(true); setProposal(null);
    try {
      const r = await polishQuestion(trainerId, { prompt: form.prompt.trim(), options: opts, rationale: form.rationale.trim(), lang });
      if (r && r.proposal) {
        if (r.changed) setProposal(r.proposal);
        else setProposal({ msg: t("✓ Aucune correction nécessaire — votre formulation respecte déjà le vouvoiement et la forme d'examen.", "✓ No correction needed — your wording already matches the exam form.") });
      } else {
        setProposal({ msg: (r && (lang === "en" ? r.message_en : r.message_fr)) || t("La correction est momentanément indisponible.", "Polishing is temporarily unavailable.") });
      }
    } catch (e) {
      setProposal({ msg: t("La correction est momentanément indisponible. Vous pouvez ajouter votre question telle quelle.", "Polishing is temporarily unavailable. You can still add your question as written.") });
    }
    setPolishBusy(false);
  }
  function applyProposal() {
    if (!proposal || proposal.msg) return;
    setForm({ ...form, prompt: proposal.prompt, opts: proposal.options, rationale: proposal.rationale || form.rationale });
    setProposal(null);
  }

  async function onSaveMyQuestion() {
    if (saving) return;
    const opts = form.opts.map((o) => o.trim());
    if (!form.prompt.trim() || opts.some((o) => !o) || form.good < 0) {
      setProposal({ msg: t("Veuillez compléter l'énoncé, les quatre réponses, et cocher la bonne réponse.", "Please fill in the statement, all four answers, and mark the correct one.") });
      return;
    }
    setSaving(true);
    try {
      const r = await createTrainerItem(trainerId, {
        knowledge_area: form.area, prompt: form.prompt.trim(), options: opts,
        answer_index: form.good, rationale: form.rationale.trim(), difficulty: form.diff, lang,
      });
      if (r && r.item) {
        setItems([...items, r.item]);
        if (bank) setBank([...bank, { external_id: r.item.external_id, area: r.item.area, difficulty: r.item.difficulty, prompt: r.item.prompt, trainer_authored: true }]);
        setForm(emptyForm); setProposal(null); setPanel(null);
      } else {
        setProposal({ msg: (r && (lang === "en" ? r.message_en : r.message_fr)) || t("Enregistrement impossible — réessayez.", "Could not save — try again.") });
      }
    } catch (e) {
      setProposal({ msg: t("Enregistrement impossible — le serveur se réveille peut-être, réessayez.", "Could not save — the server may be waking up, try again.") });
    }
    setSaving(false);
  }

  const bankRows = (bank || []).filter((b) => !inSel(b.external_id)
    && (!bArea || b.area === bArea)
    && (!bDiff || String(b.difficulty) === bDiff)
    && (!bSearch || ((b.prompt.fr || "") + " " + (b.prompt.en || "")).toLowerCase().includes(bSearch.toLowerCase())));

  const mono = "'IBM Plex Mono',monospace";
  const grotesk = "'Space Grotesk',sans-serif";
  const inputStyle = { width: "100%", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontFamily: "'Inter',sans-serif", color: C.text, outline: "none", boxSizing: "border-box" };
  const smallLabel = { fontFamily: mono, fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: C.muted, margin: "10px 0 4px" };
  const pillBtn = (active, color) => ({ border: `1px dashed ${color}`, background: active ? color : "transparent", color: active ? "#fff" : color, borderRadius: 9, padding: "7px 12px", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" });

  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(6,11,18,.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 250, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, maxWidth: 640, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 70px rgba(0,0,0,.5)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#E89A3C,#8A6FB0)" }} />
        <div style={{ padding: "16px 20px 10px" }}>
          <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 16.5 }}>{t("Composez votre séance ciblée", "Compose your targeted session")}</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginTop: 4 }}>
            {t("Sujets : ", "Topics: ")}<b style={{ color: "#5E4980" }}>{preview.concepts.map((c) => areaLabel(c, lang)).join(", ")}</b> · {t("Vos apprenants recevront exactement ces questions, dans cet ordre.", "Your learners will receive exactly these questions, in this order.")}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: "#fff", background: C.teal, padding: "4px 11px", borderRadius: 999, fontWeight: 600 }}>{items.length} {t("question" + (items.length > 1 ? "s" : ""), "question" + (items.length > 1 ? "s" : ""))}</span>
            <span style={{ flex: 1 }} />
            <button onClick={() => openPanel("bank")} style={pillBtn(panel === "bank", C.teal)}>＋ {t("Ajouter depuis la banque", "Add from the bank")}</button>
            <button onClick={() => openPanel("author")} style={pillBtn(panel === "author", "#B5701E")}>✍️ {t("Créer ma question", "Create my question")}</button>
          </div>
        </div>

        <div className="ak-scroll" style={{ overflowY: "auto", padding: "4px 20px", flex: 1 }}>
          {items.map((q, i) => (
            <div key={q.external_id} style={{ border: `1px solid ${swap && swap.forId === q.external_id ? C.amber : C.line}`, borderRadius: 11, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flex: "none" }}>
                  <button disabled={i === 0} onClick={() => move(i, -1)} title={t("Monter", "Move up")} style={{ width: 22, height: 18, border: `1px solid ${C.line}`, background: "#fff", borderRadius: 5, color: i === 0 ? "#D5DEE6" : C.muted, fontSize: 9, cursor: i === 0 ? "default" : "pointer", lineHeight: 1, padding: 0 }}>▲</button>
                  <span style={{ fontFamily: mono, fontSize: 10, color: C.muted }}>{i + 1}</span>
                  <button disabled={i === items.length - 1} onClick={() => move(i, 1)} title={t("Descendre", "Move down")} style={{ width: 22, height: 18, border: `1px solid ${C.line}`, background: "#fff", borderRadius: 5, color: i === items.length - 1 ? "#D5DEE6" : C.muted, fontSize: 9, cursor: i === items.length - 1 ? "default" : "pointer", lineHeight: 1, padding: 0 }}>▼</button>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, lineHeight: 1.45, color: C.text }}>{(q.prompt[lang] || q.prompt.fr || "").slice(0, 150)}{(q.prompt[lang] || q.prompt.fr || "").length > 150 ? "…" : ""}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: mono, fontSize: 9, background: "#F1EAF7", color: "#5E4980", borderRadius: 999, padding: "2px 8px" }}>{areaLabel(q.area, lang)}</span>
                    <span style={{ fontFamily: mono, fontSize: 9, background: "#EDF1F5", color: C.muted, borderRadius: 999, padding: "2px 8px" }}>{t("difficulté", "difficulty")} {q.difficulty}</span>
                    {q.trainer_authored && <span style={{ fontFamily: mono, fontSize: 9, background: "#F0EAF7", color: "#8A6FB0", borderRadius: 999, padding: "2px 8px" }}>✍️ {t("Ma question", "My question")}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, flex: "none" }}>
                  <button onClick={() => suggestSwap(q.external_id)} title={t("Remplacer par une question similaire", "Replace with a similar question")}
                    style={{ width: 26, height: 26, border: `1px solid ${C.line}`, background: "#fff", borderRadius: 7, color: C.muted, fontSize: 12, cursor: "pointer", lineHeight: 1 }}>↻</button>
                  <button onClick={() => removeQ(q.external_id)} title={t("Retirer cette question", "Remove this question")}
                    style={{ width: 26, height: 26, border: `1px solid ${C.line}`, background: "#fff", borderRadius: 7, color: C.muted, fontSize: 13, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>
              </div>
              {swap && swap.forId === q.external_id && (
                <div className="ak-fade" style={{ background: "#FDF7EE", border: `1px dashed ${C.amber}`, borderRadius: 9, padding: "9px 11px", marginTop: 8 }}>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#B5701E", marginBottom: 4 }}>↻ {t("Suggestion — même zone, difficulté proche", "Suggestion — same area, similar difficulty")}</div>
                  {swap.candidate ? (
                    <>
                      <div style={{ fontSize: 12, lineHeight: 1.45, marginBottom: 7 }}>{(swap.candidate.prompt[lang] || swap.candidate.prompt.fr || "").slice(0, 150)}…</div>
                      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                        <button onClick={doSwap} style={{ border: "none", borderRadius: 7, padding: "6px 12px", background: C.amber, color: "#0E1A2B", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{t("Remplacer", "Replace")}</button>
                        <button onClick={() => suggestSwap(q.external_id)} style={{ border: `1px solid ${C.line}`, borderRadius: 7, padding: "6px 12px", background: "#fff", color: C.muted, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{t("Autre suggestion", "Another suggestion")}</button>
                        <button onClick={() => setSwap(null)} style={{ border: `1px solid ${C.line}`, borderRadius: 7, padding: "6px 12px", background: "#fff", color: C.muted, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{t("Garder l'originale", "Keep the original")}</button>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: C.muted }}>{bankLoading ? t("Recherche d'une suggestion…", "Looking for a suggestion…") : t("Aucune autre question disponible pour cette zone.", "No other question available for this area.")}</div>
                  )}
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ textAlign: "center", color: C.muted, fontSize: 12.5, padding: "18px 0" }}>{t("Toutes les questions ont été retirées — ajoutez-en depuis la banque ou créez la vôtre.", "All questions removed — add some from the bank or create your own.")}</div>
          )}

          {panel === "bank" && (
            <div className="ak-fade" style={{ border: `1px solid ${C.teal}`, borderRadius: 12, padding: "12px 13px", marginBottom: 10 }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.teal, marginBottom: 8 }}>{t("Banque de questions — vos cohortes", "Question bank — your cohorts")}</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 9 }}>
                <input value={bSearch} onChange={(e) => setBSearch(e.target.value)} placeholder={t("Rechercher dans les énoncés…", "Search the statements…")} style={{ ...inputStyle, flex: 1, minWidth: 140, width: "auto" }} />
                <select value={bArea} onChange={(e) => setBArea(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="">{t("Toutes les zones", "All areas")}</option>
                  {areaOptions.map((a) => <option key={a} value={a}>{areaLabel(a, lang)}</option>)}
                </select>
                <select value={bDiff} onChange={(e) => setBDiff(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="">{t("Toutes difficultés", "All difficulties")}</option>
                  <option value="1">{t("Fondamental", "Foundational")}</option>
                  <option value="2">{t("Intermédiaire", "Intermediate")}</option>
                  <option value="3">{t("Avancé", "Advanced")}</option>
                </select>
              </div>
              {bankLoading && <div style={{ fontSize: 12, color: C.muted, padding: "6px 0" }}>{t("Chargement de la banque…", "Loading the bank…")}</div>}
              {!bankLoading && bankRows.slice(0, 30).map((b) => (
                <div key={b.external_id} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, lineHeight: 1.45 }}>{(b.prompt[lang] || b.prompt.fr || "").slice(0, 130)}…</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: mono, fontSize: 9, background: "#F1EAF7", color: "#5E4980", borderRadius: 999, padding: "2px 8px" }}>{areaLabel(b.area, lang)}</span>
                      <span style={{ fontFamily: mono, fontSize: 9, background: "#EDF1F5", color: C.muted, borderRadius: 999, padding: "2px 8px" }}>{t("difficulté", "difficulty")} {b.difficulty}</span>
                      {b.trainer_authored && <span style={{ fontFamily: mono, fontSize: 9, background: "#F0EAF7", color: "#8A6FB0", borderRadius: 999, padding: "2px 8px" }}>✍️ {t("Ma question", "My question")}</span>}
                    </div>
                  </div>
                  <button onClick={() => addFromBank(b)} style={{ flex: "none", border: `1px solid ${C.teal}`, background: "#F2F8FA", color: C.teal, borderRadius: 7, padding: "5px 11px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>＋ {t("Ajouter", "Add")}</button>
                </div>
              ))}
              {!bankLoading && bank && bankRows.length === 0 && (
                <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic", padding: "6px 0" }}>{t("Aucune question ne correspond à ces filtres.", "No question matches these filters.")}</div>
              )}
            </div>
          )}

          {panel === "author" && (
            <div className="ak-fade" style={{ border: `1px solid ${C.amber}`, borderRadius: 12, padding: "12px 13px", marginBottom: 10 }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: "#B5701E", marginBottom: 4 }}>✍️ {t("Votre question — visible uniquement par vos cohortes", "Your question — visible only to your cohorts")}</div>
              <div style={smallLabel}>{t("Énoncé", "Statement")}</div>
              <textarea rows={3} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                placeholder={t("Décrivez la situation, puis posez la question…", "Describe the situation, then ask the question…")}
                style={{ ...inputStyle, resize: "vertical" }} />
              <div style={smallLabel}>{t("Réponses — cochez la bonne réponse", "Answers — mark the correct one")}</div>
              {form.opts.map((o, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <input type="radio" name="good" checked={form.good === i} onChange={() => setForm({ ...form, good: i })} style={{ accentColor: "#3DA776", flex: "none", width: 15, height: 15 }} />
                  <input value={o} onChange={(e) => { const opts = [...form.opts]; opts[i] = e.target.value; setForm({ ...form, opts }); }}
                    placeholder={t("Réponse ", "Answer ") + String.fromCharCode(65 + i)} style={inputStyle} />
                </div>
              ))}
              <div style={smallLabel}>{t("Explication — affichée à l'apprenant après sa réponse", "Explanation — shown to the learner after answering")}</div>
              <textarea rows={2} value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })}
                placeholder={t("Pourquoi cette réponse est la bonne…", "Why this answer is correct…")} style={{ ...inputStyle, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} style={{ ...inputStyle, flex: 1, width: "auto" }}>
                  {areaOptions.map((a) => <option key={a} value={a}>{areaLabel(a, lang)}</option>)}
                </select>
                <select value={form.diff} onChange={(e) => setForm({ ...form, diff: parseInt(e.target.value, 10) })} style={{ ...inputStyle, flex: 1, width: "auto" }}>
                  <option value="1">{t("Fondamental", "Foundational")}</option>
                  <option value="2">{t("Intermédiaire", "Intermediate")}</option>
                  <option value="3">{t("Avancé", "Advanced")}</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
                <button onClick={onPolish} disabled={polishBusy} style={{ border: `1px solid ${C.teal}`, background: "#fff", color: C.teal, borderRadius: 8, padding: "7px 13px", fontWeight: 600, fontSize: 12, cursor: polishBusy ? "default" : "pointer" }}>
                  {polishBusy ? t("Correction en cours…", "Polishing…") : "✨ " + t("Corriger la formulation", "Polish the wording")}
                </button>
                <button onClick={onSaveMyQuestion} disabled={saving} style={{ border: "none", background: saving ? "#C9D6E0" : C.amber, color: "#0E1A2B", borderRadius: 8, padding: "7px 13px", fontWeight: 700, fontSize: 12, cursor: saving ? "default" : "pointer", fontFamily: grotesk }}>
                  {saving ? t("Enregistrement…", "Saving…") : t("Ajouter à la séance", "Add to the session")}
                </button>
                <button onClick={() => { setForm(emptyForm); setProposal(null); setPanel(null); }} style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.muted, borderRadius: 8, padding: "7px 13px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{t("Annuler", "Cancel")}</button>
              </div>
              {proposal && (
                <div className="ak-fade" style={{ background: "#F2F8FA", border: `1px dashed ${C.teal}`, borderRadius: 9, padding: "10px 12px", marginTop: 10 }}>
                  {proposal.msg ? (
                    <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.text }}>{proposal.msg}</div>
                  ) : (
                    <>
                      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: C.teal, marginBottom: 6 }}>✨ {t("Correction proposée — orthographe · vouvoiement · forme d'examen", "Proposed correction — spelling · formal address · exam form")}</div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 5 }}><b style={{ fontFamily: mono, fontSize: 9, color: C.muted, textTransform: "uppercase", display: "block" }}>{t("Énoncé", "Statement")}</b>{proposal.prompt}</div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.55, marginBottom: 5 }}><b style={{ fontFamily: mono, fontSize: 9, color: C.muted, textTransform: "uppercase", display: "block" }}>{t("Réponses", "Answers")}</b>{proposal.options.map((o, i) => <span key={i}>{String.fromCharCode(65 + i)}. {o}{form.good === i ? " ✓" : ""}<br /></span>)}</div>
                      {proposal.rationale && <div style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 7 }}><b style={{ fontFamily: mono, fontSize: 9, color: C.muted, textTransform: "uppercase", display: "block" }}>{t("Explication", "Explanation")}</b>{proposal.rationale}</div>}
                      <div style={{ display: "flex", gap: 7 }}>
                        <button onClick={applyProposal} style={{ border: "none", borderRadius: 7, padding: "6px 12px", background: C.teal, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{t("Appliquer la correction", "Apply the correction")}</button>
                        <button onClick={() => setProposal(null)} style={{ border: `1px solid ${C.line}`, borderRadius: 7, padding: "6px 12px", background: "#fff", color: C.muted, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{t("Garder ma version", "Keep my version")}</button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 9, lineHeight: 1.5 }}>{t("Votre question rejoint aussi la banque de vos cohortes : vous pourrez la réutiliser dans de futures séances. La correction est une proposition — vous gardez toujours le dernier mot.", "Your question also joins your cohorts' bank so you can reuse it in future sessions. The correction is a proposal — you always have the final say.")}</div>
            </div>
          )}
          {learners.length > 0 && (
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 13px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.muted }}>{t("Destinataires", "Recipients")}</span>
                <span style={{ fontFamily: mono, fontSize: 10, background: "#8A6FB0", color: "#fff", borderRadius: 999, padding: "1px 8px" }}>{recipients.size}</span>
                <span style={{ flex: 1 }} />
                <button onClick={() => setRecipients(new Set(learners.map((l) => l.learner_id)))} style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.muted, borderRadius: 999, padding: "3px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{t("Tous", "All")}</button>
                <button onClick={() => setRecipients(new Set())} style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.muted, borderRadius: 999, padding: "3px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{t("Aucun", "None")}</button>
              </div>
              <div className="ak-scroll" style={{ maxHeight: 170, overflowY: "auto" }}>
                {learners.map((l) => {
                  const rd = l.readiness || 0;
                  const riskBg = rd >= 0.75 ? "#E4F3EC" : rd >= 0.5 ? "#FBEEDD" : "#F7E3DD";
                  const riskCol = rd >= 0.75 ? "#3DA776" : rd >= 0.5 ? "#B5701E" : "#D2664E";
                  const riskLbl = rd >= 0.75 ? t("prêt", "ready") : rd >= 0.5 ? t("en construction", "building") : t("à risque", "at risk");
                  return (
                    <label key={l.learner_id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 2px", borderBottom: `1px solid ${C.line}`, cursor: "pointer" }}>
                      <input type="checkbox" checked={recipients.has(l.learner_id)} onChange={() => toggleRecipient(l.learner_id)} style={{ accentColor: C.teal, width: 15, height: 15, flex: "none" }} />
                      <span style={{ flex: 1, fontSize: 12.5, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name}</span>
                      <span style={{ fontFamily: mono, fontSize: 9, padding: "2px 8px", borderRadius: 999, fontWeight: 600, background: riskBg, color: riskCol, flex: "none" }}>{riskLbl}</span>
                    </label>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 7, lineHeight: 1.5 }}>{t("Par défaut, toute la cohorte est cochée. Décochez pour cibler — par exemple uniquement les apprenants à risque sur ces sujets.", "By default the whole cohort is selected. Untick to target — for example only the learners at risk on these topics.")}</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, padding: "14px 20px 18px", borderTop: `1px solid ${C.line}` }}>
          <button onClick={onCancel} style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 11, background: "#fff", color: C.muted, fontFamily: grotesk, fontWeight: 700, fontSize: 13, padding: "12px", cursor: "pointer" }}>{t("Annuler", "Cancel")}</button>
          <button onClick={() => onConfirm(items, allCohort ? [] : [...recipients])} disabled={creating || items.length === 0 || (learners.length > 0 && recipients.size === 0)} style={{ flex: 2, border: "none", borderRadius: 11, background: creating || items.length === 0 || (learners.length > 0 && recipients.size === 0) ? "#C9D6E0" : C.amber, color: "#0E1A2B", fontFamily: grotesk, fontWeight: 700, fontSize: 13, padding: "12px", cursor: creating || items.length === 0 || (learners.length > 0 && recipients.size === 0) ? "default" : "pointer" }}>
            {creating ? t("Assignation…", "Assigning…")
              : learners.length > 0
                ? t(`Assigner à ${recipients.size} apprenant${recipients.size > 1 ? "s" : ""} (${items.length} questions)`, `Assign to ${recipients.size} learner${recipients.size > 1 ? "s" : ""} (${items.length} questions)`)
                : t(`Confirmer et assigner (${items.length} questions)`, `Confirm and assign (${items.length} questions)`)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
   v35 — InvitePanel : invitations par lien (étape 11, option A).
   Le formateur colle sa liste (noms et/ou emails, séparés librement), un lien
   personnel et à usage unique est créé par personne, et il envoie lui-même
   les liens par le canal de son choix. L'email est stocké : l'envoi
   automatique se branchera dessus quand l'auth lien magique arrivera.
   ====================================================================== */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseInviteEntries(raw) {
  const parts = (raw || "").split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  const seen = new Set(); const out = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue; seen.add(key);
    out.push(EMAIL_RE.test(p) ? { email: p, name: "" } : { name: p, email: "" });
  }
  return out;
}

function inviteLink(token) {
  try { return `${window.location.origin}/?invite=${token}`; }
  catch { return `/?invite=${token}`; }
}

function InvitePanel({ lang, trainerId, onClose }) {
  const t = (fr, en) => (lang === "en" ? en : fr);
  const [invs, setInvs] = useState(null);
  const [bulk, setBulk] = useState("");
  const [role, setRole] = useState("learner");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(null);       // id | "all"
  const [err, setErr] = useState(null);
  const entries = useMemo(() => parseInviteEntries(bulk), [bulk]);
  const mono = "'IBM Plex Mono',monospace";
  const grotesk = "'Space Grotesk',sans-serif";

  useEffect(() => {
    getInvitations(trainerId).then(setInvs).catch(() => setInvs([]));
  }, [trainerId]);

  async function onCreate() {
    if (busy || !entries.length) return;
    setBusy(true); setErr(null);
    try {
      const r = await createInvitations(trainerId, entries.map((e) => ({ ...e, role })));
      if (r && r.created) {
        setBulk("");
        setInvs([...(r.created || []), ...(invs || [])]);
      } else {
        setErr(t("Création impossible — réessayez.", "Could not create — try again."));
      }
    } catch (e) { setErr(t("Création impossible — le serveur se réveille peut-être, réessayez.", "Could not create — the server may be waking up, try again.")); }
    setBusy(false);
  }

  function copyText(text, key) {
    const done = () => { setCopied(key); setTimeout(() => setCopied(null), 1800); };
    try { navigator.clipboard.writeText(text).then(done, done); } catch { done(); }
  }
  function copyAll() {
    const pending = (invs || []).filter((v) => v.status === "pending");
    if (!pending.length) return;
    copyText(pending.map((v) => `${v.name || v.email || t("Invité", "Invitee")} — ${inviteLink(v.token)}`).join("\n"), "all");
  }
  async function onRevoke(id) {
    try {
      const r = await revokeInvitation(trainerId, id);
      if (r && r.ok) setInvs(invs.map((v) => (v.id === id ? { ...v, status: "revoked" } : v)));
    } catch (e) { /* le panneau reste utilisable */ }
  }

  const pendingCount = (invs || []).filter((v) => v.status === "pending").length;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(6,11,18,.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 250, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, maxWidth: 620, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 70px rgba(0,0,0,.5)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#2E8C9E,#E89A3C)" }} />
        <div style={{ padding: "16px 20px 12px" }}>
          <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 16.5 }}>{t("Invitations — votre cohorte", "Invitations — your cohort")}</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, marginTop: 4 }}>
            {t("Collez votre liste (noms ou emails, mélangés). Un lien personnel et à usage unique est créé par personne — vous l'envoyez vous-même par le canal de votre choix.", "Paste your list (names or emails, mixed). One personal, single-use link is created per person — you send it yourself through any channel you like.")}
          </div>
        </div>

        <div className="ak-scroll" style={{ overflowY: "auto", padding: "0 20px", flex: 1 }}>
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 13px", marginBottom: 12 }}>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.muted, marginBottom: 7 }}>{t("Nouvelles invitations", "New invitations")}</div>
            <textarea rows={4} value={bulk} onChange={(e) => setBulk(e.target.value)}
              placeholder={t("Collez votre liste telle quelle — un par ligne, ou séparés par des virgules :\nA. Benali, s.meziane@entreprise.dz\nk.hamidi@entreprise.dz ; N. Cherif", "Paste your list as is — one per line, or comma-separated:\nA. Benali, s.meziane@company.com\nk.hamidi@company.com ; N. Cherif")}
              style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 11px", fontSize: 13, fontFamily: "'Inter',sans-serif", color: C.text, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 9, alignItems: "center", flexWrap: "wrap" }}>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", fontSize: 12.5, fontFamily: "'Inter',sans-serif", background: "#fff", color: C.text, outline: "none" }}>
                <option value="learner">{t("Apprenants", "Learners")}</option>
                <option value="trainer">{t("Formateur", "Trainer")}</option>
              </select>
              <button onClick={onCreate} disabled={busy || !entries.length}
                style={{ border: "none", borderRadius: 10, padding: "9px 15px", background: busy || !entries.length ? "#C9D6E0" : C.amber, color: "#0E1A2B", fontWeight: 700, fontSize: 13, cursor: busy || !entries.length ? "default" : "pointer", fontFamily: grotesk }}>
                {busy ? t("Création…", "Creating…") : t(`Créer les liens (${entries.length})`, `Create the links (${entries.length})`)}
              </button>
              <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.45 }}>{t("Emails reconnus automatiquement · doublons ignorés.", "Emails detected automatically · duplicates ignored.")}</span>
            </div>
            {err && <div style={{ fontSize: 12, color: "#D2664E", marginTop: 7 }}>{err}</div>}
          </div>

          <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 13px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.muted }}>{t("Invitations de la cohorte", "Cohort invitations")} <span style={{ background: C.teal, color: "#fff", borderRadius: 999, padding: "1px 8px", letterSpacing: 0 }}>{(invs || []).length}</span></div>
              <span style={{ flex: 1 }} />
              {pendingCount > 0 && (
                <button onClick={copyAll} style={{ border: `1px solid ${copied === "all" ? "#3DA776" : C.teal}`, background: copied === "all" ? "#3DA776" : "#F2F8FA", color: copied === "all" ? "#fff" : C.teal, borderRadius: 8, padding: "5px 11px", fontWeight: 600, fontSize: 11.5, cursor: "pointer" }}>
                  {copied === "all" ? t(`✓ ${pendingCount} lien${pendingCount > 1 ? "s copiés" : " copié"}`, `✓ ${pendingCount} link${pendingCount > 1 ? "s" : ""} copied`) : "📋 " + t("Copier tous les liens en attente", "Copy all pending links")}
                </button>
              )}
            </div>
            {invs === null && <div style={{ fontSize: 12, color: C.muted, padding: "6px 0" }}>{t("Chargement…", "Loading…")}</div>}
            {invs !== null && invs.length === 0 && <div style={{ fontSize: 12.5, color: C.muted, fontStyle: "italic", padding: "6px 0" }}>{t("Aucune invitation pour l'instant — créez vos premiers liens ci-dessus.", "No invitations yet — create your first links above.")}</div>}
            {(invs || []).map((v) => (
              <div key={v.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v.name || v.email || <span style={{ color: C.muted, fontWeight: 400 }}>{t("(sans nom — l'invité saisira le sien)", "(no name — the invitee will enter theirs)")}</span>}</div>
                  {v.email && v.name && <div style={{ fontFamily: mono, fontSize: 10.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.email}</div>}
                  <div style={{ fontFamily: mono, fontSize: 10.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inviteLink(v.token).replace(/^https?:\/\//, "")}</div>
                </div>
                {v.role === "trainer" && <span style={{ fontFamily: mono, fontSize: 9.5, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: "#F0EAF7", color: "#8A6FB0", flex: "none" }}>{t("formateur", "trainer")}</span>}
                {v.status === "accepted" && <span style={{ fontFamily: mono, fontSize: 9.5, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: "#E4F3EC", color: "#3DA776", flex: "none" }}>✓ {t("acceptée", "accepted")}</span>}
                {v.status === "revoked" && <span style={{ fontFamily: mono, fontSize: 9.5, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: "#EDF1F5", color: C.muted, flex: "none" }}>{t("révoquée", "revoked")}</span>}
                {v.status === "pending" && (
                  <>
                    <span style={{ fontFamily: mono, fontSize: 9.5, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: "#FBEEDD", color: "#B5701E", flex: "none" }}>{t("en attente", "pending")}</span>
                    <button onClick={() => copyText(inviteLink(v.token), v.id)} style={{ flex: "none", border: `1px solid ${copied === v.id ? "#3DA776" : C.teal}`, background: copied === v.id ? "#3DA776" : "#F2F8FA", color: copied === v.id ? "#fff" : C.teal, borderRadius: 8, padding: "5px 11px", fontWeight: 600, fontSize: 11.5, cursor: "pointer" }}>
                      {copied === v.id ? t("✓ Copié", "✓ Copied") : t("Copier le lien", "Copy the link")}
                    </button>
                    <button onClick={() => onRevoke(v.id)} title={t("Révoquer cette invitation", "Revoke this invitation")}
                      style={{ flex: "none", border: `1px solid ${C.line}`, background: "#fff", color: C.muted, borderRadius: 8, width: 27, height: 27, cursor: "pointer", fontSize: 13, lineHeight: 1 }}>✕</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", padding: "12px 20px 16px", borderTop: `1px solid ${C.line}` }}>
          <button onClick={onClose} style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 11, background: "#fff", color: C.muted, fontFamily: grotesk, fontWeight: 700, fontSize: 13, padding: "12px", cursor: "pointer" }}>{t("Fermer", "Close")}</button>
        </div>
      </div>
    </div>
  );
}
