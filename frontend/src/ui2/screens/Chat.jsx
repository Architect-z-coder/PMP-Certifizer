// Écran « Chat » de l'interface Chantier (ui2) : le PORT de la conversation de l'interface actuelle (App.jsx, `send()`),
// piloté par `mode` = la route (« explain » · « scenario » · « relate » · « coreflexion »). Même charge utile vers postChat.
// Rien n'est inventé : la réponse vient de postChat(), les réflexes de getReflexes(). Aucun nombre n'est calculé ici,
// hormis le compte des réflexes renvoyés par l'API.
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./chat.css";
import { deleteReflexe, getReflexes, postChat, saveReflexe } from "../../api.js";
import { BE_AREAS, FOCUS, LENS, PEOPLE_AREAS, PR_AREAS } from "../../pmp.js";
import { DOMAIN_BY_ID, L, areaName } from "../engine.js";
import { gsap, rise, useGsap } from "../motion.js";

const PROJECT_KEY = "cz_ui2_project";
const REFLEX_RE = /⟡\s*R[ée]flexe\s*:\s*(.+)/i;
const DEFAULT_FOCUS = "overview";
const DEFAULT_LENS = "moa";
const CASE_EXCERPT_MAX = 180;

const MODES = {
  explain: { fr: "Expliquer", en: "Explain" },
  scenario: { fr: "Cas d'examen", en: "Exam scenario" },
  relate: { fr: "Relier à mon projet", en: "Relate to my work" },
  coreflexion: { fr: "Cas réel · co-réflexion", en: "Real case · co-reflection" },
};
/** Vouvoiement starters (the STARTERS of pmp.js are tutoiement: not reused). */
const STARTER = {
  explain: { fr: "Expliquez-moi ce sujet simplement, avec un exemple.", en: "Explain this topic to me simply, with an example." },
  scenario: { fr: "Donnez-moi un cas concret de type examen.", en: "Give me a concrete exam-style case." },
  relate: { fr: "Comment ce concept s'applique-t-il à mon projet ?", en: "How does this concept apply to my project?" },
  coreflexion: { fr: "Voici mon cas : réfléchissons-le ensemble.", en: "Here is my case: let us think it through together." },
};
const EMPTY_HINT = {
  explain: { fr: "Choisissez un sujet, puis posez votre question — ou partez de la suggestion.", en: "Choose a subject, then ask your question — or start from the suggestion." },
  scenario: { fr: "Choisissez un sujet : vous recevrez une situation à trancher, comme à l'examen.", en: "Choose a subject: you will get a situation to decide, as in the exam." },
  relate: { fr: "Décrivez votre projet dans « Mon projet », choisissez un sujet, puis posez votre question.", en: "Describe your project in “My project”, choose a subject, then ask your question." },
  coreflexion: { fr: "Décrivez votre cas dans « Mon projet », choisissez un siège, puis lancez la réflexion.", en: "Describe your case in “My project”, choose a seat, then start the reflection." },
};
/** Vouvoiement seat descriptions (LENS.dFr / dEn of pmp.js are tutoiement: not reused). */
const SEAT_DESC = {
  moa: { fr: "Vous possédez l'actif, le budget, la valeur.", en: "You own the asset, the budget, the value." },
  moe: { fr: "Vous portez l'exécution et le contrat.", en: "You carry execution and the contract." },
  both: { fr: "Comparez les deux sièges côte à côte.", en: "Compare both seats side by side." },
};
/** Seat → chip class of chantier.css (moa = process, moe = business, both = people): same hues as LENS[].c, through the tokens. */
const SEAT_CHIP = { moa: "pr", moe: "bz", both: "pe" };
const ERR_NET = { fr: "Connexion impossible pour l'instant. Réessayez.", en: "Connection is not possible right now. Please try again." };
const ECO_GROUPS = [["people", PEOPLE_AREAS], ["process", PR_AREAS], ["biz", BE_AREAS]];
const KNOWN_FOCUS = new Set([...FOCUS.map((f) => f.id), ...PEOPLE_AREAS, ...PR_AREAS, ...BE_AREAS]);

