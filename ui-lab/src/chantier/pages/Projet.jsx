// « Mon projet » — formation in the work situation: the real project, real deliverables, a map of evidence
// (never a progress bar), the co-thinker. Vocabulary follows the OJT model: the AI proposes, the trainer validates;
// evidence accumulates and is only ever contested by new observations and a human review, never by its age.
import React, { useState } from 'react'
import { useGsap, gsap } from '../motion.js'
import { DELIVERABLES, EVIDENCE_STATES, TASKS } from '../../data.js'
import { CONVO } from '../../content-chat.js'

export default function Projet({ reduced, say }) {
  const [text, setText] = useState('')
  const root = useGsap((el) => { if (reduced) return; gsap.from(el.querySelectorAll('.page-head > *, .card, .ev-row'), { y: 14, opacity: 0, duration: .6, stagger: .05, ease: 'power3.out' }) }, [reduced])
  const order = EVIDENCE_STATES.map(([k]) => k)
  return (
    <div ref={root}>
      <div className="page-head">
        <p className="eyebrow">Mon projet · Exemple</p>
        <h1 className="page-title">Réhabilitation d'une station de pompage.</h1>
        <p className="lead muted">Équipe de 8, 14 mois, maître d'ouvrage public. Vous révisez le PMP en produisant les livrables de ce projet ; l'IA propose, votre formateur valide.</p>
      </div>
      <div className="split">
        <div style={{ display: 'grid', gap: 20 }}>
          <section className="card" aria-labelledby="ev-h">
            <h2 id="ev-h" style={{ fontSize: 20, fontWeight: 700 }}>Carte de preuves</h2>
            <p className="muted" style={{ fontSize: 14 }}>Ce n'est pas une barre de progression. On accumule des preuves ; certaines peuvent être contredites ou invalidées par de nouvelles observations et une revue humaine, jamais par leur seule ancienneté.</p>
            <div className="ev">
              {DELIVERABLES.map((d) => <div className="ev-row" key={d.id}><div><b>{d.fr}</b><div className="muted" style={{ fontSize: 13 }}>{TASKS.find((t) => t.id === d.task).id} · {d.hint}</div></div><div className="ev-states" role="img" aria-label={`${d.fr} : ${EVIDENCE_STATES.find(([k]) => k === d.state)[1]}`}>{EVIDENCE_STATES.map(([k, l]) => <span key={k} data-on={order.indexOf(k) <= order.indexOf(d.state)}>{l}</span>)}</div></div>)}
            </div>
            <p className="muted" style={{ fontSize: 13 }}>« Validé » et au-delà n'apparaissent qu'après revue par votre formateur. « Retenu » exige une réapplication différée, plus seule, ailleurs.</p>
          </section>
          <section className="card" aria-labelledby="cp-h">
            <h2 id="cp-h" style={{ fontSize: 20, fontWeight: 700 }}>Co-penseur</h2>
            <div className="chat">
              {CONVO.relier.map(([who, t], i) => <div key={i} className={`msg ${who}`}>{who === 'ai' && <span className="src">Co-penseur · IA · propose, ne décide pas</span>}<p style={{ whiteSpace: 'pre-wrap' }}>{t}</p></div>)}
            </div>
            <label htmlFor="cp-in" className="sr-only">Votre message</label>
            <textarea id="cp-in" className="field" placeholder="Décrivez la situation, la contrainte, la décision en jeu…" value={text} onChange={(e) => setText(e.target.value)} />
            <div className="go">
              <button className="btn btn-primary" type="button" onClick={() => say('Aperçu : le co-penseur reprend la charte de projet là où vous l’avez laissée.')}>Continuer la charte de projet <span className="arr" aria-hidden="true">→</span></button>
              <span className="muted" style={{ fontSize: 13 }}>Ne collez pas de document confidentiel : ce texte est envoyé à l'IA.</span>
            </div>
          </section>
        </div>
        <aside className="sticky" style={{ display: 'grid', gap: 16 }}>
          <div className="card">
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Votre projet</h2>
            <label htmlFor="proj" className="sr-only">Description du projet</label>
            <textarea id="proj" className="field" defaultValue="Réhabilitation d'une station de pompage, équipe de 8, 14 mois, maître d'ouvrage public." />
            <p className="muted" style={{ fontSize: 13 }}>Partagé avec « Cas réel ».</p>
          </div>
          <div className="card" style={{ background: 'var(--bg-2)' }}>
            <span className="eyebrow">Ce que mesure cette page</span>
            <p style={{ fontSize: 14.5 }}>Trois canaux, jamais fusionnés : la reconnaissance (vos réponses), l'application (vos livrables, validés par votre formateur), la rétention (preuve différée). Aucun pourcentage synthétique.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
