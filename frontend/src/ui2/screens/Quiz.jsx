// « Me tester » — one question, its four options, and the engine's rationale once graded.
// Three modes from the hash params: single (?area=), session (?session=1), assigned (?assigned=<id>).
// Every number shown comes from the API (quiz/next, session/next, assigned-session items, quiz/answer).
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./quiz.css";
import { getQuizNext, postQuizAnswer, getSessionNext, getAssignedSessionItems, completeAssignedSession, flagItem } from "../../api.js";
import { AREA_LABELS } from "../../pmp.js";
import { DOMAIN_SHORT, DOMAIN_CHIP, DOMAIN_BY_ID, taskOfItem, areaName, L } from "../engine.js";
import { gsap, useGsap, rise } from "../motion.js";

const AREA_IDS = Object.keys(AREA_LABELS);
const SESSION_SIZE = 10;
const letter = (i) => String.fromCharCode(65 + i);

export default function Quiz({ lang, learner, params, go, onGraded, reduced }) {
  const T = (a, b) => (lang === "en" ? b : a);
  const mode = params.assigned ? "assigned" : params.session ? "session" : "single";
  const areaParam = mode === "single" ? params.area || "" : "";

  const [status, setStatus] = useState("loading"); // loading | ready | empty | error | notyours | finished
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);     // index tapped (pending or graded)
  const [res, setRes] = useState(null);           // payload of quiz/answer, or its {error} object
  const [gradeErr, setGradeErr] = useState("");   // network error while grading
  const [flagged, setFlagged] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [servedArea, setServedArea] = useState("");   // single: `area` returned by quiz/next
  const [composition, setComposition] = useState(null); // session: {weak_priority, missed_due, maintenance}
  const [title, setTitle] = useState("");             // assigned: title of the session
  const [completion, setCompletion] = useState("");   // assigned: "ok" | "fail" after completeAssignedSession
  const [itemKey, setItemKey] = useState(0);          // bumps on every new item (motion + stale-response guard)
  const [pending, setPending] = useState(false);      // single: next question loading while the current one stays on screen
  const seq = useRef(0);
  const keyRef = useRef(0);
  const entered = useRef(false);                      // the screen entrance plays once per mount
  const whyRef = useRef(null);

  const resetAnswer = () => { setPicked(null); setRes(null); setGradeErr(""); setFlagged(false); };
  const newItem = () => { keyRef.current += 1; setItemKey(keyRef.current); };

  const load = useCallback(async () => {
    const my = ++seq.current;
    keyRef.current += 1;                     // a grade still in flight belongs to the previous item: drop it
    setStatus("loading"); setItems([]); setIdx(0); setCorrectCount(0); setCompletion("");
    setPicked(null); setRes(null); setGradeErr(""); setFlagged(false);
    try {
      let list = [];
      if (mode === "single") {
        const d = await getQuizNext(learner, areaParam || undefined);
        if (my !== seq.current) return;
        setServedArea(d.area || "");
        list = d.item ? [d.item] : [];
      } else if (mode === "session") {
        const d = await getSessionNext(learner, SESSION_SIZE);
        if (my !== seq.current) return;
        setComposition(d.composition || null);
        list = d.items || [];
      } else {
        const d = await getAssignedSessionItems(params.assigned, learner);
        if (my !== seq.current) return;
        if (d.error) { setStatus("notyours"); return; }
        setTitle(d.title || "");
        list = d.items || [];
      }
      setItems(list);
      keyRef.current += 1; setItemKey(keyRef.current);
      setStatus(list.length ? "ready" : "empty");
    } catch {
      if (my === seq.current) setStatus("error");
    }
  }, [mode, learner, areaParam, params.assigned]);
  useEffect(() => { load(); }, [load]);

  const item = items[idx] || null;
  const total = items.length;
  const task = taskOfItem(item);
  const itemArea = item ? item.knowledge_area || item.area || "" : "";
  const graded = !!res;
  const isLast = mode !== "single" && idx + 1 >= total;
  const ready = status === "ready" || status === "finished";

  // ---- motion (all skipped when `reduced`: useGsap returns before touching the DOM) ----
  const root = useGsap((el) => { if (ready && !entered.current) { entered.current = true; rise(el.querySelectorAll(".main > *")); } }, [ready], reduced);
  const optsRef = useGsap((el) => rise(el.querySelectorAll(".opt"), { stagger: .05, duration: .35 }), [itemKey], reduced);
  const gridRef = useGsap((el) => {
    if (!res) return;
    const card = el.querySelector(".qz-why");
    if (card) gsap.from(card, { x: 16, opacity: 0, duration: .4, ease: "power3.out", clearProps: "transform,opacity" });
    const ko = el.querySelector(".opt.ko");
    if (ko) gsap.fromTo(ko, { x: -5 }, { x: 0, duration: .35, ease: "elastic.out(1,.3)", clearProps: "transform" });
  }, [res], reduced);

  useEffect(() => { if (res && whyRef.current) whyRef.current.focus({ preventScroll: true }); }, [res]);

  // ---- actions ----
  async function choose(i) {
    if (!item || picked != null) return;
    const key = keyRef.current;
    setPicked(i); setGradeErr("");
    try {
      const r = await postQuizAnswer({ learner_id: learner, external_id: item.external_id, choice_index: i });
      if (key !== keyRef.current) return;
      setRes(r);
      if (r && r.error) return;              // rate_limited / unknown item: shown in the right card, nothing recorded
      if (r.correct) setCorrectCount((c) => c + 1);
      onGraded(r);
    } catch {
      if (key !== keyRef.current) return;
      setPicked(null);
      setGradeErr(T("Connexion impossible pour l'instant. Réessayez.", "No connection for now. Please try again."));
    }
  }
  async function nextSingle() {
    if (pending) return;
    const my = ++seq.current;
    keyRef.current += 1;
    setPending(true); setGradeErr("");
    try {
      const d = await getQuizNext(learner, areaParam || undefined);
      if (my !== seq.current) return;
      setServedArea(d.area || "");
      setItems(d.item ? [d.item] : []); setIdx(0); resetAnswer(); newItem();
      setStatus(d.item ? "ready" : "empty");
    } catch {
      if (my === seq.current) setGradeErr(T("Impossible de charger la question suivante pour l'instant.", "The next question could not be loaded for now."));
    } finally {
      if (my === seq.current) setPending(false);
    }
  }
  function next() {
    if (mode === "single") { nextSingle(); return; }
    if (idx + 1 >= total) {
      if (mode === "assigned") {
        completeAssignedSession(params.assigned, learner)
          .then((d) => setCompletion(d && d.ok ? "ok" : "fail"))
          .catch(() => setCompletion("fail"));
      }
      setStatus("finished");
      return;
    }
    setIdx(idx + 1); resetAnswer(); newItem();
  }
  async function doFlag() {
    if (flagged || flagging || !item) return;
    setFlagging(true);
    try { await flagItem({ learner_id: learner, external_id: item.external_id, reason: "" }); setFlagged(true); }
    catch { setGradeErr(T("Signalement impossible pour l'instant. Réessayez.", "The report could not be sent for now. Please try again.")); }
    finally { setFlagging(false); }
  }
  const restart = () => { if (mode === "assigned") go("quiz", { session: "1" }); else load(); };
  const onPickArea = (e) => { const v = e.target.value; if (v) go("quiz", { area: v }); else go("quiz"); };

  // ---- header ----
  const showItem = !!item && status === "ready";
  const topic = showItem ? (task ? L(task, lang) : areaName(itemArea, lang)) : areaParam ? areaName(areaParam, lang) : "";
  const engineChose = mode === "single" && showItem && !!servedArea && servedArea !== areaParam;
  const head = (
    <div className="hd">
      <h3>{status === "finished" ? T("Séance terminée", "Session complete") : <>{T("Me tester", "Quiz me")}{topic ? <span className="qz-topic"> · {topic}</span> : null}</>}</h3>
      <div className="row">
        {showItem && task && <span className={`chip ${DOMAIN_CHIP[task.d] || ""}`}>{L(DOMAIN_SHORT[task.d], lang)} · {task.id.toUpperCase()}</span>}
        {showItem && item.difficulty ? <span className="chip">{T("niveau", "level")} {item.difficulty}</span> : null}
        {showItem && item.pmbok_ref ? <span className="chip">{item.pmbok_ref}</span> : null}
        {engineChose && <span className="chip">{T("choisi par le moteur", "engine's choice")} · {areaName(servedArea, lang)}</span>}
        {mode === "single" && (
          <label className="qz-subj">
            <span>{T("Sujet", "Topic")}</span>
            <select value={areaParam} onChange={onPickArea}>
              <option value="">{T("Au choix du moteur", "Engine's choice")}</option>
              {AREA_IDS.map((id) => <option key={id} value={id}>{areaName(id, lang)}</option>)}
            </select>
          </label>
        )}
      </div>
    </div>
  );

  const backBtn = <button type="button" className="btn btn-g btn-s" onClick={() => go("today")}>{T("Retour à Aujourd'hui", "Back to Today")}</button>;
  const focus = itemArea || areaParam || undefined;

  // ---- non-question states ----
  if (status !== "ready" && status !== "finished") {
    let body;
    if (status === "loading") {
      body = <p className="muted">{mode === "single" ? T("Chargement de la question…", "Loading the question…") : T("Chargement de la séance…", "Loading the session…")}</p>;
    } else if (status === "error") {
      body = <>
        <p className="err">{T("Impossible de charger la question pour l'instant.", "The question could not be loaded for now.")}</p>
        <div className="row"><button type="button" className="btn btn-p btn-s" onClick={load}>{T("Réessayer", "Try again")}</button>{backBtn}</div>
      </>;
    } else if (status === "notyours") {
      body = <>
        <p>{T("Cette séance ne vous est pas assignée, ou n'existe plus.", "This session is not assigned to you, or no longer exists.")}</p>
        <div className="row">{backBtn}</div>
      </>;
    } else if (mode === "single") {
      body = <>
        <p>{T("Pas encore de questions pour ce sujet. Essayez un autre sujet, ou les modes Expliquer / Cas d'examen.", "No questions yet for this topic. Try another topic, or the Explain / Exam scenario modes.")}</p>
        <div className="row">
          {areaParam && <button type="button" className="btn btn-p btn-s" onClick={() => go("quiz")}>{T("Au choix du moteur", "Engine's choice")}</button>}
          <button type="button" className="btn btn-g btn-s" onClick={() => go("explain", { focus })}>{T("Expliquer", "Explain")}</button>
          <button type="button" className="btn btn-g btn-s" onClick={() => go("scenario", { focus })}>{T("Cas d'examen", "Exam scenario")}</button>
          {!areaParam && backBtn}
        </div>
      </>;
    } else {
      body = <>
        <p>{mode === "session" ? T("Aucune question disponible pour une séance.", "No question available for a session.") : T("Cette séance ne contient aucune question.", "This session contains no question.")}</p>
        <div className="row">{backBtn}</div>
      </>;
    }
    return (
      <div className="main qz" ref={root}>
        {head}
        <div className="card qz-state" aria-live="polite">{body}</div>
      </div>
    );
  }

  // ---- finished (session / assigned) ----
  if (status === "finished") {
    return (
      <div className="main qz" ref={root}>
        {head}
        <div className="card qz-done">
          {mode === "assigned" && <span className="eyebrow">{T("Assignée par votre formateur", "Assigned by your trainer")}{title ? ` · ${title}` : ""}</span>}
          <span className="k">{T("Cette séance", "This session")}</span>
          <div className="big">{correctCount}/{total}<small>{T("bonnes réponses", "correct answers")}</small></div>
          {mode === "assigned" && completion === "ok" && <p className="muted">{T("Séance marquée comme terminée.", "Session marked as completed.")}</p>}
          {mode === "assigned" && completion === "fail" && <p className="err">{T("La fin de séance n'a pas pu être enregistrée.", "The end of the session could not be recorded.")}</p>}
          <div className="row">
            {backBtn}
            <button type="button" className="btn btn-p btn-s" onClick={restart}>{T("Nouvelle séance", "New session")} →</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- the question ----
  const opts = (item.options && (item.options[lang] || item.options.fr)) || [];
  const progressLabel = mode === "single" ? T("Question", "Question") : `${T("Question", "Question")} ${idx + 1} ${T("sur", "of")} ${total}`;
  const done = idx + (graded ? 1 : 0);
  const comp = composition || {};
  const compChips = mode === "session" ? [
    [comp.weak_priority, "ko", T("leviers prioritaires", "priority levers")],
    [comp.missed_due, "mid", T("à retravailler", "to review")],
    [comp.maintenance, "", T("entretien", "maintenance")],
  ].filter(([n]) => n > 0) : [];
  const ecoLine = task
    ? ["ECO 2026", L(DOMAIN_BY_ID[task.d], lang), L(task, lang), item.pmbok_ref].filter(Boolean).join(" · ")
    : ["ECO 2026", areaName(itemArea, lang)].join(" · ");
  const nextLabel = isLast ? T("Terminer la séance", "Finish the session") : `${T("Question suivante", "Next question")} →`;

  return (
    <div className="main qz" ref={root}>
      {head}
      {mode !== "single" && (
        <div className="qz-prog">
          {mode === "assigned" && <div className="qz-assign"><span className="eyebrow">{T("Assignée par votre formateur", "Assigned by your trainer")}</span>{title && <strong>{title}</strong>}</div>}
          <div className="qz-bar">
            <span className="mono">{done} / {total}</span>
            <div className="bar2" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={progressLabel}><i style={{ width: `${Math.round((done / total) * 100)}%` }} /></div>
          </div>
          {compChips.length > 0 && <div className="row">{compChips.map(([n, cls, txt]) => <span key={txt} className={`chip ${cls}`}>{n} × {txt}</span>)}</div>}
        </div>
      )}
      <div className="g21" ref={gridRef}>
        <div className="qz-left">
          <div className="msg">
            <span className="sp">{progressLabel}</span>
            <p className="qz-stem">{L(item.prompt, lang)}</p>
          </div>
          <div className="qz-opts" key={itemKey} ref={optsRef}>
            {opts.map((o, i) => {
              const ok = graded && !res.error && i === res.answer_index;
              const ko = graded && !res.error && i === picked && !res.correct;
              const wait = !graded && picked === i;
              return (
                <button type="button" key={i} className={`opt${ok ? " ok" : ""}${ko ? " ko" : ""}${wait ? " wait" : ""}`} disabled={picked != null} onClick={() => choose(i)}>
                  <b>{letter(i)}</b><span className="txt">{o}</span>
                  {ok && <><span className="mark" aria-hidden="true">✓</span><span className="sr-only">{T("bonne réponse", "correct answer")}</span></>}
                  {ko && <span className="chip ko">{T("votre choix", "your choice")}</span>}
                </button>
              );
            })}
          </div>
          {gradeErr && <p className="err" role="alert">{gradeErr}</p>}
          <div className="qz-foot">
            <button type="button" className="link" disabled={flagged || flagging} onClick={doFlag}>{flagged ? T("✓ Signalé — merci", "✓ Reported — thank you") : T("⚑ Signaler cette question", "⚑ Report this question")}</button>
          </div>
        </div>
        <div className="qz-right">
          {!graded ? (
            <div className="card qz-hint"><p className="muted">{T("Choisissez une réponse : la justification apparaît ici.", "Choose an answer: the rationale appears here.")}</p></div>
          ) : res.error ? (
            <div className="card dark qz-why" aria-live="polite" tabIndex={-1} ref={whyRef}>
              <span className="k">{T("Réponse non enregistrée", "Answer not recorded")}</span>
              <p className="qz-verdict">{res.error === "rate_limited" ? T("Limite du jour atteinte.", "Daily limit reached.") : T("Question inconnue.", "Unknown question.")}</p>
              <p className="qz-rationale">{res.error === "rate_limited"
                ? (lang === "en" ? res.message_en : res.message_fr) || ""
                : T("Cette question n'est plus dans la banque. Passez à la suivante.", "This question is no longer in the bank. Move on to the next one.")}</p>
              <div className="row">
                {backBtn}
                <button type="button" className="btn btn-p btn-s" onClick={next} disabled={pending}>{nextLabel}</button>
              </div>
            </div>
          ) : (
            <div className="card dark qz-why" aria-live="polite" tabIndex={-1} ref={whyRef}>
              <span className="k">{T("Pourquoi", "Why")}</span>
              <p className={`qz-verdict ${res.correct ? "good" : "bad"}`}>{res.correct ? T("Bonne réponse.", "Correct.") : T("Pas tout à fait.", "Not quite.")}</p>
              <p className="qz-rationale">{L(res.rationale, lang)}</p>
              <span className="chip wrap">{ecoLine}</span>
              <div className="row">
                <button type="button" className="btn btn-g btn-s" onClick={() => go("explain", { focus })}>{T("Expliquer ce point", "Explain this point")}</button>
                <button type="button" className="btn btn-g btn-s" onClick={() => go("scenario", { focus })}>{T("Cas d'examen", "Exam scenario")}</button>
                <button type="button" className="btn btn-p btn-s" onClick={next} disabled={pending}>{pending ? T("Chargement…", "Loading…") : nextLabel}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
