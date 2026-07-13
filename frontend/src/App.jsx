import React, { useState, useRef, useEffect } from "react";
import { BookOpen, HelpCircle, Puzzle, Lightbulb, Send, RotateCcw, Target, Check, X, ArrowRight, Menu, Compass, Scale, Gauge, Flame, RefreshCw, FileText, Settings } from "lucide-react";
import { C, KA, FOCUS, STARTERS, T, JT, PT, CR, LENS, lightColor, BE_AREAS, PEOPLE_AREAS, PR_AREAS } from "./pmp.js";
import { postChat, getMastery, getQuizNext, postQuizAnswer, getReflexes, saveReflexe, deleteReflexe, pingHealth, flagItem, getReadiness, getSessionNext, getMissed, getMe, getAssignedSessions, getAssignedSessionItems, completeAssignedSession, getInviteInfo, acceptInvite, joinClass, linkEmail, requestMagicLink, consumeMagicLink, setTestPlan } from "./api.js";
import Journey from "./Journey.jsx";
import Portrait from "./Portrait.jsx";
import Reglages from "./Reglages.jsx";
import CarteMentale from "./CarteMentale.jsx";
import CockpitFormateur from "./CockpitFormateur.jsx";

const readLS = (k) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const MODES = [
  { id: "explain", icon: BookOpen, fr: "Expliquer", en: "Explain" },
  { id: "quiz", icon: HelpCircle, fr: "Me tester", en: "Quiz me" },
  { id: "scenario", icon: Puzzle, fr: "Cas d'examen", en: "Exam scenario" },
  { id: "relate", icon: Lightbulb, fr: "Relier à mon projet", en: "Relate to my work" },
];

const QT = {
  next: { fr: "Question suivante", en: "Next question" },
  none: { fr: "Pas encore de questions pour ce sujet. Essaie « Intégration », ou les modes Expliquer / Cas d'examen.", en: "No curated questions for this topic yet. Try Integration, or the Explain / Scenario modes." },
  loadingQ: { fr: "Chargement…", en: "Loading…" },
  good: { fr: "Correct", en: "Correct" },
  bad: { fr: "Incorrect", en: "Incorrect" },
};

