// Écran « Aujourd'hui » de l'interface Chantier (ui2) : une seule chose à faire maintenant, et pourquoi.
// Données : `readiness` (prop, chargé par App2) + trois appels propres à l'écran (getSessionNext, getAssignedSessions,
// getMissed). Rien n'est inventé : chaque nombre vient d'un champ de l'API ; les paliers (50 · 70 · 85) et les
// intervalles de révision (1 · 3 · 7 jours) sont les constantes du moteur (backend/app/mastery.py).
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./today.css";
import { getAssignedSessions, getMissed, getSessionNext } from "../../api.js";
import { ALL_TASKS, DOMAIN_BY_ID, DOMAIN_CHIP, DOMAIN_OF_KEY, L, areaName, pct } from "../engine.js";
import { gsap, rise, useGsap } from "../motion.js";

/** The three ECO domains, in the order /api/readiness `domains` names them. */
const DOMAIN_KEYS = ["people", "process", "business"];
const MISSED_SHOWN = 5;
const SESSION_SIZE = 10;

/** The five steps of the mock-up's « Comment une réponse change la suite » strip (static, no weighting claim). */
const STEPS = [
  { fr: ["Preuve", "Réponse fausse, justification lue"], en: ["Evidence", "Wrong answer, rationale read"] },
  { fr: ["Activité ciblée", "Scène ou cas réel sur ce point précis"], en: ["Targeted activity", "Scene or real case on that exact point"] },
  { fr: ["Vérification", "Autre question, plus tard, sans aide"], en: ["Check", "Another question, later, unaided"] },
  { fr: ["Preuve projet", "Un exemple de votre projet"], en: ["Project evidence", "An example from your project"] },
  { fr: ["Suivi formateur", "Validation humaine"], en: ["Trainer follow-up", "Human validation"] },
];

/** One API call with its own loading / error state. A response that arrives after the learner changed
 *  (or after unmount) is ignored. `load` re-calls it (the « réessayer » button). */
