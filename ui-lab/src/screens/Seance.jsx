import React, { useState } from 'react'
import { X, Check, ArrowRight, Flag, AlertTriangle } from 'lucide-react'
import { QUESTION, TASKS, SESSION } from '../data.js'
import { Modal, Callout, pct } from '../ui.jsx'

export default function Seance({ state }) {
  const [picked, setPicked] = useState(null)
  const task = TASKS.find(t => t.id === QUESTION.task)
  const graded = state === 'Réponse juste' || state === 'Réponse fausse'
  const chosen = state === 'Réponse juste' ? QUESTION.answer : state === 'Réponse fausse' ? 0 : picked
  const n = 4
  if (state === 'Fin de séance') return <End />
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <header style={{ position: 'sticky', top: 'env(safe-area-inset-top, 0px)', zIndex: 10, background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
        <div className="page" style={{ paddingBlock: 'var(--s-3)', display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row between small"><span style={{ fontWeight: 500 }}>Séance du jour</span><span className="num subtle">Question {n} sur {SESSION.size}</span></div>
            <div className="meter meter-thin" role="progressbar" aria-valuemin={1} aria-valuemax={SESSION.size} aria-valuenow={n} aria-label="Progression de la séance" style={{ marginTop: 8 }}><span style={{ width: `${(n / SESSION.size) * 100}%` }} /></div>
          </div>
          <a href="#preparation" className="btn btn-ghost btn-icon" aria-label="Quitter la séance"><X size={20} aria-hidden="true" /></a>
        </div>
      </header>
      <div className="page" style={{ maxWidth: 760 }}>
        <div className="stack">
          <div className="row small subtle"><span className="label">{task.id} · {task.fr}</span><span>·</span><span>Niveau 2 · scénario</span></div>
          <h1 style={{ fontSize: 'var(--t-2xl)', lineHeight: 1.3, textWrap: 'pretty' }}>{QUESTION.prompt}</h1>
          <div role={graded ? undefined : 'radiogroup'} aria-label="Réponses" className="stack-sm">
            {QUESTION.options.map((o, i) => {
              const result = graded ? (i === QUESTION.answer ? 'correct' : i === chosen ? 'wrong' : undefined) : undefined
              return (
                <button type="button" key={i} role={graded ? undefined : 'radio'} aria-checked={graded ? undefined : picked === i} className="choice" data-result={result} disabled={graded} onClick={() => setPicked(i)} aria-label={graded ? `${['A','B','C','D'][i]}. ${o}${result === 'correct' ? ' (bonne réponse)' : result === 'wrong' ? ' (votre réponse, incorrecte)' : ''}` : undefined}>
                  <span className="choice-key" aria-hidden="true">{result === 'correct' ? <Check size={14} /> : result === 'wrong' ? <X size={14} /> : ['A','B','C','D'][i]}</span>
                  <span>{o}</span>
                </button>
              )
            })}
          </div>
          {state === 'Erreur réseau' && <Callout kind="warm" icon={AlertTriangle}>Connexion impossible. Votre réponse n’a pas été enregistrée ; le serveur se réveille peut-être. Choisissez à nouveau une réponse.</Callout>}
          {graded && (
            <div className="card" aria-live="polite" style={{ borderLeft: `4px solid var(--tier-${state === 'Réponse juste' ? 3 : 1})` }}>
              <div className="row between"><strong className={state === 'Réponse juste' ? 'tier-3' : 'tier-1'}>{state === 'Réponse juste' ? 'Juste.' : 'Pas cette fois.'}</strong><button type="button" className="btn btn-ghost btn-sm"><Flag size={14} aria-hidden="true" /> Signaler cette question</button></div>
              <p style={{ marginTop: 8 }}>{QUESTION.rationale}</p>
              {state === 'Réponse fausse' && <p className="small subtle" style={{ marginTop: 8 }}>Cette question reviendra dans 1 jour, puis 3, puis 7. Apprentissage adaptatif de vos erreurs.</p>}
            </div>
          )}
          <div className="row between">
            <span className="small subtle">Vous pouvez quitter à tout moment, vos réponses sont gardées.</span>
            {graded ? <a href="#seance" className="btn btn-primary">Continuer <ArrowRight size={18} aria-hidden="true" /></a> : <button type="button" className="btn btn-primary" disabled={picked === null && !graded}>Valider</button>}
          </div>
        </div>
      </div>
      {state === 'Quitter ?' && (
        <Modal title="Quitter la séance ?" onClose={() => {}}>
          <p className="muted">Vous avez répondu à {n - 1} questions sur {SESSION.size}. Elles sont enregistrées. Vous pourrez reprendre cette séance depuis Ma préparation.</p>
          <div className="row" style={{ marginTop: 20 }}><a href="#preparation" className="btn btn-secondary">Quitter</a><a href="#seance" className="btn btn-primary">Continuer la séance</a></div>
        </Modal>
      )}
    </div>
  )
}

function End() {
  const correct = 7, total = SESSION.size, score = correct / total
  const tier = score >= 0.7 ? 3 : score >= 0.5 ? 2 : 1
  return (
    <div className="page" style={{ maxWidth: 760, minHeight: '100dvh' }}>
      <div className="stack">
        <div className="label">Séance terminée</div>
        <h1 style={{ fontSize: 'var(--t-4xl)' }}><span className={`num tier-${tier}`}>{correct}/{total}</span> bonnes réponses.</h1>
        <p className="lead">Votre indicateur de préparation passe de 44 % à 49 %. Deux tâches ont été pratiquées pour la première fois : elles comptent désormais dans votre couverture.</p>
        <div className="card">
          <div className="label">Ce que cette séance a changé</div>
          <ul className="list" style={{ marginTop: 8 }}>
            <li><span>Lever les obstacles et gérer les problèmes (BE4)</span><span className="small subtle" style={{ marginLeft: 'auto' }}>33 % → 46 %</span></li>
            <li><span>Favoriser une livraison fondée sur la valeur (PR3)</span><span className="small subtle" style={{ marginLeft: 'auto' }}>41 % → 52 %</span></li>
            <li><span>Aligner les attentes des parties prenantes (PE5)</span><span className="small subtle" style={{ marginLeft: 'auto' }}>jamais pratiquée → 50 %</span></li>
            <li><span>3 questions manquées</span><span className="small subtle" style={{ marginLeft: 'auto' }}>reviennent demain</span></li>
          </ul>
        </div>
        <div className="row"><a href="#preparation" className="btn btn-primary">Retour à ma préparation</a><a href="#seance" className="btn btn-secondary">Nouvelle séance</a></div>
      </div>
    </div>
  )
}
