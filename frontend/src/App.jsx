import React, { useState, useRef, useEffect } from "react";
import { BookOpen, HelpCircle, Puzzle, Lightbulb, Send, RotateCcw, Target, Check, X, ArrowRight, Menu } from "lucide-react";
import { C, KA, FOCUS, STARTERS, T, lightColor } from "./pmp.js";
import { postChat, getMastery, getQuizNext, postQuizAnswer } from "./api.js";

const LEARNER_ID = "demo"; // replace with auth'd user id later

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
  const [messages, setMessages] = useState([]);
  const [mastery, setMastery] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);

  const chooseMode = (id) => { setModeId(id); if (isMobile) setNavOpen(false); };
  const chooseFocus = (id) => { setFocusId(id); if (isMobile) setNavOpen(false); };

  const t = (k) => T[k][lang];
  const masteryById = Object.fromEntries(mastery.map((m) => [m.area, m]));
  const isKA = KA.some((k) => k.id === focusId);

  useEffect(() => {
    getMastery(LEARNER_ID).then((d) => { setMastery(d.mastery); setRecommended(d.recommended); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  function onGraded(d) {
    if (d.mastery) setMastery(d.mastery);
    if (d.recommended) setRecommended(d.recommended);
  }

  async function send(textArg) {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;
    setError(null);
    const next = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const data = await postChat({ learner_id: LEARNER_ID, lang, mode: modeId, focus: focusId, project_context: projectContext, messages: next });
      setMessages([...next, { role: "assistant", content: data.reply || "…" }]);
      onGraded(data);
    } catch (e) { setError(t("err")); } finally { setLoading(false); }
  }

  function reset() { setMessages([]); setError(null); setInput(""); }
  function studyArea(area) { setFocusId(area); setModeId("quiz"); if (isMobile) setNavOpen(false); }

  const ActiveIcon = MODES.find((m) => m.id === modeId).icon;
  const recObj = recommended ? KA.find((k) => k.id === recommended.area) : null;

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
            <div style={{ color: "#9DB0C2", fontSize: 11.5 }}>{t("tagline")} · <span style={{ color: "#7E90A4" }}>Zoubir DAHIA</span></div>
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
              <div style={{ marginTop: 9, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#54657A", lineHeight: 1.6 }}>
                <span style={{ color: C.amber }}>2·24·10·12·1</span>=49 · ECO 09/07/26
              </div>
            </Section>
          </div>

          {/* Main */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, background: C.paper, minWidth: 0 }}>
            {recObj && (
              <button onClick={() => studyArea(recObj.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: `1px solid ${C.line}`, background: "#FFF7EC", border: "none", textAlign: "left", width: "100%" }}>
                <Target size={15} color={C.amber} />
                <span style={{ fontSize: 12, color: C.muted }}>{t("reco")} :</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{recObj[lang]}</span>
                <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, color: C.ink, background: C.amber, borderRadius: 14, padding: "3px 11px" }}>{t("start")}</span>
              </button>
            )}

            {modeId === "quiz" ? (
              <QuizPanel lang={lang} area={isKA ? focusId : null} learnerId={LEARNER_ID} onGraded={onGraded} t={t} />
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
                  {messages.map((m, i) => (
                    <div key={i} className="ak-fade" style={{ marginBottom: 14, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "82%", fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", padding: "10px 14px", borderRadius: 12, background: m.role === "user" ? C.ink : C.card, color: m.role === "user" ? "#EAF0F6" : C.text, border: m.role === "user" ? "none" : `1px solid ${C.line}`, borderLeft: m.role === "assistant" ? `3px solid ${C.teal}` : "none" }}>{m.content}</div>
                    </div>
                  ))}
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

function QuizPanel({ lang, area, learnerId, onGraded, t }) {
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true); setPicked(null); setRes(null); setErr(null);
    try { const d = await getQuizNext(learnerId, area); setQ(d.item); }
    catch (e) { setErr(t("err")); } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* reload on area change */ }, [area]);

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
      </div>
    </div>
  );
}

function Center({ children }) {
  return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>{children}</div>;
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

function Section({ label, children }) {
  return (
    <div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "#6E8093", marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}