function useLoad(loader, deps) {
  const [st, setSt] = useState({ data: null, loading: true, error: false });
  const seq = useRef(0);
  const load = useCallback(() => {
    const id = ++seq.current;
    setSt({ data: null, loading: true, error: false });
    loader()
      .then((d) => { if (id === seq.current) setSt({ data: d, loading: false, error: false }); })
      .catch(() => { if (id === seq.current) setSt({ data: null, loading: false, error: true }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); return () => { seq.current++; }; }, [load]);
  return [st, load];
}

function Retry({ lang, onClick }) {
  return (
    <div className="row">
      <button type="button" className="btn btn-g" onClick={onClick}>
        {lang === "en" ? "The server is waking up — retry" : "Le serveur se réveille — réessayer"}
      </button>
    </div>
  );
}

const plural = (n, one, many) => (n > 1 ? many : one);

export default function Today({ lang, learner, learnerName, readiness, go, reduced }) {
  const T = (fr, en) => (lang === "en" ? en : fr);
  const loading = T("Chargement…", "Loading…");

  const [session, loadSession] = useLoad(() => getSessionNext(learner, SESSION_SIZE), [learner]);
  const [assigned, loadAssigned] = useLoad(() => getAssignedSessions(learner), [learner]);
  const [missed, loadMissed] = useLoad(() => getMissed(learner, true), [learner]);

  // --- readiness (prop): null = loading, never zero ---
  const R = readiness && readiness.readiness ? readiness.readiness : null;
  const ready = !!R;
  const score = R ? pct(R.score) : 0;
  const domains = (R && R.domains) || {};
  const covered = DOMAIN_KEYS.reduce((a, k) => a + ((domains[k] && domains[k].covered_tasks) || 0), 0);
  const taskTotal = DOMAIN_KEYS.reduce((a, k) => a + ((domains[k] && domains[k].task_count) || 0), 0) || ALL_TASKS.length;
  const lever = readiness && Array.isArray(readiness.top_levers) && readiness.top_levers.length ? readiness.top_levers[0] : null;
  const leverDom = lever ? DOMAIN_OF_KEY[lever.domain] : null;

  // --- the three calls ---
  const items = session.data && Array.isArray(session.data.items) ? session.data.items : [];
  const comp = (session.data && session.data.composition) || {};
  const pending = Array.isArray(assigned.data) ? assigned.data.filter((a) => a.status !== "completed") : [];
  const due = missed.data && Array.isArray(missed.data.items) ? missed.data.items : [];
  const dueCount = missed.data ? (typeof missed.data.count === "number" ? missed.data.count : due.length) : 0;

  // --- motion: one entrance once readiness is loaded; the index bar and number grow; domain bars stagger ---
  const numRef = useRef(null);
  const scoreRef = useRef(score); scoreRef.current = score;
  const root = useGsap((el) => {
    if (!ready) return;
    rise(el.querySelectorAll(".main > *"));
    const bar = el.querySelector(".idx .bar2 i");
    if (bar) gsap.from(bar, { width: "0%", duration: 1.2, ease: "power2.inOut" });
    const n = numRef.current;
    if (n) {
      const o = { v: 0 };
      gsap.to(o, { v: score, duration: 1.2, ease: "power2.inOut", onUpdate: () => { n.textContent = String(Math.round(o.v)); }, onComplete: () => { n.textContent = String(scoreRef.current); } });
    }
    const bars = el.querySelectorAll(".dom .bar2 i");
    if (bars.length) gsap.from(bars, { width: "0%", duration: .9, stagger: .12, delay: .25, ease: "power2.inOut" });
  }, [ready], reduced);

  const hello = learnerName ? T(`Bonjour, ${learnerName}. Voici votre journée.`, `Hello, ${learnerName}. Here is your day.`) : T("Bonjour. Voici votre journée.", "Hello. Here is your day.");

  return (
    <div className="main today" ref={root}>
      <div className="hd">
        <h3>{hello}</h3>
        <div className="row"><span className="chip">ECO 2026 · {Object.keys(DOMAIN_BY_ID).length} {T("domaines", "domains")} · {ALL_TASKS.length} {T("tâches", "tasks")}</span></div>
      </div>

      <div className="g2">
        {/* 1 · Indice de préparation */}
        <section className="card idx" aria-labelledby="t-idx">
          <span className="k" id="t-idx">{T("Indice de préparation", "Readiness index")}</span>
          {!ready ? <p className="muted">{loading}</p> : (
            <>
              <div className="big">
                <span ref={numRef}>{score}</span>
                <small>
                  {T("sur 100", "out of 100")} · {L(R.label, lang)} · {T("tâches couvertes : ", "tasks covered: ")}{covered} / {taskTotal}{" "}
                  <span className="soon">{T("intervalle : bientôt", "range: soon")}</span>
                </small>
              </div>
              <div className="bar2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={T("Indice de préparation sur 100", "Readiness index out of 100")}>
                <i style={{ width: `${score}%` }} />
              </div>
              {score === 0 && covered === 0 && <p className="noev">{T("Aucune preuve pour l'instant : répondez à quelques questions.", "No evidence yet: answer a few questions.")}</p>}
              <p className="muted thr">{T("Paliers : 50 en construction · 70 presque prêt·e · 85 prêt·e pour l'examen. Une tâche jamais travaillée compte pour zéro.", "Thresholds: 50 building · 70 close · 85 exam-ready. A task never worked on counts as zero.")}</p>
            </>
          )}
        </section>

        {/* 2 · À faire maintenant */}
        <section className="card acc now" aria-labelledby="t-now">
          <span className="k" id="t-now">{T("À faire maintenant", "Do now")}</span>
          {session.error ? <Retry lang={lang} onClick={loadSession} /> : (
            <>
              {session.loading ? <p className="muted">{loading}</p> : items.length === 0
                ? <h4>{T("Aucune question disponible pour l'instant.", "No question available for now.")}</h4>
                : <h4>{items.length} {plural(items.length, T("question, composée pour vous", "question, composed for you"), T("questions, composées pour vous", "questions, composed for you"))}</h4>}
              {(comp.weak_priority > 0 || comp.missed_due > 0 || comp.maintenance > 0) && (
                <div className="row">
                  {comp.weak_priority > 0 && <span className="chip acc">{comp.weak_priority} × {T("leviers prioritaires", "priority levers")}</span>}
                  {comp.missed_due > 0 && <span className="chip">{comp.missed_due} × {T("à retravailler", "to rework")}</span>}
                  {comp.maintenance > 0 && <span className="chip">{comp.maintenance} × {T("entretien", "maintenance")}</span>}
                </div>
              )}
              {lever && (
                <p className="lever">
                  <span className="muted">{T("Priorité du moteur :", "Engine priority:")}</span> <b>{L(lever, lang)}</b>{" "}
                  {leverDom && DOMAIN_BY_ID[leverDom] && <span className={`chip ${DOMAIN_CHIP[leverDom]}`}>{L(DOMAIN_BY_ID[leverDom], lang)}</span>}
                </p>
              )}
              <div className="row">
                <button type="button" className="btn btn-p" disabled={session.loading || items.length === 0} onClick={() => go("quiz", { session: "1" })}>
                  {T("Lancer ma séance", "Start my session")} →
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Trainer-assigned sessions (only the pending ones) */}
      {assigned.loading && <p className="muted mono asgl">{T("Séances assignées par votre formateur : chargement…", "Sessions assigned by your trainer: loading…")}</p>}
      {assigned.error && (
        <div className="card flat">
          <span className="k">{T("Séances assignées par votre formateur", "Sessions assigned by your trainer")}</span>
          <Retry lang={lang} onClick={loadAssigned} />
        </div>
      )}
      {pending.length > 0 && (
        <div className="g2">
          {pending.map((a) => (
            <section className="card asg" key={a.assignment_id}>
              <span className="eyebrow">{T("Assignée par votre formateur", "Assigned by your trainer")}</span>
              <h4>{a.title}</h4>
              <p className="muted mono">{a.question_count} {plural(a.question_count, "question", "questions")}{a.status === "started" ? T(" · en cours", " · in progress") : ""}</p>
              <div className="row">
                <button type="button" className="btn btn-d" onClick={() => go("quiz", { assigned: String(a.assignment_id) })}>
                  {a.status === "started" ? T("Reprendre", "Resume") : T("Commencer", "Start")} →
                </button>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Où vous en êtes : the three domains of /api/readiness */}
      <section className="card flat where" aria-labelledby="t-where">
        <div className="khd">
          <span className="k" id="t-where">{T("Où vous en êtes", "Where you stand")}</span>
          <button type="button" className="link" onClick={() => go("map")}>{T("Voir la carte", "See the map")} →</button>
        </div>
        {!ready ? <p className="muted">{loading}</p> : (
          <div className="g3">
            {DOMAIN_KEYS.map((key) => {
              const d = domains[key] || {};
              const pid = DOMAIN_OF_KEY[key];
              const dom = DOMAIN_BY_ID[pid] || {};
              const s = pct(d.score);
              return (
                <div className={`card dom dom-${pid}`} key={key}>
                  <div className="khd">
                    <b className="nm">{L(dom, lang)}</b>
                    <span className="mono muted">{Math.round((d.weight || 0) * 100)} % {T("de l'examen", "of the exam")}</span>
                  </div>
                  <div className="n">{s} %</div>
                  <div className="bar2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s} aria-label={L(dom, lang)}>
                    <i style={{ width: `${s}%` }} />
                  </div>
                  {d.coverage && <span className="mono muted">{d.coverage} {T("tâches couvertes", "tasks covered")}</span>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Apprentissage adaptatif de vos erreurs : /api/missed, due now */}
      <section className="card miss" aria-labelledby="t-miss">
        <div className="khd">
          <span className="k" id="t-miss">{T("Apprentissage adaptatif de vos erreurs", "Adaptive learning from your mistakes")}</span>
          {missed.data && dueCount > 0 && <span className="chip acc">{dueCount} {T("à revoir maintenant", "to review now")}</span>}
        </div>
        {missed.loading ? <p className="muted">{loading}</p> : missed.error ? <Retry lang={lang} onClick={loadMissed} /> : due.length === 0
          ? <p className="muted">{T("Aucune question à revoir maintenant.", "No question to review right now.")}</p>
          : (
            <>
              <div className="list">
                {due.slice(0, MISSED_SHOWN).map((m) => {
                  const prompt = m.prompt ? L(m.prompt, lang) : "";
                  const area = areaName(m.knowledge_area, lang);
                  return (
                    <div key={m.item_external_id}>
                      <div className="l"><span className="q">{prompt || area}</span></div>
                      <span className="chip">{area}</span>
                      <span className="mono muted">{m.miss_count} {plural(m.miss_count, T("erreur", "mistake"), T("erreurs", "mistakes"))} · {T("à revoir maintenant", "review now")}</span>
                    </div>
                  );
                })}
              </div>
              {dueCount > MISSED_SHOWN && <p className="mono muted">+ {dueCount - MISSED_SHOWN} {T("autres à revoir maintenant", "more to review now")}</p>}
            </>
          )}
        {!missed.loading && !missed.error && (
          <p className="muted thr">{T("Une erreur revient 1, 3 puis 7 jours après, jusqu'à être retenue.", "A mistake comes back 1, 3 then 7 days later, until it is retained.")}</p>
        )}
        {!missed.loading && !missed.error && dueCount > 0 && (
          <div className="row">
            <button type="button" className="btn btn-g" onClick={() => go("quiz", { session: "1" })}>{T("Les retravailler dans ma séance", "Rework them in my session")} →</button>
          </div>
        )}
      </section>

      {/* Comment une réponse change la suite : static strip of the mock-up */}
      <section className="card flat how" aria-labelledby="t-how">
        <span className="k" id="t-how">{T("Comment une réponse change la suite", "How one answer changes what comes next")}</span>
        <div className="flow">
          {STEPS.map((s, i) => (
            <div className={i === 0 ? "on" : ""} key={s.fr[0]}>
              <b>{i + 1} · {T(s.fr[0], s.en[0])}</b>
              {T(s.fr[1], s.en[1])}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