export default function App() {
  const [lang, setLang] = useState("fr");
  const [focusId, setFocusId] = useState("overview");
  const [modeId, setModeId] = useState("explain");
  const [projectContext, setProjectContext] = useState("");
  const [lens, setLens] = useState("moa");
  const [reflexes, setReflexes] = useState([]);
  const [learner, setLearner] = useState(() => readLS("cz_learner"));
  const [learnerName, setLearnerName] = useState(() => readLS("cz_name"));
  const [role, setRole] = useState(() => readLS("cz_role"));
  const [me, setMe] = useState(null);   // {effective_plan, features, ...} from /api/me
  function signIn(name, asTrainer = false) {
    const nm = name.trim(); if (!nm) return;
    const slug = slugify(nm) || ("u" + Date.now());
    const r = asTrainer ? "trainer" : "learner";
    try { localStorage.setItem("cz_learner", slug); localStorage.setItem("cz_name", nm); localStorage.setItem("cz_role", r); } catch { /* private mode */ }
    setLearner(slug); setLearnerName(nm); setRole(r);
  }

  // v35 — invitation par lien (?invite=TOKEN)
  const [inviteToken, setInviteToken] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("invite") || ""; } catch { return ""; }
  });
  // v38 — lien magique (?magic=TOKEN) : reconnexion par email
  const [magicToken, setMagicToken] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("magic") || ""; } catch { return ""; }
  });
  const [magicState, setMagicState] = useState(magicToken ? "checking" : null);
  const [portraitAutoPrint, setPortraitAutoPrint] = useState(false);
  function clearMagicParam() {
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("magic");
      window.history.replaceState({}, "", u.pathname + (u.search || ""));
    } catch { /* */ }
  }
  useEffect(() => {
    if (!magicToken) return;
    consumeMagicLink(magicToken).then((r) => {
      if (r && r.ok) {
        const rr = r.role === "trainer" ? "trainer" : "learner";
        try { localStorage.setItem("cz_learner", r.learner_id); localStorage.setItem("cz_name", r.name); localStorage.setItem("cz_role", rr); } catch { /* */ }
        setLearner(r.learner_id); setLearnerName(r.name); setRole(rr);
        setMagicState("ok"); clearMagicParam();
        setTimeout(() => { setMagicToken(""); setMagicState(null); }, 1400);
      } else {
        setMagicState(r && r.error === "expired" ? "expired" : "invalid");
      }
    }).catch(() => setMagicState("invalid"));
  }, [magicToken]);
  function clearInviteParam() {
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("invite");
      window.history.replaceState({}, "", u.pathname + (u.search || ""));
    } catch { /* */ }
  }
  function onInviteJoined(publicId, nm, joinedRole) {
    const r = joinedRole === "trainer" ? "trainer" : "learner";
    try { localStorage.setItem("cz_learner", publicId); localStorage.setItem("cz_name", nm); localStorage.setItem("cz_role", r); } catch { /* */ }
    setLearner(publicId); setLearnerName(nm); setRole(r);
    clearInviteParam(); setInviteToken("");
  }
  // v37 — rejoindre par code de classe (libre-service). Après succès, on propose
  // (facultatif) de lier un email de récupération.
  const [offerEmailRecovery, setOfferEmailRecovery] = useState(false);
  // v41 — bascule de plan pour les tests. Le bouton n'est affiché que si
  // me.is_trainer ; le serveur revérifie de toute façon (l'UI ne protège rien).
  // v42 — les Réglages basculent le plan ; on recharge /api/me pour rafraîchir l'UI.
  async function refreshMe() {
    try { setMe(await getMe(learner)); } catch (e) { /* */ }
  }

  async function onJoinClass(code, nm) {
    const r = await joinClass({ code, name: nm });
    if (r && r.ok) {
      try { localStorage.setItem("cz_learner", r.learner_id); localStorage.setItem("cz_name", r.name); localStorage.setItem("cz_role", "learner"); } catch { /* */ }
      setLearner(r.learner_id); setLearnerName(r.name); setRole("learner");
      setOfferEmailRecovery(true);
    }
    return r;
  }
  function signOut() {
    try { localStorage.removeItem("cz_learner"); localStorage.removeItem("cz_name"); localStorage.removeItem("cz_role"); } catch { /* */ }
    setLearner(""); setLearnerName(""); setRole(""); setMessages([]); setMastery([]); setProcesses([]); setReflexes([]); setRecommended(null); setModeId("explain"); setFocusId("overview");
  }
  const SEAT_COLOR = { moa: "#2E8C9E", moe: "#C57B2C", both: "#8A6FB0" };
  const savedTexts = new Set(reflexes.map((r) => r.text));
  const extractReflexe = (content) => {
    const m = /⟡\s*R[ée]flexe\s*:\s*(.+)/i.exec(content || "");
    return m ? m[1].trim().replace(/^[«"]\s*/, "").replace(/\s*[»"]$/, "") : null;
  };
  const refreshReflexes = () => getReflexes(learner).then(setReflexes).catch(() => {});
  const doSaveReflexe = (text) => saveReflexe({ learner_id: learner, seat: lens, text, case_excerpt: projectContext.slice(0, 180) }).then(refreshReflexes).catch(() => {});
  const doDeleteReflexe = (id) => deleteReflexe(id, learner).then(refreshReflexes).catch(() => {});
  const [messages, setMessages] = useState([]);
  const [mastery, setMastery] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);

  const chooseMode = (id) => {
    setModeId(id);
    // L'auto-impression ne vaut que pour l'ouverture venue de « Mes données ».
    if (id !== "portrait") setPortraitAutoPrint(false);
    if (isMobile) setNavOpen(false);
  };
  const chooseFocus = (id) => { setFocusId(id); if (isMobile) setNavOpen(false); };

  const t = (k) => T[k][lang];
  const masteryById = Object.fromEntries(mastery.map((m) => [m.area, m]));
  const isKA = KA.some((k) => k.id === focusId) || BE_AREAS.includes(focusId) || PEOPLE_AREAS.includes(focusId) || PR_AREAS.includes(focusId);

  useEffect(() => {
    if (!learner) return;
    getMastery(learner).then((d) => { setMastery(d.mastery); setRecommended(d.recommended); setProcesses(d.processes || []); }).catch(() => {});
    getReflexes(learner).then(setReflexes).catch(() => {});
    getMe(learner).then(setMe).catch(() => {});
  }, [learner]);

  // keep the free-tier backend warm: ping on load, then periodically while open
  useEffect(() => {
    pingHealth();
    const id = setInterval(pingHealth, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  function onGraded(d) {
    if (d.mastery) setMastery(d.mastery);
    if (d.recommended) setRecommended(d.recommended);
    if (d.processes) setProcesses(d.processes);
  }

  async function send(textArg) {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;
    setError(null);
    const next = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const data = await postChat({ learner_id: learner, lang, mode: modeId, focus: focusId, project_context: projectContext, lens, messages: next });
      setMessages([...next, { role: "assistant", content: data.reply || "…" }]);
      onGraded(data);
    } catch (e) { setError(t("err")); } finally { setLoading(false); }
  }

  function reset() { setMessages([]); setError(null); setInput(""); }
  function studyArea(area) { setFocusId(area); setModeId("quiz"); if (isMobile) setNavOpen(false); }

  const activeModeObj = MODES.find((m) => m.id === modeId);
  const ActiveIcon = modeId === "coreflexion" ? Scale : (activeModeObj ? activeModeObj.icon : BookOpen);
  const recObj = recommended ? KA.find((k) => k.id === recommended.area) : null;

  if (magicToken && magicState && magicState !== "ok") return <MagicGate lang={lang} setLang={setLang} state={magicState} onDismiss={() => { clearMagicParam(); setMagicToken(""); setMagicState(null); }} />;
  if (inviteToken) return <InviteGate lang={lang} setLang={setLang} token={inviteToken} currentId={learner} currentName={learnerName} onJoined={onInviteJoined} onDismiss={() => { clearInviteParam(); setInviteToken(""); }} />;
  if (!learner) return <Gate lang={lang} setLang={setLang} onStart={signIn} onJoinClass={onJoinClass} t={t} />;
  if (offerEmailRecovery) return <EmailRecoveryGate lang={lang} learnerId={learner} t={t} onDone={() => setOfferEmailRecovery(false)} />;

  // Trainer access: chosen via the "Accès formateur" panel (role flag), or the legacy "formateur" keyword.
  const isFormateur = role === "trainer" || ["formateur", "trainer", "coach"].includes((learner || "").toLowerCase()) || (learnerName || "").toLowerCase() === "formateur";
  if (isFormateur) {
    return (
      <div style={{ background: C.ink, fontFamily: "'Inter', system-ui, sans-serif", color: C.text }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap'); *{box-sizing:border-box} body{margin:0} .ak-scroll::-webkit-scrollbar{width:9px} .ak-scroll::-webkit-scrollbar-thumb{background:#C3CDD7;border-radius:9px}`}</style>
        <div style={{ height: "100dvh", minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${C.inkLine}`, background: C.ink }}>
            <svg width="24" height="24" viewBox="0 0 40 40"><polygon points="20,6 34,32 6,32" fill="none" stroke={C.amber} strokeWidth="2" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 17, color: "#fff" }}>Certifizer <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.muted }}>PMP</span></span>
            <span style={{ fontSize: 12, color: "#9DB0C2" }}>{t("cockpitTitle")}</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 2, background: C.ink2, borderRadius: 8, padding: 2, border: `1px solid ${C.inkLine}` }}>
              {["fr", "en"].map((l) => <button key={l} onClick={() => setLang(l)} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, padding: "3px 9px", borderRadius: 6, background: lang === l ? C.amber : "transparent", color: lang === l ? C.ink : "#9DB0C2", fontWeight: 600, border: "none" }}>{l.toUpperCase()}</button>)}
            </div>
            <button onClick={signOut} style={{ background: "none", border: "none", color: C.teal, fontSize: 11, textDecoration: "underline" }}>{t("switchUser")}</button>
          </div>
          <CockpitFormateur lang={lang} isMobile={isMobile} trainerId={learner} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.ink, fontFamily: "'Inter', system-ui, sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        .app-shell { height: 100vh; height: 100dvh; }
        .ak-grid { background-image: linear-gradient(${C.inkLine} 1px, transparent 1px), linear-gradient(90deg, ${C.inkLine} 1px, transparent 1px); background-size: 22px 22px; }
        .ak-scroll::-webkit-scrollbar { width: 9px; } .ak-scroll::-webkit-scrollbar-thumb { background: #C3CDD7; border-radius: 9px; }
        .ak-side::-webkit-scrollbar { width: 7px; } .ak-side::-webkit-scrollbar-thumb { background: #2C405A; border-radius: 9px; }
        .ak-fade { animation: akfade .35s ease both; }
        @keyframes akfade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes akblink { 0%,80%,100% { opacity: .2; } 40% { opacity: 1; } }
        .ak-dot { width: 6px; height: 6px; border-radius: 50%; background: ${C.amber}; display: inline-block; animation: akblink 1.2s infinite; }
        .ak-bar { transition: width .5s ease, background .3s ease; }
        button { cursor: pointer; font-family: inherit; }
        .ak-opt:hover:enabled { border-color: ${C.teal}; }
        @media (prefers-reduced-motion: reduce) { .ak-fade, .ak-dot, .ak-bar { animation: none; transition: none; } }
      `}</style>

      <div className="app-shell" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div className="ak-grid" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${C.inkLine}` }}>
          {isMobile && (
            <button onClick={() => setNavOpen(true)} aria-label="Menu" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 9, border: `1px solid ${C.inkLine}`, background: C.ink2, color: "#9DB0C2", flexShrink: 0 }}>
              <Menu size={20} />
            </button>
          )}
          <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden>
            <polygon points="20,5 35,32 5,32" fill="none" stroke={C.amber} strokeWidth="2" strokeLinejoin="round" />
            <circle cx="20" cy="5" r="2.6" fill={C.amber} /><circle cx="35" cy="32" r="2.6" fill={C.teal} /><circle cx="5" cy="32" r="2.6" fill="#fff" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: "#fff", letterSpacing: ".2px" }}>
              Certifizer <span style={{ color: C.muted, fontWeight: 500, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>PMP</span>
            </div>
            <div style={{ color: "#9DB0C2", fontSize: 11.5 }}>{t("tagline")} · <span style={{ color: "#7E90A4" }}>{learnerName || learner}</span> {me && <PlanBadge plan={me.effective_plan} lang={lang} />} <button onClick={signOut} style={{ background: "none", border: "none", color: C.teal, fontSize: 11, padding: "0 0 0 2px", textDecoration: "underline" }}>{t("switchUser")}</button></div>
          </div>
          <div style={{ display: "flex", gap: 4, padding: 2, background: C.ink2, borderRadius: 8, border: `1px solid ${C.inkLine}` }}>
            {["fr", "en"].map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "3px 9px", borderRadius: 6, border: "none", background: lang === l ? C.amber : "transparent", color: lang === l ? C.ink : "#9DB0C2", fontWeight: 600 }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {isMobile && navOpen && (
            <div onClick={() => setNavOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 45 }} />
          )}
          {/* Sidebar */}
          <div className="ak-side" style={{
            display: "flex", flexDirection: "column", gap: 16, padding: 16,
            width: isMobile ? 272 : 250, maxWidth: isMobile ? "85vw" : "none",
            background: C.ink, borderRight: `1px solid ${C.inkLine}`, overflowY: "auto",
            ...(isMobile ? {
              position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
              transform: navOpen ? "translateX(0)" : "translateX(-100%)",
              transition: "transform .28s ease",
              boxShadow: navOpen ? "0 8px 40px rgba(0,0,0,0.5)" : "none",
            } : {}),
          }}>
            {isMobile && (
              <button onClick={() => setNavOpen(false)} aria-label="Fermer" style={{ alignSelf: "flex-end", display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, marginBottom: -6, borderRadius: 8, border: `1px solid ${C.inkLine}`, background: C.ink2, color: "#9DB0C2" }}>
                <X size={18} />
              </button>
            )}
            <Section label={t("mode")}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {MODES.map((m) => {
                  const Icon = m.icon; const on = m.id === modeId;
                  return (
                    <button key={m.id} onClick={() => chooseMode(m.id)} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "8px 10px", borderRadius: 9, border: `1px solid ${on ? C.amber : C.inkLine}`, background: on ? "rgba(232,154,60,0.12)" : C.ink2, textAlign: "left" }}>
                      <Icon size={15} color={on ? C.amber : "#9DB0C2"} />
                      <span style={{ fontSize: 11.5, color: on ? "#fff" : "#9DB0C2", fontWeight: 500 }}>{m[lang]}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => chooseMode("coreflexion")} style={{ marginTop: 6, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 10px", borderRadius: 9, border: `1px solid ${modeId === "coreflexion" ? C.amber : C.inkLine}`, background: modeId === "coreflexion" ? "rgba(232,154,60,0.12)" : C.ink2, color: modeId === "coreflexion" ? "#fff" : "#9DB0C2", fontWeight: 500, fontSize: 12 }}>
                <Scale size={15} color={modeId === "coreflexion" ? C.amber : "#9DB0C2"} /> {CR.casreel[lang]}
              </button>
              <button onClick={() => chooseMode("parcours")} style={{ marginTop: 6, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 10px", borderRadius: 9, border: `1px solid ${modeId === "parcours" ? C.amber : C.inkLine}`, background: modeId === "parcours" ? "rgba(232,154,60,0.12)" : C.ink2, color: modeId === "parcours" ? "#fff" : "#9DB0C2", fontWeight: 500, fontSize: 12 }}>
                <Compass size={15} color={modeId === "parcours" ? C.amber : "#9DB0C2"} /> {JT.parcours[lang]}
              </button>
              <button onClick={() => chooseMode("prepa")} style={{ marginTop: 6, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 10px", borderRadius: 9, border: `1px solid ${modeId === "prepa" ? C.amber : C.inkLine}`, background: modeId === "prepa" ? "rgba(232,154,60,0.12)" : C.ink2, color: modeId === "prepa" ? "#fff" : "#9DB0C2", fontWeight: 500, fontSize: 12 }}>
                <Gauge size={15} color={modeId === "prepa" ? C.amber : "#9DB0C2"} /> {PT.prepa[lang]}
              </button>
              <button onClick={() => { setPortraitAutoPrint(false); chooseMode("portrait"); }} style={{ marginTop: 6, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 10px", borderRadius: 9, border: `1px solid ${modeId === "portrait" ? C.amber : C.inkLine}`, background: modeId === "portrait" ? "rgba(232,154,60,0.12)" : C.ink2, color: modeId === "portrait" ? "#fff" : "#9DB0C2", fontWeight: 500, fontSize: 12 }}>
                <FileText size={15} color={modeId === "portrait" ? C.amber : "#9DB0C2"} /> {PT.portrait[lang]}
              </button>
              <button onClick={() => chooseMode("donnees")} style={{ marginTop: 6, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 10px", borderRadius: 9, border: `1px solid ${modeId === "donnees" ? C.amber : C.inkLine}`, background: modeId === "donnees" ? "rgba(232,154,60,0.12)" : C.ink2, color: modeId === "donnees" ? "#fff" : "#9DB0C2", fontWeight: 500, fontSize: 12 }}>
                <Settings size={15} color={modeId === "donnees" ? C.amber : "#9DB0C2"} /> {PT.reglages[lang]}
              </button>
            </Section>

            <Section label={t("focus")}>
              <div className="ak-side" style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 168, overflowY: "auto" }}>
                {FOCUS.map((f) => {
                  const on = f.id === focusId;
                  return (
                    <button key={f.id} onClick={() => chooseFocus(f.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 7, border: `1px solid ${on ? C.teal : "transparent"}`, background: on ? C.ink2 : "transparent" }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: C.ink, background: on ? C.teal : "#54657A", minWidth: 22, textAlign: "center", borderRadius: 4, padding: "1px 3px", fontWeight: 600 }}>{f.code}</span>
                      <span style={{ fontSize: 12, color: on ? "#fff" : "#9DB0C2" }}>{f[lang]}</span>
                    </button>
                  );
                })}
              </div>
            </Section>

            {modeId === "relate" && (
              <Section label={t("project")}>
                <textarea value={projectContext} onChange={(e) => setProjectContext(e.target.value)} placeholder={t("projectPh")} rows={4}
                  style={{ width: "100%", resize: "vertical", background: C.ink2, color: "#E6EDF4", border: `1px solid ${C.inkLine}`, borderRadius: 8, padding: "8px 9px", fontSize: 12, fontFamily: "'Inter', sans-serif", outline: "none" }} />
              </Section>
            )}

            {modeId === "coreflexion" && (
              <>
                <Section label={CR.seat[lang]}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {LENS.map((L) => {
                      const on = L.id === lens;
                      return (
                        <button key={L.id} onClick={() => { setLens(L.id); if (messages.length) reset(); }}
                          style={{ textAlign: "left", padding: "8px 10px", borderRadius: 9, border: `1px solid ${on ? L.c : C.inkLine}`, background: on ? C.ink2 : "transparent" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ width: 9, height: 9, borderRadius: "50%", background: L.c, flex: "none" }} />
                            <span style={{ fontSize: 12.5, color: on ? "#fff" : "#9DB0C2", fontWeight: 600 }}>{L[lang]}</span>
                          </span>
                          <span style={{ display: "block", fontSize: 10.5, color: C.muted, marginTop: 3, paddingLeft: 16, lineHeight: 1.35 }}>{lang === "fr" ? L.dFr : L.dEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </Section>
                <Section label={CR.casLabel[lang]}>
                  <textarea value={projectContext} onChange={(e) => setProjectContext(e.target.value)} placeholder={CR.casPh[lang]} rows={5}
                    style={{ width: "100%", resize: "vertical", background: C.ink2, color: "#E6EDF4", border: `1px solid ${C.inkLine}`, borderRadius: 8, padding: "8px 9px", fontSize: 12, fontFamily: "'Inter', sans-serif", outline: "none" }} />
                </Section>
                <Section label={CR.mesReflexes[lang] + (reflexes.length ? " · " + reflexes.length : "")}>
                  {reflexes.length === 0 ? (
                    <div style={{ fontSize: 11, color: "#54657A", fontStyle: "italic", lineHeight: 1.45 }}>{CR.emptyRef[lang]}</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {reflexes.map((r) => (
                        <div key={r.id} style={{ display: "flex", gap: 7, alignItems: "flex-start", background: C.ink2, border: `1px solid ${C.inkLine}`, borderRadius: 8, padding: "7px 9px" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: SEAT_COLOR[r.seat] || "#54657A", flex: "none", marginTop: 4 }} />
                          <span style={{ flex: 1, fontSize: 11, color: "#C7D2DE", lineHeight: 1.45 }}>{r.text}</span>
                          <button onClick={() => doDeleteReflexe(r.id)} title="Supprimer" style={{ background: "none", border: "none", color: "#54657A", cursor: "pointer", flex: "none", padding: 0, lineHeight: 0 }}><X size={13} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              </>
            )}

            <Section label={t("readiness")}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {KA.map((k) => {
                  const st = masteryById[k.id]; const col = lightColor(st);
                  const pct = st && st.attempts > 0 ? Math.round(st.score * 100) : 0;
                  const isRec = recommended && recommended.area === k.id;
                  return (
                    <button key={k.id} onClick={() => chooseFocus(k.id)} title={st && st.attempts > 0 ? `${pct}% · ${st.attempts}` : t("untested")}
                      style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", padding: "1px 0" }}>
                      <span style={{ width: 6, height: 6, borderRadius: 50, background: col, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: isRec ? C.amber : "#9DB0C2", flex: 1, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: isRec ? 600 : 400 }}>{k[lang]}</span>
                      <span style={{ width: 46, height: 5, borderRadius: 3, background: "#23364D", overflow: "hidden", flexShrink: 0 }}>
                        <span className="ak-bar" style={{ display: "block", height: "100%", width: `${pct}%`, background: col, borderRadius: 3 }} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 9, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#54657A", lineHeight: 1.7 }}>
                <div><span style={{ color: C.amber }}>ECO PMP 2026</span> · {lang === "en" ? "in force" : "en vigueur"}</div>
                <div>3 {lang === "en" ? "domains" : "domaines"} · 26 {lang === "en" ? "tasks" : "tâches"}</div>
                <div>33 % · 41 % · 26 %</div>
              </div>
            </Section>
          </div>

          {/* Main */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: C.paper, minWidth: 0 }}>
            {recObj && (
              <button onClick={() => studyArea(recObj.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: `1px solid ${C.line}`, background: "#FFF7EC", border: "none", textAlign: "left", width: "100%" }}>
                <Target size={15} color={C.amber} />
                <span style={{ fontSize: 12, color: C.muted }}>{t("reco")} :</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{recObj[lang]}</span>
                <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, color: C.ink, background: C.amber, borderRadius: 14, padding: "3px 11px" }}>{t("start")}</span>
              </button>
            )}

            {modeId === "parcours" ? (
              <Journey lang={lang} mastery={mastery} processes={processes} recommended={recommended} onStudyArea={(a) => studyArea(a)} isMobile={isMobile} />
            ) : modeId === "portrait" ? (
              <Portrait learnerId={learner} lang={lang} autoPrint={portraitAutoPrint} />
            ) : modeId === "donnees" ? (
              <Reglages learnerId={learner} learnerName={learnerName} lang={lang} setLang={setLang} me={me} refreshMe={refreshMe} onOpenPortrait={() => { setPortraitAutoPrint(true); chooseMode("portrait"); }} />
            ) : modeId === "prepa" ? (
              <PrepaPanel lang={lang} learnerId={learner} learnerName={learnerName} mastery={mastery} reflexes={reflexes} onStudyArea={(a) => studyArea(a)} isMobile={isMobile} me={me} />
            ) : modeId === "quiz" ? (
              <QuizPanel lang={lang} area={isKA ? focusId : null} learnerId={learner} onGraded={onGraded} t={t} />
            ) : (
              <>
                <div ref={scrollRef} className="ak-scroll" style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
                  {messages.length === 0 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "0 24px" }}>
                      <div style={{ marginBottom: 14 }}><ActiveIcon size={30} color={C.teal} /></div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, color: C.text, marginBottom: 6 }}>{t("empty1")}</div>
                      <div style={{ color: C.muted, fontSize: 13, maxWidth: 320, marginBottom: 18 }}>{t("empty2")}</div>
                      <button onClick={() => send(STARTERS[modeId][lang])} style={{ fontSize: 12.5, color: C.text, background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "8px 16px", fontWeight: 500 }}>{STARTERS[modeId][lang]}</button>
                    </div>
                  )}
                  {messages.map((m, i) => {
                    const ref = m.role === "assistant" ? extractReflexe(m.content) : null;
                    const isSaved = ref && savedTexts.has(ref);
                    return (
                      <div key={i} className="ak-fade" style={{ marginBottom: 14, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
                          <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", padding: "10px 14px", borderRadius: 12, maxWidth: "100%", background: m.role === "user" ? C.ink : C.card, color: m.role === "user" ? "#EAF0F6" : C.text, border: m.role === "user" ? "none" : `1px solid ${C.line}`, borderLeft: m.role === "assistant" ? `3px solid ${C.teal}` : "none" }}>{m.content}</div>
                          {ref && (
                            <button onClick={() => !isSaved && doSaveReflexe(ref)} disabled={isSaved}
                              style={{ marginTop: 7, fontSize: 11.5, fontWeight: 600, borderRadius: 8, padding: "6px 11px", border: "none", cursor: isSaved ? "default" : "pointer", background: isSaved ? "#E4F3EC" : C.amber, color: isSaved ? C.green : C.ink }}>
                              {isSaved ? CR.saved[lang] : CR.save[lang]}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {loading && (
                    <div className="ak-fade" style={{ display: "flex", gap: 6, alignItems: "center", color: C.muted, fontSize: 12.5, padding: "4px 2px" }}>
                      <span className="ak-dot" /><span className="ak-dot" style={{ animationDelay: ".2s" }} /><span className="ak-dot" style={{ animationDelay: ".4s" }} />
                      <span style={{ marginLeft: 4 }}>{t("thinking")}</span>
                    </div>
                  )}
                  {error && <div style={{ color: "#C0392B", fontSize: 12.5, padding: "4px 2px" }}>{error}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "12px 16px", borderTop: `1px solid ${C.line}`, background: C.card }}>
                  {messages.length > 0 && (
                    <button onClick={reset} title="reset" style={{ padding: 9, borderRadius: 9, border: `1px solid ${C.line}`, color: C.muted, background: "#fff" }}><RotateCcw size={16} /></button>
                  )}
                  <textarea value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder={t("placeholder")} rows={1}
                    style={{ flex: 1, resize: "none", border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", fontSize: 13.5, fontFamily: "'Inter', sans-serif", color: C.text, outline: "none", maxHeight: 120 }} />
                  <button onClick={() => send()} disabled={loading || !input.trim()} style={{ padding: "10px 13px", borderRadius: 10, background: loading || !input.trim() ? "#C3CDD7" : C.amber, color: C.ink, border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13 }}><Send size={15} /></button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrepaPanel({ lang, learnerId, learnerName, mastery, reflexes, onStudyArea, isMobile, me }) {
  const [data, setData] = useState(null);
  const [missed, setMissed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runner, setRunner] = useState(null); // active session items, or null
  const [assigned, setAssigned] = useState([]);          // targeted sessions from the trainer
  const [activeAssignment, setActiveAssignment] = useState(null); // assignment being run
  const p = (k) => PT[k][lang];

  useEffect(() => {
    if (!learnerId) return;
    setLoading(true);
    Promise.all([
      getReadiness(learnerId).catch(() => null),
      getMissed(learnerId, true).catch(() => ({ count: 0, items: [] })),
    ]).then(([r, m]) => { setData(r); setMissed(m); setLoading(false); });
    getAssignedSessions(learnerId).then(setAssigned).catch(() => {});
  }, [learnerId]);

  const totalAttempts = mastery.reduce((s, m) => s + (m.attempts || 0), 0);
  const DOMS = [
    { id: "people", label: p("domPeople"), color: "#8A6FB0" },
    { id: "process", label: p("domProcess"), color: "#2E8C9E" },
    { id: "business", label: p("domBusiness"), color: "#E89A3C" },
  ];
  const domColor = (v) => (v >= 0.75 ? "#3DA776" : v >= 0.5 ? "#E8A765" : "#D2664E");
  const KA_LABEL = Object.fromEntries(KA.map((k) => [k.id, k[lang]]));

  const pad = isMobile ? "16px" : "22px";

  if (loading) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>{p("loading")}</div>;
  }
  if (!data || totalAttempts === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: pad }}>
        <Gauge size={30} color={C.teal} style={{ marginBottom: 14 }} />
        <div style={{ color: C.muted, fontSize: 13, maxWidth: 340, lineHeight: 1.6 }}>{p("needData")}</div>
      </div>
    );
  }

  if (runner) {
    return <SessionRunner lang={lang} learnerId={learnerId} items={runner}
      onDone={() => {
        if (activeAssignment) {
          completeAssignedSession(activeAssignment, learnerId).catch(() => {});
          setActiveAssignment(null);
          getAssignedSessions(learnerId).then(setAssigned).catch(() => {});
        }
      }}
      onExit={() => { setRunner(null); setActiveAssignment(null); getReadiness(learnerId).then(setData).catch(() => {}); getMissed(learnerId, true).then(setMissed).catch(() => {}); getAssignedSessions(learnerId).then(setAssigned).catch(() => {}); }} p={p} isMobile={isMobile} />;
  }

  const rd = data.readiness;
  const pct = Math.round(rd.score * 100);
  const ring = 2 * Math.PI * 50;
  const off = ring * (1 - rd.score);
  const label = rd.label[lang];

  return (
    <div className="ak-scroll" style={{ flex: 1, overflowY: "auto", padding: pad, background: C.paper }}>
      {/* HERO */}
      <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: "auto 1fr auto", gap: 18, alignItems: "center", background: "linear-gradient(135deg,#16263B,#0E1A2B)", borderRadius: 14, padding: "18px 20px", color: "#EAF0F6", marginBottom: 14 }}>
        <div style={{ position: "relative", width: 118, height: 118, margin: isMobile ? "0 auto 12px" : 0 }}>
          <svg width="118" height="118" viewBox="0 0 118 118" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="59" cy="59" r="50" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="11" />
            <circle cx="59" cy="59" r="50" fill="none" stroke={C.amber} strokeWidth="11" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={off} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 27, color: "#fff" }}>{pct}%</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8.5, letterSpacing: 1, textTransform: "uppercase", color: "#9DB0C2" }}>{p("readyLabel")}</div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 17, marginBottom: 5 }}>{p("hello")} {learnerName || learnerId} — <span style={{ color: C.amber }}>{label}</span></div>
          <div style={{ fontSize: 12.5, color: "#B8C7D6", lineHeight: 1.55 }}>{p("readyHint")}</div>
          {data.top_levers && data.top_levers[0] && (
            <div style={{ fontSize: 12.5, color: "#B8C7D6", marginTop: 6 }}>{p("priorityNow")} : <b style={{ color: C.amber }}>{data.top_levers[0][lang]}</b></div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 9, justifyContent: "center", marginTop: isMobile ? 14 : 0 }}>
          <HStat icon={<Flame size={13} color={C.amber} />} v={totalAttempts} l={p("attempts")} />
          <HStat v="J−7" l={p("exam")} />
        </div>
      </div>

      {/* CARTE MENTALE — la carte est le labo */}
      <CarteMentale
        lang={lang}
        readiness={rd}
        levers={data.top_levers || []}
        features={me && me.features}
        masteryByArea={(() => {
          const staleAreas = new Set((data.stale_mastered || []).map((s) => s.area));
          const out = {};
          (mastery || []).forEach((m) => {
            out[m.area] = { score: m.score, attempts: m.attempts, light: m.light, days_since: staleAreas.has(m.area) ? 30 : 0 };
          });
          return out;
        })()}
        onStudyArea={(a) => onStudyArea(a)}
        isMobile={isMobile}
      />

      {/* SESSION DU JOUR */}
      {assigned.filter((a) => a.status !== "completed").map((a) => (
        <div key={a.assignment_id} style={{ background: "linear-gradient(135deg,#1B2E45,#0E1A2B)", border: `1px solid ${C.teal}`, borderRadius: 14, padding: "15px 17px", marginBottom: 12, color: "#EAF0F6", display: "flex", alignItems: "center", gap: 13, flexWrap: "wrap" }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(46,140,158,.2)", border: `1px solid ${C.teal}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flex: "none" }}>🎯</span>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#7FD3E0", marginBottom: 3 }}>{lang === "en" ? "Assigned by your trainer" : "Assignée par votre formateur"}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14.5 }}>{a.title}</div>
            <div style={{ fontSize: 11.5, color: "#9DB0C2", marginTop: 2 }}>{a.question_count} {lang === "en" ? "questions" : "questions"}{a.status === "started" ? (lang === "en" ? " · in progress" : " · en cours") : ""}</div>
          </div>
          <button onClick={async () => {
            try {
              const r = await getAssignedSessionItems(a.assignment_id, learnerId);
              if (r && r.items && r.items.length) { setActiveAssignment(a.assignment_id); setRunner(r.items); }
            } catch (e) { /* stay calm */ }
          }} style={{ border: "none", borderRadius: 10, background: C.amber, color: "#0E1A2B", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12.5, padding: "11px 17px", cursor: "pointer" }}>{a.status === "started" ? (lang === "en" ? "Continue" : "Reprendre") : (lang === "en" ? "Start" : "Commencer")}</button>
        </div>
      ))}

      <SessionCard lang={lang} learnerId={learnerId} onStart={(items) => setRunner(items)} p={p} />

      <IntelligentFeatures lang={lang} me={me} />

      <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* MAÎTRISE PAR DOMAINE */}
        <Card title={p("byDomain")} mb={isMobile ? 12 : 0}>
          {DOMS.map((d) => {
            const dv = rd.domains[d.id];
            const v = dv ? dv.score : 0;
            return (
              <div key={d.id} style={{ padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  <span style={{ color: d.color }}>{d.label} · {Math.round((dv?.weight || 0) * 100)}%</span>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>{Math.round(v * 100)}%</span>
                </div>
                <div style={{ height: 8, background: "#E4EAF0", borderRadius: 6, overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: `${Math.round(v * 100)}%`, background: d.color, borderRadius: 6 }} />
                </div>
              </div>
            );
          })}
        </Card>

        {/* LEVIERS PRIORITAIRES */}
        <Card title={p("levers")} sub={p("leversSub")}>
          {data.top_levers.map((l) => (
            <button key={l.area} onClick={() => onStudyArea(l.area)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", width: "100%", background: "none", border: "none", borderBottom: `1px solid ${C.line}`, cursor: "pointer", textAlign: "left" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: domColor(l.score), flex: "none" }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.text }}>{l[lang]}</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: C.muted }}>{p("revise")} · {Math.round(l.score * 100)}%</span>
              </span>
              <ArrowRight size={14} color={C.teal} />
            </button>
          ))}
        </Card>

        {/* À RETRAVAILLER */}
        <Card title={p("missedTitle")} mb={isMobile ? 12 : 0} mt={12}>
          {missed && missed.items.length > 0 ? (
            <>
              {missed.items.slice(0, 4).map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, color: C.teal, background: "#EAF1F3", padding: "2px 7px", borderRadius: 5, whiteSpace: "nowrap", fontWeight: 600, marginTop: 2 }}>{m.item_external_id}</span>
                  <span style={{ flex: 1, fontSize: 12, lineHeight: 1.45, color: C.text }}>{m.prompt ? m.prompt[lang] : m.knowledge_area}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#B5701E", whiteSpace: "nowrap", marginTop: 2 }}>{p("reviewDue")}</span>
                </div>
              ))}
              {missed.items[0] && (
                <button onClick={() => onStudyArea(missed.items[0].knowledge_area)} style={{ marginTop: 11, width: "100%", padding: 10, border: `1px solid ${C.teal}`, borderRadius: 10, background: "#fff", color: C.teal, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>{p("replay")} →</button>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: C.muted, padding: "6px 0", lineHeight: 1.5 }}>{p("missedEmpty")}</div>
          )}
        </Card>

        {/* RÉFLEXES */}
        <Card title={p("reflexTitle") + (reflexes.length ? " · " + reflexes.length : "")} mt={12}>
          {reflexes.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {reflexes.slice(0, 4).map((r) => (
                <div key={r.id} style={{ background: "#F4F8F9", border: `1px dashed ${C.teal}`, borderRadius: 10, padding: "10px 12px", fontSize: 11.5, lineHeight: 1.5, color: C.text }}>{r.text}</div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.muted, padding: "6px 0", lineHeight: 1.5 }}>{p("reflexEmpty")}</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function HStat({ icon, v, l }) {
  return (
    <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 10, padding: "8px 13px", textAlign: "center", minWidth: 100 }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>{icon}{v}</div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8.5, letterSpacing: 1, textTransform: "uppercase", color: "#9DB0C2" }}>{l}</div>
    </div>
  );
}

