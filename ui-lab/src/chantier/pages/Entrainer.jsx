// « S'entraîner » — free practice: pick a domain, answer, read the correction. One primary action (validate).
import React, { useState } from 'react'
import { useGsap, gsap } from '../motion.js'
import { DOMAINS, MASTERY, QUESTION, LIGHT_LABEL } from '../../data.js'
import { QuestionBlock } from '../components/Session.jsx'

export default function Entrainer({ reduced, say }) {
  const [dom, setDom] = useState('business')
  const [focus, setFocus] = useState('BE4')
  const task = MASTERY.find((m) => m.id === focus)
  const root = useGsap((el) => { if (reduced) return; gsap.from(el.querySelectorAll('.page-head > *, .card'), { y: 14, opacity: 0, duration: .6, stagger: .06, ease: 'power3.out' }) }, [reduced])
  return (
    <div ref={root}>
      <div className="page-head">
        <p className="eyebrow">S'entraîner</p>
        <h1 className="page-title">Pratique libre.</h1>
        <p className="lead muted">Une question à la fois, la correction tout de suite. Les questions servies suivent votre niveau : fondations sous 50 %, consolidation sous 75 %, niveau examen au-delà.</p>
      </div>
      <div className="split">
        <article className="card" aria-label="Question" style={{ gap: 16 }}>
          <QuestionBlock q={QUESTION} reduced={reduced} say={say} inline heading="h2" />
        </article>
        <aside className="sticky" style={{ display: 'grid', gap: 16 }}>
          <div className="card">
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Sujet</h2>
            <div className="lang" role="group" aria-label="Domaine" style={{ justifySelf: 'start' }}>
              {DOMAINS.map((d) => <button key={d.id} type="button" aria-pressed={dom === d.id} onClick={() => { setDom(d.id); setFocus(MASTERY.find((m) => m.domain === d.id).id) }}>{d.short}</button>)}
            </div>
            <ul className="tree" style={{ gap: 2 }}>
              {MASTERY.filter((m) => m.domain === dom).map((m) => <li key={m.id} className="leaf" aria-current={m.id === focus ? 'true' : undefined} style={{ gridTemplateColumns: '40px minmax(0,1fr) auto' }}><span className="code">{m.id}</span><button type="button" onClick={() => setFocus(m.id)} aria-pressed={m.id === focus}>{m.fr}</button><span className="pill" data-light={m.light}><i className="dot-l" aria-hidden="true" />{LIGHT_LABEL[m.light].fr}</span></li>)}
            </ul>
          </div>
          <div className="card" style={{ background: 'var(--bg-2)' }}>
            <span className="eyebrow">Cette tâche</span>
            <p style={{ fontSize: 14.5 }}>{task.fr}. {task.covered ? `Niveau servi : ${task.score < 0.5 ? 'fondations' : task.score < 0.75 ? 'consolidation' : 'examen'}.` : 'Jamais travaillée : première question au niveau fondations.'}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