const readLS = (k) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const writeLS = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* private mode */ } };

/** « ⟡ Réflexe : … » in an assistant reply → the reflex text (same rule as the current interface). */
function extractReflexe(content) {
  const m = REFLEX_RE.exec(content || "");
  return m ? m[1].trim().replace(/^[«"]\s*/, "").replace(/\s*[»"]$/, "") : null;
}
function focusLabel(id, lang) {
  const f = FOCUS.find((x) => x.id === id);
  return f ? L(f, lang) : areaName(id, lang);
}

export default function Chat({ lang, learner, params, onGraded, reduced, mode }) {
  const T = (a, b) => (lang === "en" ? b : a);
  const kind = MODES[mode] ? mode : "explain";
  const withProject = kind === "relate" || kind === "coreflexion";
  const isCase = kind === "coreflexion";
  const paramFocus = (params && params.focus) || "";

  const [focus, setFocus] = useState(paramFocus || DEFAULT_FOCUS);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);          // null | {fr, en}
  const [projectContext, setProjectContext] = useState(() => readLS(PROJECT_KEY));
  const [lens, setLens] = useState(DEFAULT_LENS);
  const [reflexes, setReflexes] = useState(null);    // coreflexion: null = loading, then the API list
  const [refErr, setRefErr] = useState(false);
  const [busyRef, setBusyRef] = useState(false);
  const conv = useRef(null);
  const inputRef = useRef(null);
  const prevCount = useRef(0);

  // the quiz's « Expliquer ce point » lands on the right subject, also when only the query changes
  useEffect(() => { if (paramFocus) setFocus(paramFocus); }, [paramFocus]);
  useEffect(() => { writeLS(PROJECT_KEY, projectContext); }, [projectContext]);

  const loadReflexes = useCallback(() => {
    if (!isCase || !learner) return Promise.resolve();
    return getReflexes(learner)
      .then((r) => { setReflexes(Array.isArray(r) ? r : []); setRefErr(false); })
      .catch(() => { setReflexes((cur) => cur || []); setRefErr(true); });
  }, [isCase, learner]);
  useEffect(() => { loadReflexes(); }, [loadReflexes]);

  // keep the end of the conversation in view (the container on desktop, the page on mobile)
  useEffect(() => {
    const el = conv.current;
    if (!el || (!messages.length && !loading)) return;
    el.scrollTop = el.scrollHeight;
    const end = el.querySelector(".chat-end");
    if (end && end.scrollIntoView) end.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [messages, loading]);

  // motion: a new message rises (skipped with reduced motion); entrance rise of the screen blocks
  useLayoutEffect(() => {
    const n = messages.length, grew = n > prevCount.current;
    prevCount.current = n;
    if (!grew || reduced || !conv.current) return;
    const all = conv.current.querySelectorAll(".msg");
    const last = all[all.length - 1];
    if (last) gsap.from(last, { y: 8, opacity: 0, duration: .3, ease: "power2.out", clearProps: "transform,opacity" });
  }, [messages, reduced]);
  const root = useGsap((el) => rise(el.querySelectorAll(".main > *")), [], reduced);

  const send = useCallback(async (textArg) => {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;
    setError(null);
    const next = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const data = await postChat({ learner_id: learner, lang, mode: kind, focus, project_context: projectContext, lens, messages: next });
      if (data && data.error) { setError(data.message_fr || data.message_en ? { fr: data.message_fr || data.message_en, en: data.message_en || data.message_fr } : ERR_NET); return; }
      setMessages([...next, { role: "assistant", content: (data && data.reply) || "…" }]);
      if (onGraded) onGraded(data);
    } catch { setError(ERR_NET); } finally { setLoading(false); }
  }, [input, loading, messages, learner, lang, kind, focus, withProject, projectContext, isCase, lens, onGraded]);

  const reset = () => { setMessages([]); setError(null); setInput(""); if (inputRef.current) inputRef.current.focus(); };
  const pickLens = (id) => { if (id === lens) return; setLens(id); if (messages.length) reset(); };
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey && !(e.nativeEvent && e.nativeEvent.isComposing)) { e.preventDefault(); send(); } };

  const savedTexts = useMemo(() => new Set((reflexes || []).map((r) => r.text)), [reflexes]);
  const doSave = (text) => {
    if (busyRef) return;
    setBusyRef(true);
    saveReflexe({ learner_id: learner, seat: lens, text, case_excerpt: projectContext.slice(0, CASE_EXCERPT_MAX) })
      .then(() => loadReflexes()).catch(() => setRefErr(true)).finally(() => setBusyRef(false));
  };
  const doDelete = (id) => { deleteReflexe(id, learner).then(() => loadReflexes()).catch(() => setRefErr(true)); };

  const lensObj = LENS.find((l) => l.id === lens) || LENS[0];
  const extraFocus = paramFocus && !KNOWN_FOCUS.has(paramFocus) ? paramFocus : "";
  const refCount = reflexes ? reflexes.length : null;
  const delLabel = T("Supprimer", "Delete");

  return (
    <div className="main chat" ref={root}>
      <div className="hd">
        <h3>{L(MODES[kind], lang)}</h3>
        <div className="row">
          <span className="chip wrap">{T("Sujet : ", "Subject: ")}{focusLabel(focus, lang)}</span>
          {isCase && <span className={`chip wrap ${SEAT_CHIP[lens] || ""}`}>{T("Siège : ", "Seat: ")}{L(lensObj, lang)}</span>}
        </div>
      </div>

      <div className="g21 chat-grid">
        <aside className="side">
          <div className="card">
            <label className="k" htmlFor="chat-focus">{T("Sujet", "Subject")}</label>
            <select id="chat-focus" className="field" value={focus} onChange={(e) => setFocus(e.target.value)}>
              {extraFocus && <option value={extraFocus}>{areaName(extraFocus, lang)}</option>}
              <optgroup label={T("Sujets", "Subjects")}>
                {FOCUS.map((f) => <option key={f.id} value={f.id}>{f.code} · {L(f, lang)}</option>)}
              </optgroup>
              {ECO_GROUPS.map(([d, ids]) => (
                <optgroup key={d} label={`ECO 2026 · ${L(DOMAIN_BY_ID[d], lang)}`}>
                  {ids.map((id) => <option key={id} value={id}>{areaName(id, lang)}</option>)}
                </optgroup>
              ))}
            </select>
            <p className="muted hint">{T("Le sujet oriente la réponse ; changez-le à tout moment.", "The subject steers the answer; change it at any time.")}</p>
          </div>

          {withProject && (
            <div className="card">
              <label className="k" htmlFor="chat-project">{isCase ? T("Votre cas", "Your case") : T("Mon projet", "My project")}</label>
              <textarea id="chat-project" className="field" rows={5} value={projectContext} onChange={(e) => setProjectContext(e.target.value)}
                placeholder={isCase ? T("Décrivez votre situation réelle : contexte projet, contrainte, décision en jeu…", "Describe your real situation: project context, constraint, decision at stake…") : T("Ex : réhabilitation d'une station de pompage, équipe de 8…", "e.g. pumping-station overhaul, team of 8…")} />
              {isCase && <p className="muted hint">{T("Partagé avec « Relier à mon projet ».", "Shared with “Relate to my work”.")}</p>}
              <p className="muted hint">{T("Ne collez pas de document confidentiel : ce texte est envoyé à l'IA.", "Do not paste a confidential document: this text is sent to the AI.")}</p>
            </div>
          )}

          {isCase && (
            <div className="card">
              <span className="k" id="chat-seat">{T("Depuis quel siège ?", "From which seat?")}</span>
              <div className="seats" role="group" aria-labelledby="chat-seat">
                {LENS.map((l) => (
                  <button type="button" key={l.id} className={`seat seat-${l.id}`} aria-pressed={lens === l.id} onClick={() => pickLens(l.id)}>
                    <span className="row"><span className="dot" aria-hidden="true" /><b>{L(l, lang)}</b></span>
                    <span className="muted">{L(SEAT_DESC[l.id], lang)}</span>
                  </button>
                ))}
              </div>
              {messages.length > 0 && <p className="muted hint">{T("Changer de siège repart d'une conversation vide.", "Changing seat starts from an empty conversation.")}</p>}
            </div>
          )}

          {isCase && (
            <div className="card refl">
              <span className="k">{T("Mes réflexes", "My reflexes")}{refCount != null ? ` · ${refCount}` : ""}</span>
              {reflexes === null && !refErr && <p className="muted">{T("Chargement…", "Loading…")}</p>}
              {refErr && <p className="err">{T("Réflexes indisponibles pour l'instant.", "Reflexes are unavailable right now.")}</p>}
              {reflexes && reflexes.length === 0 && !refErr && <p className="muted">{T("Les réflexes que vous sauvez depuis un cas s'accumulent ici.", "The reflexes you save from a case gather here.")}</p>}
              {reflexes && reflexes.length > 0 && (
                <div className="list">
                  {reflexes.map((r) => (
                    <div key={r.id}>
                      <div className="l"><span className={`dot seat-${SEAT_CHIP[r.seat] ? r.seat : "none"}`} aria-hidden="true" /><span>{r.text}</span></div>
                      <button type="button" className="del" aria-label={delLabel} title={delLabel} onClick={() => doDelete(r.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        <section className="conv-col" aria-label={T("Conversation", "Conversation")}>
          <div className="conv" ref={conv} role="log" aria-live="polite">
            {messages.length === 0 && !loading && (
              <div className="chat-empty">
                <span className="k">{T("Pour commencer", "To begin")}</span>
                <p className="muted">{L(EMPTY_HINT[kind], lang)}</p>
                <button type="button" className="btn btn-g" onClick={() => send(L(STARTER[kind], lang))}>{L(STARTER[kind], lang)}</button>
              </div>
            )}
            {messages.map((m, i) => {
              const mine = m.role === "user";
              const ref = !mine && isCase ? extractReflexe(m.content) : null;
              const saved = ref ? savedTexts.has(ref) : false;
              return (
                <div className={`msg${mine ? " me" : ""}`} key={i}>
                  <span className="sp">{mine ? T("Vous", "You") : "Certifizer"}</span>
                  <p>{m.content}</p>
                  {ref && (
                    <div className="row">
                      <button type="button" className="btn btn-g btn-s" disabled={saved || busyRef} onClick={() => doSave(ref)}>
                        {saved ? T("✓ Sauvé", "✓ Saved") : T("＋ Sauver dans mes réflexes", "＋ Save to my reflexes")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {loading && <span className="live"><i aria-hidden="true" />{T("Réflexion…", "Thinking…")}</span>}
            {error && <p className="err" role="alert">{L(error, lang)}</p>}
            <div className="chat-end" aria-hidden="true" />
          </div>

          <form className="ask" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <label className="sr-only" htmlFor="chat-input">{T("Votre question", "Your question")}</label>
            <textarea id="chat-input" ref={inputRef} className="field" rows={2} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
              placeholder={T("Posez votre question…", "Ask your question…")} />
            <button type="submit" className="btn btn-p" disabled={loading || !input.trim()}>{T("Envoyer", "Send")}</button>
            {messages.length > 0 && <button type="button" className="link" onClick={reset}>{T("Nouvelle conversation", "New conversation")}</button>}
          </form>
        </section>
      </div>
    </div>
  );
}
