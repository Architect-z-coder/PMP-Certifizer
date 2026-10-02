// « Parcours » — the mind map opens as a tree: 3 domains → 13 themes → 26 tasks. Lights, not numbers, on the leaves;
// the three domain percentages are the only figures on screen. One primary action: revise the selected task.
import React, { useState } from 'react'
import { useGsap, gsap } from '../motion.js'
import { readiness, DOMAINS, THEMES, MASTERY, LIGHT_LABEL, lightOf } from '../../data.js'

const DOMC = { people: '--people', process: '--process', business: '--biz' }
const Light = ({ light }) => <span className="pill" data-light={light}><i className="dot-l" aria-hidden="true" />{LIGHT_LABEL[light].fr}</span>
const avg = (ids) => { const t = ids.map((id) => MASTERY.find((x) => x.id === id)).filter((x) => x.covered); return t.length ? t.reduce((s, x) => s + x.score, 0) / t.length : 0 }

export default function Parcours({ reduced, say }) {
  const r = readiness()
  const [sel, setSel] = useState('BE4')
  const task = MASTERY.find((m) => m.id === sel)
  const theme = THEMES.find((t) => t.tasks.includes(sel))
  const root = useGsap((el) => { if (reduced) return; gsap.from(el.querySelectorAll('.page-head > *, .tree > li, .sticky > *'), { y: 14, opacity: 0, duration: .6, stagger: .05, ease: 'power3.out' }) }, [reduced])
  return (
    <div ref={root}>
      <div className="page-head">
        <p className="eyebrow">Parcours ECO 2026</p>
        <h1 className="page-title">Trois domaines, vingt-six tâches.</h1>
        <p className="lead muted">La carte s'ouvre en arbre. Les couleurs disent votre maîtrise, jamais plus ; une tâche jamais travaillée reste en pointillé.</p>
      </div>
      <div className="split">
        <ul className="tree" aria-label="Carte des tâches, en arbre">
          {DOMAINS.map((d) => { const dr = r.domains.find((x) => x.id === d.id); return (
            <li key={d.id}>
              <details open={d.id === task.domain}>
                <summary><span className="sw" style={{ background: `var(${DOMC[d.id]})` }} aria-hidden="true" /><span>{d.fr} <span className="muted" style={{ fontWeight: 400 }}>· {d.en}</span></span><span className="dom-pct" data-dom={d.id} style={{ fontSize: 20 }}>{Math.round(dr.score * 100)} %</span></summary>
                <ul className="leafs">
                  {THEMES.filter((t) => t.domain === d.id).map((t) => (
                    <li key={t.id}>
                      <details open={t.id === theme?.id}>
                        <summary style={{ gridTemplateColumns: '12px minmax(0,1fr) auto', fontWeight: 500 }}><span aria-hidden="true" /><span>{t.fr}</span><Light light={lightOf(avg(t.tasks), t.tasks.reduce((s, id) => s + MASTERY.find((x) => x.id === id).attempts, 0))} /></summary>
                        <ul className="leafs">
                          {t.tasks.map((id) => { const m = MASTERY.find((x) => x.id === id); return <li key={id} className="leaf" aria-current={id === sel ? 'true' : undefined}><span className="code">{id}</span><button type="button" onClick={() => setSel(id)} aria-pressed={id === sel}>{m.fr}</button><Light light={m.light} /></li> })}
                        </ul>
                      </details>
                    </li>
                  ))}
                </ul>
              </details>
            </li>) })}
        </ul>
        <aside className="sticky" aria-live="polite">
          <div className="card">
            <span className="eyebrow">{task.id} · {DOMAINS.find((d) => d.id === task.domain).fr}</span>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{task.fr}</h2>
            <p className="muted" style={{ fontSize: 14 }}>{task.en}</p>
            <Light light={task.light} />
            <p style={{ fontSize: 14.5 }}>{task.covered ? 'Vos réponses sur cette tâche sont prises en compte dans votre indice.' : 'Jamais travaillée : elle compte pour zéro dans votre indice, pas parce que vous êtes mauvais, parce que rien ne le prouve encore.'}</p>
            <a className="btn btn-primary" href="#/entrainer" style={{ justifySelf: 'start' }}>Réviser cette tâche <span className="arr" aria-hidden="true">→</span></a>
            <button className="link" type="button" style={{ justifySelf: 'start' }} onClick={() => say('Aperçu : l’explication s’ouvre dans le co-penseur.')}>L'expliquer</button>
          </div>
        </aside>
      </div>
    </div>
  )
}