function SessionCard({ lang, learnerId, onStart, p }) {
  const [sess, setSess] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | error
  const load = () => {
    setState("loading");
    getSessionNext(learnerId, 10)
      .then((s) => { setSess(s); setState("ready"); })
      .catch(() => setState("error"));
  };
  useEffect(() => { if (learnerId) load(); }, [learnerId]);

  const comp = sess ? sess.composition : { weak_priority: 0, missed_due: 0, maintenance: 0 };
  const size = sess ? sess.size : 10;
  const canStart = state === "ready" && sess && sess.items && sess.items.length > 0;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.amber}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>⟡ {p("sessionTitle")}</div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{size} {p("sessionSub")}</div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
        {comp.weak_priority > 0 && <Chip c="r">{comp.weak_priority} × {p("compWeak")}</Chip>}
        {comp.missed_due > 0 && <Chip c="o">{comp.missed_due} × {p("compMissed")}</Chip>}
        {comp.maintenance > 0 && <Chip>{comp.maintenance} × {p("compMaint")}</Chip>}
      </div>
      {state === "error" ? (
        <button onClick={load} style={{ width: "100%", padding: 12, border: `1px solid ${C.amber}`, borderRadius: 11, background: "#fff", color: "#B5701E", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <RefreshCw size={15} /> {p("sessRetry")}
        </button>
      ) : (
        <button onClick={() => canStart && onStart(sess.items)} disabled={!canStart} style={{ width: "100%", padding: 12, border: "none", borderRadius: 11, background: canStart ? C.amber : "#C3CDD7", color: C.ink, fontWeight: 700, fontSize: 14, cursor: canStart ? "pointer" : "default", fontFamily: "'Space Grotesk',sans-serif" }}>
          {state === "loading" ? p("sessLoading") : `${p("launch")} →`}
        </button>
      )}
    </div>
  );
}

