import React from 'react'
import { ArrowRight, Check, Lock } from 'lucide-react'
import { LEVERS, TASKS } from '../data.js'
import { Premium, pct, Meter, LightChip } from '../ui.jsx'

import { DOMAINS } from '../data.js'
const reason = (l, i) => {
  const d = DOMAINS.find(x => x.id === l.domain)
  if (l.attempts === 0) return i === 0 ? `Jamais pratiquée, dans un domaine à ${Math.round(d.weight * 100)} % de l’examen : c’est le levier le plus rentable aujourd’hui. Elle compte 0 tant que vous ne l’avez pas abordée.` : `Jamais pratiquée. La couvrir fait remonter tout le domaine ${d.fr} (${Math.round(d.weight * 100)} % de l’examen).`
  if (l.score < 0.5) return `Fragile sur un domaine à ${Math.round(d.weight * 100)} % de l’examen. Deux séances suffisent souvent à passer le seuil de 50 %.`
  return 'En progression. Une révision d’entretien dans deux semaines pour consolider.'
}

export default function Chemin({ state }) {
  const free = state === 'Gratuit (2 + aperçu)'
  const active = state === 'Étape 1 en cours' ? 0 : -1
  const steps = LEVERS.map((l, i) => ({ ...l, reason: reason(l, i), weeks: i + 1 }))
  return (
    <div className="page" style={{ maxWidth: 880 }}>
      <div className="page-head"><div><div className="label">Chemin critique</div><h1>Quatre étapes, dans cet ordre.</h1></div></div>
      <p className="lead" style={{ marginBottom: 'var(--s-6)' }}>Comme sur un projet, le chemin critique est la chaîne qui décide de la date. Ici : les tâches où chaque heure rapporte le plus de points, dans l’ordre où les travailler. C’est l’ordre qui compte, pas le volume.</p>
      <ol className="steps" aria-label="Étapes du chemin critique">
        {steps.map((s, i) => {
          const locked = free && i >= 2
          const stateAttr = i < active ? 'done' : i === active ? 'active' : undefined
          const body = (
            <li className="step" data-state={stateAttr} key={s.id}>
              <span className="step-n" aria-hidden="true">{stateAttr === 'done' ? <Check size={20} /> : i + 1}</span>
              <div className="stack-sm">
                <div className="row between"><div><div className="label">Étape {i + 1} · {s.id} · semaine {s.weeks}</div><h2 style={{ fontSize: 'var(--t-xl)', marginTop: 4 }}>{s.fr}</h2></div><LightChip light={s.light} /></div>
                <p className="muted">{s.reason}</p>
                <div className="row between small"><span className="subtle">{s.attempts ? `${pct(s.score)} de réussite · ${s.attempts} réponses` : 'Jamais pratiquée'}</span><span className="subtle num">Levier : {(s.lever * 100).toFixed(1).replace('.', ',')} pts</span></div>
                <Meter value={s.score} tier={{untested:0,fragile:1,progress:2,solid:3}[s.light]} thin />
                {!locked && <div className="row"><a href="#tester" className={stateAttr === 'active' ? 'btn btn-primary' : 'btn btn-secondary'}>{stateAttr === 'active' ? 'Continuer cette étape' : 'Commencer cette étape'} <ArrowRight size={16} aria-hidden="true" /></a><a href="#expliquer" className="btn btn-ghost">Comprendre d’abord</a></div>}
              </div>
            </li>
          )
          return locked ? <Premium key={s.id} note={`Étape ${i + 1} disponible en Premium`}>{body}</Premium> : body
        })}
      </ol>
      {free && <div className="callout callout-accent" style={{ marginTop: 'var(--s-5)' }}><Lock aria-hidden="true" /><div>Les étapes 3 et 4 de votre chemin critique sont incluses en Premium. Votre progression est la même dans les deux cas. <a href="#premium">Voir Premium</a></div></div>}
      <p className="small subtle" style={{ marginTop: 'var(--s-6)' }}>Le levier combine le poids de la tâche à l’examen (hypothèse de conception Certifizer : poids égal entre les tâches d’un domaine) et ce qu’il vous reste à construire. Il se recalcule après chaque réponse.</p>
    </div>
  )
}
