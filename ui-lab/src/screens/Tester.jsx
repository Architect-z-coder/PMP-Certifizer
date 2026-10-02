import React, { useState } from 'react'
import { Check, X, Flag, ArrowRight, AlertTriangle, HelpCircle } from 'lucide-react'
import { QUESTION, TASKS, DOMAINS, MASTERY } from '../data.js'
import { Callout, Skeleton, Empty, Seg, pct, Meter } from '../ui.jsx'

export default function Tester({ state }) {
  const [picked, setPicked] = useState(null)
  const [focus, setFocus] = useState('BE4')
  const task = TASKS.find(t => t.id === focus) || TASKS[21]
  const graded = state === 'Corrigée' || state === 'Signalée'
  const m = MASTERY.find(x => x.id === task.id)
  return (
    <div className="page">
      <div className="page-head"><div><div className="label">Me tester</div><h1>Pratique libre.</h1></div></div>
      <div className="grid-main">
        <div className="stack">
          {state === 'Chargement' && <div className="card stack-sm" aria-busy="true"><Skeleton h={18} w="40%" /><Skeleton h={28} /><Skeleton h={28} w="90%" /><Skeleton h={56} /><Skeleton h={56} /><Skeleton h={56} /></div>}
          {state === 'Erreur' && <Callout kind="warm" icon={AlertTriangle}>Connexion impossible. Le serveur se réveille peut-être ; réessayez dans quelques secondes. <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 8 }}>Réessayer</button></Callout>}
          {state === 'Aucune question' && <Empty icon={HelpCircle} title="Pas encore de question pour cette tâche" action={<a href="#expliquer" className="btn btn-secondary">L’étudier en mode Expliquer</a>}>La banque auditée ne couvre pas encore « {task.fr} ». Les modes Expliquer et Cas d’examen la traitent déjà.</Empty>}
          {(state === 'Question' || graded) && (
            <article className="card card-lg stack">
              <div className="row small subtle"><span className="label">{task.id} · {task.fr}</span><span>·</span><span>Niveau 2 · scénario</span></div>
              <h2 style={{ fontSize: 'var(--t-xl)', lineHeight: 1.35, textWrap: 'pretty' }}>{QUESTION.prompt}</h2>
              <div role={graded ? undefined : 'radiogroup'} aria-label="Réponses" className="stack-sm">
                {QUESTION.options.map((o, i) => {
                  const chosen = graded ? 0 : picked
                  const result = graded ? (i === QUESTION.answer ? 'correct' : i === chosen ? 'wrong' : undefined) : undefined
                  return <button type="button" key={i} role={graded ? undefined : 'radio'} aria-checked={graded ? undefined : picked === i} className="choice" data-result={result} disabled={graded} onClick={() => setPicked(i)} aria-label={graded ? `${['A','B','C','D'][i]}. ${o}${result === 'correct' ? ' (bonne réponse)' : result === 'wrong' ? ' (votre réponse, incorrecte)' : ''}` : undefined}><span className="choice-key" aria-hidden="true">{result === 'correct' ? <Check size={14} /> : result === 'wrong' ? <X size={14} /> : ['A','B','C','D'][i]}</span><span>{o}</span></button>
                })}
              </div>
              {graded && <div className="card card-quiet" aria-live="polite"><strong className="tier-1">Pas cette fois.</strong><p style={{ marginTop: 8 }}>{QUESTION.rationale}</p></div>}
              <div className="row between">
                {graded ? <button type="button" className="btn btn-ghost btn-sm" aria-pressed={state === 'Signalée'} disabled={state === 'Signalée'}>{state === 'Signalée' ? <><Check size={14} aria-hidden="true" /> Signalée, merci</> : <><Flag size={14} aria-hidden="true" /> Signaler cette question</>}</button> : <span />}
                {graded ? <button type="button" className="btn btn-primary">Question suivante <ArrowRight size={18} aria-hidden="true" /></button> : <button type="button" className="btn btn-primary" disabled={picked === null}>Valider</button>}
              </div>
            </article>
          )}
        </div>
        <aside className="stack" aria-label="Sujet">
          <div className="card">
            <div className="label">Sujet</div>
            <label htmlFor="focus-dom" className="sr-only">Domaine</label>
            <select id="focus-dom" className="select" style={{ marginTop: 8 }} value={task.domain} onChange={() => {}}>{DOMAINS.map(d => <option key={d.id} value={d.id}>{d.fr} · {Math.round(d.weight * 100)} %</option>)}</select>
            <ul className="list" style={{ marginTop: 8 }}>
              {TASKS.filter(t => t.domain === task.domain).map(t => { const mm = MASTERY.find(x => x.id === t.id); return <li key={t.id} style={{ padding: '6px 0' }}><button type="button" className="btn btn-ghost btn-sm" aria-pressed={t.id === task.id} onClick={() => setFocus(t.id)} style={{ justifyContent: 'start', flex: 1, textAlign: 'left', whiteSpace: 'normal', minHeight: 36 }}>{t.fr}</button><span className={`small num tier-${{untested:0,fragile:1,progress:2,solid:3}[mm.light]}`}>{mm.attempts ? pct(mm.score) : '—'}</span></li> })}
            </ul>
          </div>
          <div className="card card-quiet">
            <div className="label">Cette tâche</div>
            <div className="display num" style={{ fontSize: 'var(--t-2xl)', marginTop: 6 }}>{m.attempts ? pct(m.score) : 'Jamais pratiquée'}</div>
            <Meter value={m.score} tier={{untested:0,fragile:1,progress:2,solid:3}[m.light]} />
            <p className="small subtle" style={{ marginTop: 8 }}>Les questions servies suivent votre niveau : fondations sous 50 %, consolidation sous 75 %, niveau examen au-delà.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