function SessionRunner({ lang, learnerId, items, onExit, p, isMobile, onDone }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [graded, setGraded] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const pad = isMobile ? "16px" : "22px";
  const it = items[idx];

  function choose(ci) {
    if (graded) return;
    setPicked(ci);
    postQuizAnswer({ learner_id: learnerId, external_id: it.external_id, choice_index: ci })
      .then((r) => { setGraded(r); if (r.correct) setCorrectCount((c) => c + 1); })
      .catch(() => { setPicked(null); }); // network hiccup: let them tap again
  }
  function next() {
    if (idx + 1 >= items.length) { setDone(true); if (onDone) onDone(); return; }
    setIdx(idx + 1); setPicked(null); setGraded(null);
  }

  if (done) {
    const pctc = Math.round((correctCount / items.length) * 100);
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: pad, background: C.paper }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 10 }}>{p("sessDone")}</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 46, color: pctc >= 70 ? "#3DA776" : pctc >= 50 ? "#E8A765" : "#D2664E" }}>{correctCount}/{items.length}</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>{p("sessScore")} · {pctc}% {p("sessCorrect")}</div>
        <button onClick={onExit} style={{ padding: "11px 20px", border: "none", borderRadius: 11, background: C.amber, color: C.ink, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif" }}>{p("sessBack")}</button>
      </div>
    );
  }

  const opts = it.options[lang];
  return (
    <div className="ak-scroll" style={{ flex: 1, overflowY: "auto", padding: pad, background: C.paper }}>
      {/* progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>{p("sessGo")} {idx + 1} {p("sessOf")} {items.length}</div>
        <div style={{ flex: 1, height: 6, background: "#E4EAF0", borderRadius: 4, overflow: "hidden" }}>
          <span style={{ display: "block", height: "100%", width: `${((idx + (graded ? 1 : 0)) / items.length) * 100}%`, background: C.amber, borderRadius: 4, transition: "width .3s" }} />
        </div>
        <button onClick={onExit} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 0, lineHeight: 0 }}><X size={16} /></button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: C.text, marginBottom: 16, fontWeight: 500 }}>{it.prompt[lang]}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {opts.map((o, i) => {
            const isRight = graded && i === graded.answer_index;
            const isWrongPick = graded && i === picked && !graded.correct;
            const bg = isRight ? "#E4F3EC" : isWrongPick ? "#F7E3DD" : "#fff";
            const bd = isRight ? "#3DA776" : isWrongPick ? "#D2664E" : C.line;
            return (
              <button key={i} onClick={() => choose(i)} disabled={!!graded} style={{ textAlign: "left", padding: "12px 14px", borderRadius: 11, border: `1px solid ${bd}`, background: bg, cursor: graded ? "default" : "pointer", fontSize: 13.5, lineHeight: 1.5, color: C.text, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, color: C.muted, flex: "none" }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{o}</span>
                {isRight && <Check size={16} color="#3DA776" style={{ flex: "none" }} />}
                {isWrongPick && <X size={16} color="#D2664E" style={{ flex: "none" }} />}
              </button>
            );
          })}
        </div>

        {graded && (
          <div className="ak-fade" style={{ marginTop: 16 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: graded.correct ? "#3DA776" : "#D2664E", marginBottom: 6 }}>{graded.correct ? p("correct") : p("incorrect")}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: C.text, background: C.card, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.teal}`, borderRadius: 10, padding: "11px 14px" }}>{graded.rationale[lang]}</div>
            <button onClick={next} style={{ marginTop: 14, width: "100%", padding: 12, border: "none", borderRadius: 11, background: C.ink, color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif" }}>{idx + 1 >= items.length ? p("sessFinish") : p("sessNext")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ c, children }) {
  const bg = c === "r" ? "#F7E3DD" : c === "o" ? "#FBEEDD" : "#EAF1F3";
  const col = c === "r" ? "#D2664E" : c === "o" ? "#B5701E" : C.teal;
  return <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, padding: "4px 10px", borderRadius: 20, fontWeight: 600, background: bg, color: col }}>{children}</span>;
}

function Card({ title, sub, children, mb = 0, mt = 0 }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", marginBottom: mb, marginTop: mt }}>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>
        {title}{sub && <span style={{ textTransform: "none", letterSpacing: 0, color: "#9AA8B6" }}> · {sub}</span>}
      </div>
      {children}
    </div>
  );
}

function QuizPanel({ lang, area, learnerId, onGraded, t }) {
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  const [flagged, setFlagged] = useState(false);

  async function load() {
    setLoading(true); setPicked(null); setRes(null); setErr(null); setFlagged(false);
    try { const d = await getQuizNext(learnerId, area); setQ(d.item); }
    catch (e) { setErr(t("err")); } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* reload on area change */ }, [area]);

  function doFlag() {
    if (flagged || !q) return;
    setFlagged(true);
    flagItem({ learner_id: learnerId, external_id: q.external_id, reason: "" }).catch(() => {});
  }

  async function answer(i) {
    if (res) return;
    setPicked(i);
    try { const d = await postQuizAnswer({ learner_id: learnerId, external_id: q.external_id, choice_index: i }); setRes(d); onGraded(d); }
    catch (e) { setErr(t("err")); }
  }

  if (loading) return <Center><span style={{ color: C.muted, fontSize: 13 }}>{QT.loadingQ[lang]}</span></Center>;
  if (err) return <Center><span style={{ color: "#C0392B", fontSize: 13 }}>{err}</span></Center>;
  if (!q) return <Center><span style={{ color: C.muted, fontSize: 13, maxWidth: 340, textAlign: "center", lineHeight: 1.6 }}>{QT.none[lang]}</span></Center>;

  const opts = q.options[lang];
  return (
    <div className="ak-scroll" style={{ flex: 1, padding: "22px", overflowY: "auto" }}>
      <div className="ak-fade" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: C.ink, background: C.teal, borderRadius: 4, padding: "2px 7px", fontWeight: 600 }}>{q.pmbok_ref || q.type}</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: C.muted }}>{q.process_group}</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.text, lineHeight: 1.5, marginBottom: 16, fontFamily: "'Space Grotesk', sans-serif" }}>{q.prompt[lang]}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opts.map((o, i) => {
            let border = C.line, bg = C.card, mark = null;
            if (res) {
              if (i === res.answer_index) { border = C.green; bg = "#EAF7F0"; mark = <Check size={16} color={C.green} />; }
              else if (i === picked) { border = C.red; bg = "#FBECE8"; mark = <X size={16} color={C.red} />; }
            }
            return (
              <button key={i} className="ak-opt" disabled={!!res} onClick={() => answer(i)}
                style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "11px 14px", borderRadius: 10, border: `1px solid ${border}`, background: bg, fontSize: 13.5, color: C.text }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: C.muted, fontWeight: 600 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{o}</span>
                {mark}
              </button>
            );
          })}
        </div>

        {res && (
          <div className="ak-fade" style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: res.correct ? C.green : C.red, marginBottom: 6 }}>{res.correct ? QT.good[lang] : QT.bad[lang]}</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, background: C.card, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.teal}`, borderRadius: 10, padding: "10px 14px" }}>{res.rationale[lang]}</div>
            <button onClick={load} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, background: C.amber, color: C.ink, border: "none", fontWeight: 600, fontSize: 13 }}>
              {QT.next[lang]} <ArrowRight size={15} />
            </button>
          </div>
        )}

        <div style={{ marginTop: 18, textAlign: "right" }}>
          <button onClick={doFlag} disabled={flagged}
            style={{ background: "none", border: "none", color: flagged ? C.green : C.muted, fontSize: 11.5, cursor: flagged ? "default" : "pointer" }}>
            {flagged ? t("flagged") : t("flag")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Center({ children }) {
  return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>{children}</div>;
}

function Gate({ lang, setLang, onStart, onJoinClass, t }) {
  const [name, setName] = useState("");
  const [trainerOpen, setTrainerOpen] = useState(false);
  const [trainerName, setTrainerName] = useState("");
  const [classOpen, setClassOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [className, setClassName] = useState("");
  const [classBusy, setClassBusy] = useState(false);
  const [classErr, setClassErr] = useState(null);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [recEmail, setRecEmail] = useState("");
  const [recBusy, setRecBusy] = useState(false);
  const [recMsg, setRecMsg] = useState(null);
  const [recErr, setRecErr] = useState(null);

  async function doRecover() {
    const e = recEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || recBusy) { setRecErr(lang === "en" ? "Enter a valid email." : "Saisissez un email valide."); return; }
    setRecBusy(true); setRecErr(null); setRecMsg(null);
    try {
      const r = await requestMagicLink(e, lang);
      if (r && r.ok) setRecMsg(lang === "en" ? r.message_en : r.message_fr);
      else setRecErr(lang === "en" ? (r.message_en || "Email sending is not available.") : (r.message_fr || "L'envoi d'email n'est pas disponible."));
    } catch (e2) {
      setRecErr(lang === "en" ? "Could not connect — try again." : "Connexion impossible — réessayez.");
    }
    setRecBusy(false);
  }

  async function doJoin() {
    const code = classCode.trim(); const nm = className.trim();
    if (!code || !nm || classBusy) return;
    setClassBusy(true); setClassErr(null);
    try {
      const r = await onJoinClass(code, nm);
      if (r && r.error) {
        setClassErr(lang === "en" ? (r.message_en || "This class code was not found.") : (r.message_fr || "Ce code de classe est introuvable."));
      }
    } catch (e) {
      setClassErr(lang === "en" ? "Could not connect — the server may be waking up, try again." : "Connexion impossible — le serveur se réveille peut-être, réessayez.");
    }
    setClassBusy(false);
  }
  return (
    <div style={{ background: C.ink, minHeight: "100vh", height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&family=IBM+Plex+Mono:wght@500&display=swap'); body{margin:0}`}</style>
      <div style={{ width: "100%", maxWidth: 380, background: C.ink2, border: `1px solid ${C.inkLine}`, borderRadius: 16, padding: "28px 26px", textAlign: "center" }}>
        <svg width="46" height="46" viewBox="0 0 40 40" style={{ marginBottom: 14 }}>
          <polygon points="20,5 35,32 5,32" fill="none" stroke={C.amber} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="20" cy="5" r="2.6" fill={C.amber} /><circle cx="35" cy="32" r="2.6" fill={C.teal} /><circle cx="5" cy="32" r="2.6" fill="#fff" />
        </svg>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: "#fff", marginBottom: 8 }}>{t("welcome")}</div>

        {!trainerOpen && !classOpen && !recoverOpen ? (
          <>
            <div style={{ color: "#9DB0C2", fontSize: 13, lineHeight: 1.5, marginBottom: 18 }}>{t("welcomeSub")}</div>
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onStart(name); }} placeholder={t("namePh")} autoFocus
              style={{ width: "100%", background: C.ink, color: "#E6EDF4", border: `1px solid ${C.inkLine}`, borderRadius: 10, padding: "11px 13px", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter', sans-serif" }} />
            <button onClick={() => onStart(name)} disabled={!name.trim()}
              style={{ width: "100%", padding: "12px", border: "none", borderRadius: 11, background: name.trim() ? C.amber : "#33475F", color: name.trim() ? C.ink : "#6E8093", fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("startBtn")}
            </button>
            <div onClick={() => { setClassOpen(true); setClassErr(null); }} style={{ marginTop: 16, fontSize: 12.5, color: C.teal, cursor: "pointer", borderBottom: `1px dashed ${C.teal}`, display: "inline-block", paddingBottom: 1 }}>{t("classLink")}</div>
            <div onClick={() => setRecoverOpen(true)} style={{ marginTop: 12, fontSize: 12, color: "#9DB0C2", cursor: "pointer" }}>{t("recoverLink")}</div>
            <div onClick={() => setTrainerOpen(true)} style={{ marginTop: 14, fontSize: 12, color: "#7E90A4", cursor: "pointer", borderBottom: "1px dashed #3C526B", display: "inline-block", paddingBottom: 1 }}>{t("trainerLink")}</div>
          </>
        ) : recoverOpen ? (
          <>
            <div style={{ borderTop: `1px solid ${C.inkLine}`, marginTop: 4, paddingTop: 18 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: C.teal, marginBottom: 6 }}>✉ {t("recoverTitle")}</div>
              <div style={{ color: "#9DB0C2", fontSize: 12.5, lineHeight: 1.55, marginBottom: 14 }}>{t("recoverSub")}</div>
              {recMsg ? (
                <>
                  <div style={{ background: "rgba(46,140,158,.12)", border: `1px solid ${C.teal}`, borderRadius: 10, padding: "12px 14px", color: "#CDE7EC", fontSize: 12.5, lineHeight: 1.55 }}>{recMsg}</div>
                  <div onClick={() => { setRecoverOpen(false); setRecMsg(null); setRecEmail(""); }} style={{ marginTop: 14, fontSize: 12, color: "#7E90A4", cursor: "pointer" }}>{t("backLink")}</div>
                </>
              ) : (
                <>
                  <input value={recEmail} onChange={(e) => { setRecEmail(e.target.value); setRecErr(null); }} onKeyDown={(e) => { if (e.key === "Enter") doRecover(); }} placeholder="vous@exemple.com" type="email" autoFocus
                    style={{ width: "100%", background: C.ink, color: "#E6EDF4", border: `1px solid ${C.inkLine}`, borderRadius: 10, padding: "11px 13px", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter', sans-serif" }} />
                  <button onClick={doRecover} disabled={recBusy}
                    style={{ width: "100%", padding: "12px", border: "none", borderRadius: 11, background: recBusy ? "#33475F" : C.amber, color: recBusy ? "#6E8093" : C.ink, fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {recBusy ? t("recoverSending") : t("recoverBtn")}
                  </button>
                  {recErr && <div style={{ color: "#E8A0A0", fontSize: 12.5, lineHeight: 1.5, marginTop: 11 }}>{recErr}</div>}
                  <div onClick={() => { setRecoverOpen(false); setRecErr(null); }} style={{ marginTop: 12, fontSize: 11.5, color: "#7E90A4", cursor: "pointer" }}>{t("backLink")}</div>
                </>
              )}
            </div>
          </>
        ) : classOpen ? (
          <>
            <div style={{ borderTop: `1px solid ${C.inkLine}`, marginTop: 4, paddingTop: 18 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: C.teal, marginBottom: 6 }}>🎓 {t("classTitle")}</div>
              <div style={{ color: "#9DB0C2", fontSize: 12.5, lineHeight: 1.55, marginBottom: 14 }}>{t("classSub")}</div>
              <input value={classCode} onChange={(e) => { setClassCode(e.target.value.toUpperCase()); setClassErr(null); }} placeholder={t("classCodePh")} autoFocus
                style={{ width: "100%", background: C.ink, color: "#E6EDF4", border: `1px solid ${C.inkLine}`, borderRadius: 10, padding: "11px 13px", fontSize: 14, outline: "none", marginBottom: 10, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 2, textAlign: "center", textTransform: "uppercase" }} />
              <input value={className} onChange={(e) => setClassName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doJoin(); }} placeholder={t("classNameLabel")}
                style={{ width: "100%", background: C.ink, color: "#E6EDF4", border: `1px solid ${C.inkLine}`, borderRadius: 10, padding: "11px 13px", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter', sans-serif" }} />
              <button onClick={doJoin} disabled={!classCode.trim() || !className.trim() || classBusy}
                style={{ width: "100%", padding: "12px", border: "none", borderRadius: 11, background: (classCode.trim() && className.trim() && !classBusy) ? C.amber : "#33475F", color: (classCode.trim() && className.trim() && !classBusy) ? C.ink : "#6E8093", fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>
                {classBusy ? t("classJoining") : t("classJoinBtn")}
              </button>
              {classErr && <div style={{ color: "#E8A0A0", fontSize: 12.5, lineHeight: 1.5, marginTop: 11 }}>{classErr}</div>}
              <div onClick={() => { setClassOpen(false); setClassErr(null); }} style={{ marginTop: 12, fontSize: 11.5, color: "#7E90A4", cursor: "pointer" }}>{t("backLink")}</div>
            </div>
          </>
        ) : (
          <>
            <div style={{ borderTop: `1px solid ${C.inkLine}`, marginTop: 4, paddingTop: 18 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: C.teal, marginBottom: 12 }}>🎛️ {t("trainerAccess")}</div>
              <input value={trainerName} onChange={(e) => setTrainerName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && trainerName.trim()) onStart(trainerName, true); }} placeholder={t("trainerPh")} autoFocus
                style={{ width: "100%", background: C.ink, color: "#E6EDF4", border: `1px solid ${C.inkLine}`, borderRadius: 10, padding: "11px 13px", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter', sans-serif" }} />
              <button onClick={() => onStart(trainerName, true)} disabled={!trainerName.trim()}
                style={{ width: "100%", padding: "12px", border: `1px solid ${trainerName.trim() ? C.teal : C.inkLine}`, borderRadius: 11, background: "transparent", color: trainerName.trim() ? "#EAF0F6" : "#6E8093", fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>
                {t("trainerOpen")}
              </button>
              <div onClick={() => setTrainerOpen(false)} style={{ marginTop: 12, fontSize: 11.5, color: "#7E90A4", cursor: "pointer" }}>{t("backLink")}</div>
            </div>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 16 }}>
          {["fr", "en"].map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "3px 9px", borderRadius: 6, background: lang === l ? C.amber : "transparent", color: lang === l ? C.ink : "#9DB0C2", fontWeight: 600, border: "none" }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setMobile(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, [breakpoint]);
  return mobile;
}

function IntelligentFeatures({ lang, me }) {
  const [showUpgrade, setShowUpgrade] = React.useState(false);
  const t = (fr, en) => (lang === "en" ? en : fr);
  if (!me || !me.features) return null;
  const f = me.features;
  const plan = me.effective_plan;
  const premium = plan === "premium" || plan === "institution";

  // The premium intelligent features to surface as cards.
  const cards = [
    { key: "exam_simulator", icon: "\u{1F4DD}",
      descFr: "Entraînez-vous dans les conditions réelles : 180 questions, 230 minutes, score prédictif par domaine.",
      descEn: "Train in real conditions: 180 questions, 230 minutes, predictive score per domain." },
    { key: "spaced_repetition", icon: "\u{1F9E0}",
      descFr: "Le système réintroduit vos erreurs au bon moment pour ancrer durablement vos acquis.",
      descEn: "The system reintroduces your mistakes at the right time to lock in what you learn." },
  ];

  return (
    <>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{t("Fonctions intelligentes", "Intelligent features")}</div>
        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 11 }}>{premium ? t("Débloquées avec votre plan.", "Unlocked with your plan.") : t("La couche qui vous guide vraiment — incluse en Premium.", "The layer that truly guides you — included with Premium.")}</div>
        <div style={{ display: isMobileWidth() ? "block" : "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {cards.map((c) => {
            const access = (f[c.key] && f[c.key].access) || "none";
            const label = (f[c.key] && f[c.key].label) ? f[c.key].label[lang] : c.key;
            const locked = access === "none";
            return (
              <div key={c.key} style={{
                background: locked ? "linear-gradient(135deg,#1B2E45,#0E1A2B)" : C.card,
                border: locked ? "1px solid rgba(255,255,255,.08)" : `1px solid ${C.line}`,
                borderRadius: 14, padding: 16, color: locked ? "#EAF0F6" : C.text, position: "relative",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: locked ? "rgba(232,154,60,.16)" : "#F1EAF7", border: locked ? `1px solid ${C.amber}` : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{locked ? "\u{1F512}" : c.icon}</span>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14 }}>{label}</div>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: locked ? "#B8C7D6" : C.muted, marginBottom: locked ? 12 : 0 }}>{lang === "en" ? c.descEn : c.descFr}</div>
                {locked && (
                  <button onClick={() => setShowUpgrade(true)} style={{ border: "none", borderRadius: 9, background: C.amber, color: "#0E1A2B", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, padding: "9px 14px", cursor: "pointer", width: "100%" }}>{t("Débloquer avec Premium", "Unlock with Premium")}</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {showUpgrade && <UpgradeModal lang={lang} onClose={() => setShowUpgrade(false)} />}
    </>
  );
}

function UpgradeModal({ lang, onClose }) {
  const t = (fr, en) => (lang === "en" ? en : fr);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(6,11,18,.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: 16, maxWidth: 460, width: "100%", overflow: "hidden", boxShadow: "0 24px 70px rgba(0,0,0,.5)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#E89A3C,#2E8C9E)" }} />
        <div style={{ padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 5 }}>{t("Certifizer est utile gratuitement. Il devient intelligent en Premium.", "Certifizer is useful for free. It becomes intelligent with Premium.")}</div>
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, marginBottom: 16 }}>{t("Vous préparez déjà votre examen avec la pratique, la carte et votre score. Premium ajoute la couche qui vous guide vraiment.", "You already prepare with practice, the map and your score. Premium adds the layer that truly guides you.")}</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 11, padding: 12 }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, textTransform: "uppercase", letterSpacing: .5, color: C.muted, marginBottom: 8 }}>{t("Gratuit — vous l'avez", "Free — you have it")}</div>
              {[t("Pratique des questions", "Question practice"), t("Carte PMP de base", "Basic PMP map"), t("Score de préparation", "Readiness score"), t("Aperçu des zones faibles", "Weak-area preview")].map((x, i) => <div key={i} style={{ fontSize: 11.5, lineHeight: 1.6, color: C.text }}>✓ {x}</div>)}
            </div>
            <div style={{ flex: 1, border: `1px solid ${C.amber}`, borderRadius: 11, padding: 12, background: "linear-gradient(180deg,rgba(232,154,60,.05),#fff)" }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, textTransform: "uppercase", letterSpacing: .5, color: "#B5701E", marginBottom: 8 }}>{t("Premium — l'intelligence", "Premium — intelligence")}</div>
              {[t("Séances adaptatives complètes", "Full adaptive sessions"), t("Chemin critique complet", "Full critical path"), t("Apprentissage adaptatif", "Adaptive learning"), t("Simulateur d'examen", "Exam simulator")].map((x, i) => <div key={i} style={{ fontSize: 11.5, lineHeight: 1.6, color: C.text }}>✓ {x}</div>)}
            </div>
          </div>
          <button style={{ border: "none", borderRadius: 11, background: C.amber, color: "#0E1A2B", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, padding: "12px", cursor: "pointer", width: "100%" }}>{t("Passer à Premium", "Go Premium")}</button>
          <div style={{ textAlign: "center", fontSize: 10.5, color: C.muted, marginTop: 9 }}>{t("Vous gardez toute votre progression. Aucune donnée ne se perd.", "You keep all your progress. Nothing is lost.")}</div>
          <button onClick={onClose} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>{t("Plus tard", "Later")}</button>
        </div>
      </div>
    </div>
  );
}

function isMobileWidth() {
  return typeof window !== "undefined" && window.innerWidth < 640;
}

function PlanBadge({ plan, lang }) {
  const premium = plan === "premium" || plan === "institution";
  const label = plan === "institution" ? "Institution" : premium ? "Premium" : (lang === "en" ? "Free" : "Gratuit");
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 9.5, fontWeight: 600, padding: "2px 8px", borderRadius: 999, verticalAlign: "middle",
      background: premium ? "linear-gradient(135deg,#E89A3C,#D2814E)" : "rgba(255,255,255,0.08)",
      color: premium ? "#0E1A2B" : "#9DB0C2", border: premium ? "none" : "1px solid rgba(255,255,255,0.12)",
    }}>● {label}</span>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "#6E8093", marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}

