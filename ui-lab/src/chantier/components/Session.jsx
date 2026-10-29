// Session sheet (from certifizer-preparation.html): one question, immediate correction, a reflex to keep.
// Opens from the one primary action of « Aujourd'hui »; also the question card of « S'entraîner ».
import React, { useEffect, useRef, useState } from 'react'
import { gsap } from '../motion.js'
import { QUESTION, TASKS, DOMAINS } from '../../data.js'

const K = ['A', 'B', 'C', 'D']
export function QuestionBlock({ q = QUESTION, reduced, onAnswered, say, inline, heading: H = 'h3' }) {
  const [picked, setPicked] = useState(null)
  const [saved, setSaved] = useState(false)
  const why = useRef(null)
  const task = TASKS.find((t) => t.id === q.task)
  const dom = DOMAINS.find((d) => d.id === task.domain)
  const graded = picked !== null
  const ok = picked === q.answer
  useEffect(() => { if (graded && !reduced && why.current) gsap.from(why.current, { y: 10, opacity: 0, duration: .4 }) }, [graded, reduced])
  const pick = (i, el) => { if (graded) return; setPicked(i); onAnswered?.(i === q.answer); if (!reduced && i !== q.answer) gsap.fromTo(el, { x: -6 }, { x: 0, duration: .4, ease: 'elastic.out(1, .3)' }) }
  return (
    <>
      <p className="qtag">{dom.fr} · {task.fr} · Exemple</p>
      <H className="qtext" id="qtext">{q.prompt}</H>
      <div className="opts" role={graded ? undefined : 'group'} aria-label="Réponses">
        {q.options.map((o, i) => <button key={i} type="button" className={`opt ${graded && i === q.answer ? 'right' : ''} ${graded && i === picked && !ok ? 'wrong' : ''}`} disabled={graded} onClick={(e) => pick(i, e.currentTarget)} aria-pressed={picked === i}><span className="k" aria-hidden="true">{K[i]}</span><span>{o}</span></button>)}
      </div>
      {graded && <div className="why" ref={why} aria-live="polite"><b>{ok ? 'Bonne réponse.' : 'Pas tout à fait. Cette question reviendra demain.'}</b><p>{q.rationale}</p>{!ok && <p className="muted" style={{ fontSize: 14 }}>Apprentissage adaptatif de vos erreurs : elle revient à 1, 3 puis 7 jours.</p>}</div>}
      <div className="sheet-foot">
        {graded ? <button className="link" type="button" disabled={saved} onClick={() => setSaved(true)}>{saved ? 'Sauvé dans vos réflexes' : 'Sauver dans mes réflexes'}</button> : <span className="muted" style={{ fontSize: 14 }}>Choisissez une réponse.</span>}
        {graded && <button className="btn btn-primary" type="button" onClick={() => say(inline ? 'Aperçu : la question suivante se charge ici.' : 'Aperçu : la séance s’arrête à la première question.')}>Question suivante <span className="arr" aria-hidden="true">→</span></button>}
      </div>
    </>
  )
}

export function SessionSheet({ open, onClose, reduced, say, total = 10 }) {
  const sheet = useRef(null), scrim = useRef(null), first = useRef(null)
  useEffect(() => {
    if (!open) return
    if (!reduced) { gsap.fromTo(scrim.current, { opacity: 0 }, { opacity: 1, duration: .3 }); gsap.fromTo(sheet.current, { yPercent: 100 }, { yPercent: 0, duration: .55, ease: 'expo.out' }); gsap.from(sheet.current.querySelectorAll('.opt'), { y: 10, opacity: 0, stagger: .05, duration: .4, delay: .2 }) }
    sheet.current.querySelector('.opt')?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') { const f = [...sheet.current.querySelectorAll('button:not([disabled])')].filter((x) => x.offsetParent); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() } }
    }
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey)
  }, [open, reduced])
  if (!open) return null
  return (
    <>
      <div className="scrim" ref={scrim} onClick={onClose} />
      <section className="sheet" ref={sheet} role="dialog" aria-modal="true" aria-labelledby="qtext">
        <div className="sheet-top"><span className="mono">Question 1 sur {total}</span><span className="track" aria-hidden="true"><i style={{ width: `${100 / total}%` }} /></span><button className="x" type="button" aria-label="Quitter la séance" onClick={onClose}>×</button></div>
        <QuestionBlock reduced={reduced} say={say} />
      </section>
    </>
  )
}