/* ======================================================================
   v35 — InviteGate : acceptation d'une invitation par lien (?invite=TOKEN).
   Vouvoiement strict. Si un profil existe déjà sur cet appareil, l'apprenant
   rejoint la cohorte AVEC ce profil (progression conservée).
   ====================================================================== */
function InviteGate({ lang, setLang, token, currentId, currentName, onJoined, onDismiss }) {
  const t2 = (fr, en) => (lang === "en" ? en : fr);
  const [info, setInfo] = useState(null);      // {cohort_code, name, role, status} | {error}
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getInviteInfo(token).then((r) => { setInfo(r); if (r && r.name) setName(r.name); })
      .catch(() => setInfo({ error: "network" }));
  }, [token]);

  async function join(useExisting) {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await acceptInvite(token, useExisting
        ? { existingPublicId: currentId }
        : { name: name.trim() });
      if (r && r.ok) { onJoined(r.learner_id, r.name || name.trim() || currentName, r.role); return; }
      if (r && r.error === "already_used") setErr(t2("Ce lien a déjà été utilisé. Veuillez demander un nouveau lien à votre formateur.", "This link has already been used. Please ask your trainer for a new one."));
      else if (r && r.error === "revoked") setErr(t2("Ce lien a été révoqué. Veuillez demander un nouveau lien à votre formateur.", "This link has been revoked. Please ask your trainer for a new one."));
      else if (r && r.error === "seats_exhausted") setErr(lang === "en" ? r.message_en : r.message_fr);
      else if (r && r.error === "name_required") setErr(t2("Veuillez saisir votre nom pour rejoindre la cohorte.", "Please enter your name to join the cohort."));
      else setErr(t2("Ce lien d'invitation n'est pas valide.", "This invitation link is not valid."));
    } catch (e) {
      setErr(t2("Connexion impossible — le serveur se réveille peut-être, réessayez dans un instant.", "Could not connect — the server may be waking up, try again in a moment."));
    }
    setBusy(false);
  }

  const invalid = info && (info.error || info.status === "revoked" || info.status === "accepted");
  const invalidMsg = info && (info.status === "accepted"
    ? t2("Ce lien a déjà été utilisé.", "This link has already been used.")
    : info.status === "revoked"
      ? t2("Ce lien a été révoqué.", "This link has been revoked.")
      : t2("Ce lien d'invitation n'est pas valide.", "This invitation link is not valid."));

  return (
    <div style={{ background: C.ink, minHeight: "100vh", height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&family=IBM+Plex+Mono:wght@500&display=swap'); body{margin:0}`}</style>
      <div style={{ width: "100%", maxWidth: 400, background: C.ink2, border: `1px solid ${C.inkLine}`, borderRadius: 16, padding: "28px 26px", textAlign: "center" }}>
        <svg width="46" height="46" viewBox="0 0 40 40" style={{ marginBottom: 14 }}>
          <polygon points="20,5 35,32 5,32" fill="none" stroke={C.amber} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="20" cy="5" r="2.6" fill={C.amber} /><circle cx="35" cy="32" r="2.6" fill={C.teal} /><circle cx="5" cy="32" r="2.6" fill="#fff" />
        </svg>

        {!info && <div style={{ color: "#9DB0C2", fontSize: 13 }}>{t2("Vérification de votre invitation…", "Checking your invitation…")}</div>}

        {info && invalid && (
          <>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: "#fff", marginBottom: 10 }}>{t2("Invitation indisponible", "Invitation unavailable")}</div>
            <div style={{ color: "#9DB0C2", fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>{invalidMsg} {t2("Veuillez demander un nouveau lien à votre formateur.", "Please ask your trainer for a new link.")}</div>
            <button onClick={onDismiss} style={{ width: "100%", padding: "12px", border: "none", borderRadius: 11, background: C.amber, color: C.ink, fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer" }}>{t2("Continuer vers Certifizer", "Continue to Certifizer")}</button>
          </>
        )}

        {info && !invalid && (
          <>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: "#fff", marginBottom: 8 }}>
              {t2("Invitation à rejoindre la cohorte", "Invitation to join cohort")} <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#7FD3E0" }}>{info.cohort_code}</span>
            </div>
            <div style={{ color: "#9DB0C2", fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
              {info.role === "trainer"
                ? t2("Vous êtes invité comme formateur : vous aurez accès au cockpit de la cohorte.", "You are invited as a trainer: you will have access to the cohort cockpit.")
                : t2("Votre formateur vous a transmis ce lien. Votre progression est personnelle et commence immédiatement.", "Your trainer sent you this link. Your progress is personal and starts right away.")}
            </div>

            {currentId ? (
              <>
                <button onClick={() => join(true)} disabled={busy}
                  style={{ width: "100%", padding: "12px", border: "none", borderRadius: 11, background: busy ? "#33475F" : C.amber, color: busy ? "#6E8093" : C.ink, fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", cursor: busy ? "default" : "pointer" }}>
                  {busy ? t2("Rattachement…", "Joining…") : t2(`Rejoindre avec mon profil (${currentName})`, `Join with my profile (${currentName})`)}
                </button>
                <div style={{ color: "#7E90A4", fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>{t2("Votre progression actuelle est conservée.", "Your current progress is kept.")}</div>
              </>
            ) : (
              <>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) join(false); }}
                  placeholder={t2("Votre nom", "Your name")} autoFocus
                  style={{ width: "100%", background: C.ink, color: "#E6EDF4", border: `1px solid ${C.inkLine}`, borderRadius: 10, padding: "11px 13px", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter', sans-serif", textAlign: "center", boxSizing: "border-box" }} />
                <button onClick={() => join(false)} disabled={busy || !name.trim()}
                  style={{ width: "100%", padding: "12px", border: "none", borderRadius: 11, background: busy || !name.trim() ? "#33475F" : C.amber, color: busy || !name.trim() ? "#6E8093" : C.ink, fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", cursor: busy || !name.trim() ? "default" : "pointer" }}>
                  {busy ? t2("Rattachement…", "Joining…") : t2("Rejoindre la cohorte", "Join the cohort")}
                </button>
              </>
            )}
            {err && <div style={{ color: "#E8A0A0", fontSize: 12.5, lineHeight: 1.55, marginTop: 12 }}>{err}</div>}
          </>
        )}
      </div>
    </div>
  );
}

/* ======================================================================
   v37 — EmailRecoveryGate : proposition FACULTATIVE de lier un email après
   l'entrée (rejoindre par code ou par nom). « Plus tard » toujours possible.
   L'email relie le profil entre appareils et prépare le lien magique (v38).
   ====================================================================== */
function EmailRecoveryGate({ lang, learnerId, t, onDone }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function link() {
    if (!valid || busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await linkEmail(learnerId, email.trim());
      if (r && r.ok) { setDone(true); setTimeout(onDone, 1100); }
      else setErr(lang === "en" ? (r.message_en || "Could not link this email.") : (r.message_fr || "Impossible de lier cet email."));
    } catch (e) {
      setErr(lang === "en" ? "Could not connect — try again." : "Connexion impossible — réessayez.");
    }
    setBusy(false);
  }

  return (
    <div style={{ background: C.ink, minHeight: "100vh", height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&family=IBM+Plex+Mono:wght@500&display=swap'); body{margin:0}`}</style>
      <div style={{ width: "100%", maxWidth: 380, background: C.ink2, border: `1px solid ${C.inkLine}`, borderRadius: 16, padding: "28px 26px", textAlign: "center", position: "relative" }}>
        <span style={{ position: "absolute", top: 12, right: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9DB0C2", background: C.ink, border: `1px solid ${C.inkLine}`, borderRadius: 20, padding: "3px 10px" }}>● {lang === "en" ? "Free" : "Gratuit"}</span>
        <svg width="44" height="44" viewBox="0 0 40 40" style={{ marginBottom: 14 }}>
          <polygon points="20,5 35,32 5,32" fill="none" stroke={C.amber} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="20" cy="5" r="2.6" fill={C.amber} /><circle cx="35" cy="32" r="2.6" fill={C.teal} /><circle cx="5" cy="32" r="2.6" fill="#fff" />
        </svg>
        {done ? (
          <>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(61,167,118,.15)", border: `2px solid ${C.green || "#3DA776"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#3DA776", fontSize: 24, margin: "0 auto 14px" }}>✓</div>
            <div style={{ color: "#B8C7D6", fontSize: 13.5, lineHeight: 1.5 }}>{t("emailRecDone")}</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: "#fff", marginBottom: 8 }}>{t("emailRecTitle")}</div>
            <div style={{ color: "#9DB0C2", fontSize: 12.5, lineHeight: 1.55, marginBottom: 16 }}>{t("emailRecSub")}</div>
            <input value={email} onChange={(e) => { setEmail(e.target.value); setErr(null); }} onKeyDown={(e) => { if (e.key === "Enter") link(); }} placeholder="vous@exemple.com" type="email" autoFocus
              style={{ width: "100%", background: C.ink, color: "#E6EDF4", border: `1px solid ${C.inkLine}`, borderRadius: 10, padding: "11px 13px", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter', sans-serif" }} />
            <button onClick={link} disabled={!valid || busy}
              style={{ width: "100%", padding: "12px", border: "none", borderRadius: 11, background: valid && !busy ? C.amber : "#33475F", color: valid && !busy ? C.ink : "#6E8093", fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>
              {busy ? (lang === "en" ? "Linking…" : "Liaison…") : t("emailRecBtn")}
            </button>
            {err && <div style={{ color: "#E8A0A0", fontSize: 12.5, lineHeight: 1.5, marginTop: 11 }}>{err}</div>}
            <div onClick={onDone} style={{ marginTop: 14, fontSize: 12.5, color: "#7E90A4", cursor: "pointer" }}>{t("emailRecLater")}</div>
            <div style={{ color: "#5E6E7F", fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>{t("emailRecPrivacy")}</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ======================================================================
   v38 — MagicGate : écran affiché pendant/à l'échec du traitement d'un
   lien magique (?magic=TOKEN). Le succès bascule directement dans l'app.
   ====================================================================== */
function MagicGate({ lang, setLang, state, onDismiss }) {
  const t2 = (fr, en) => (lang === "en" ? en : fr);
  const msg = state === "expired"
    ? t2("Ce lien de connexion a expiré. Demandez-en un nouveau depuis l'accueil.", "This sign-in link has expired. Request a new one from the home screen.")
    : state === "invalid"
      ? t2("Ce lien de connexion n'est pas valide.", "This sign-in link is not valid.")
      : t2("Connexion en cours…", "Signing you in…");
  const checking = state === "checking";
  return (
    <div style={{ background: C.ink, minHeight: "100vh", height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=swap'); body{margin:0} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: "100%", maxWidth: 380, background: C.ink2, border: `1px solid ${C.inkLine}`, borderRadius: 16, padding: "30px 26px", textAlign: "center" }}>
        <svg width="46" height="46" viewBox="0 0 40 40" style={{ marginBottom: 16 }}>
          <polygon points="20,5 35,32 5,32" fill="none" stroke={C.amber} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="20" cy="5" r="2.6" fill={C.amber} /><circle cx="35" cy="32" r="2.6" fill={C.teal} /><circle cx="5" cy="32" r="2.6" fill="#fff" />
        </svg>
        {checking ? (
          <>
            <div style={{ width: 28, height: 28, border: `3px solid ${C.inkLine}`, borderTopColor: C.amber, borderRadius: "50%", margin: "0 auto 14px", animation: "spin .8s linear infinite" }} />
            <div style={{ color: "#9DB0C2", fontSize: 13.5 }}>{msg}</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 10 }}>{t2("Lien indisponible", "Link unavailable")}</div>
            <div style={{ color: "#9DB0C2", fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>{msg}</div>
            <button onClick={onDismiss} style={{ width: "100%", padding: "12px", border: "none", borderRadius: 11, background: C.amber, color: C.ink, fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer" }}>{t2("Continuer vers Certifizer", "Continue to Certifizer")}</button>
          </>
        )}
      </div>
    </div>
  );
}
