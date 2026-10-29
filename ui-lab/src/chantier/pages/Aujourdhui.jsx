// « Aujourd'hui » — the daily work surface (from certifizer-preparation.html): one honest number, one action.
import React, { useRef, useState } from 'react'
import { gsap, useGsap } from '../motion.js'
import { readiness, MASTERY, LEVERS, MISSED, REFLEXES, ASSIGNED, TASKS, LEARNER, READINESS_TIERS } from '../../data.js'
import Ring, { RING_C } from '../components/Ring.jsx'
import { SessionSheet } from '../components/Session.jsx'

const gain = (l) => `+${(l.lever * 100).toFixed(1).replace('.', ',')} pts`
const DOMC = { people: '--people', process: '--process', business: '--biz' }

export default function Aujourdhui({ reduced, say }) {
  const r = readiness()
  const READY = Math.round(r.score * 100)
  const [open, setOpen] = useState(false)
  const launch = useRef(null)
  const root = useGsap((el) => {
    if (reduced) return
    const arc = el.querySelector('.ring-arc'), pct = el.querySelector('.ring-pct'); const o = { v: 0 }
    const setRing = (v) => { arc.setAttribute('stroke-dashoffset', RING_C * (1 - v / 100)); pct.textContent = Math.round(v) }
    setRing(0)
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.hello > *', { y: 14, opacity: 0, duration: .7, stagger: .06 })
      .to(o, { v: READY, duration: 1.6, ease: 'power2.inOut', onUpdate: () => setRing(o.v) }, .1)
      .from('.session', { y: 24, opacity: 0, duration: .8 }, .15)
      .from('.prio', { x: -10, opacity: 0, duration: .6 }, .55)
      .to('.prio .dot', { boxShadow: '0 0 0 10px transparent', duration: 1.2, ease: 'power1.out', repeat: 1 }, 1.0)
      .from('.cells span', { scaleY: 0, duration: .6, stagger: { each: .025 } }, .5)
      .from('.step', { y: 14, opacity: 0, duration: .5, stagger: .07 }, .7)
  }, [reduced])
  const prio = LEVERS[0]
  const strongest = [...r.domains].sort((a, b) => b.score - a.score)[0]
  const heaviest = [...r.domains].sort((a, b) => b.weight - a.weight)[0]
  return (
    <div ref={root}>
      <section className="today" aria-labelledby="hello">
        <div className="ready">
          <Ring value={READY} label={`Préparation estimée : ${READY} %, ${r.label.fr.toLowerCase()}`} />
          <div className="hello">
            <p className="date">{new Date('2026-10-02').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · jour 14</p>
            <h1 id="hello">Bonjour, {LEARNER.name.split(' ')[0]}.</h1>
            <p className="tier" data-tier={r.label.tier}><i aria-hidden="true" />{r.label.fr}</p>
            <p>Vous progressez sur {strongest.fr}. {heaviest.fr === 'Processus' ? 'Les Processus pèsent' : `${heaviest.fr} pèse`} le plus à l'examen : c'est là que chaque séance compte.</p>
            <details className="how">
              <summary>Comment c'est calculé ?</summary>
              <div className="inner">
                <p>L'indice pondère vos 26 tâches selon le poids réel de l'examen (33 · 41 · 26). Une tâche jamais travaillée compte pour zéro. Il peut redescendre quand une compétence s'efface.</p>
                <div className="thresholds">{READINESS_TIERS.slice().reverse().map((t) => <span key={t.code}>{t.min === 0 ? '< 50' : Math.round(t.min * 100)} {t.fr}</span>)}</div>
              </div>
            </details>
          </div>
        </div>
        <div className="session" aria-labelledby="sess-t">
          <div style={{ display: 'grid', gap: 10 }}>
            <p className="kicker">Séance du jour</p>
            <h2 id="sess-t">10 questions, environ 15 minutes.</h2>
            <p className="sub">Composée à partir de vos erreurs récentes et de votre priorité.</p>
          </div>
          <div className="prio"><span className="dot" aria-hidden="true" /><span>Votre priorité : <b>{prio.fr}</b></span><span className="gain">{gain(prio)}</span></div>
          <div className="go">
            <button className="btn btn-primary" ref={launch} type="button" onClick={() => setOpen(true)}>Lancer ma séance <span className="arr" aria-hidden="true">→</span></button>
            <p className="assigned">Votre formateur vous a aussi assigné « {ASSIGNED[0].title} ». <a href="#/aujourdhui" onClick={(e) => { e.preventDefault(); say('Aperçu : la séance assignée s’ouvre dans le même lecteur.') }}>Voir</a></p>
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="where">
        <div className="sec-head"><h2 id="where">Où vous en êtes</h2><a className="link" href="#/parcours">Voir la carte des 26 tâches</a></div>
        <div className="domains">
          {r.domains.map((d) => { const ts = MASTERY.filter((m) => m.domain === d.id); const untouched = ts.filter((m) => !m.covered).length; return (
            <div className="dom" key={d.id}>
              <div className="dom-top"><span className="dom-name">{d.fr}</span><span className="dom-pct" data-dom={d.id}>{Math.round(d.score * 100)} %</span></div>
              <div className="cells" role="img" aria-label={`${ts.length} tâches, ${untouched} jamais travaillée${untouched > 1 ? 's' : ''}`}>{ts.map((m) => <span key={m.id} style={m.covered ? { background: `color-mix(in oklab, var(${DOMC[d.id]}) ${Math.round(25 + m.score * 75)}%, transparent)` } : { background: 'transparent', border: '1.5px dashed var(--line)' }} />)}</div>
              <span className="dom-meta">{Math.round(d.weight * 100)} % de l'examen · {ts.length} tâches{untouched ? ` · ${untouched} jamais travaillée${untouched > 1 ? 's' : ''}` : ''}</span>
            </div>) })}
        </div>
      </section>

      <section className="sec" aria-labelledby="pathh">
        <div className="sec-head"><h2 id="pathh">Votre chemin critique</h2><a className="link" href="#/portrait">Ouvrir le chemin</a></div>
        <ol className="path" aria-label="Quatre étapes, dans l'ordre">
          {LEVERS.map((l, i) => <li key={l.id} className={`step ${i === 0 ? 'now' : ''} ${i >= 2 ? 'locked' : ''}`}><span className="n">{i + 1}</span><span className="t">{l.fr}</span><span className="g">{gain(l)}{i === 0 ? ' · en cours' : ''}</span>{i >= 2 && <span className="prem">Premium</span>}</li>)}
        </ol>
      </section>

      <section className="sec two" aria-label="À retravailler et réflexes">
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <div className="sec-head"><h2>À retravailler</h2><button className="link" type="button" onClick={() => say('Aperçu : vos questions manquées reviennent dans la prochaine séance.')}>Rejouer mes manquées</button></div>
          <ul className="list">{MISSED.slice(0, 3).map((m) => <li key={m.id}><span className="q">{TASKS.find((t) => t.id === m.task).fr}</span><span className="when">{m.due === 'aujourd’hui' ? 'revient aujourd’hui' : m.due}</span></li>)}</ul>
        </div>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <div className="sec-head"><h2>Mes réflexes</h2></div>
          {REFLEXES.slice(0, 2).map((x, i) => <blockquote className="reflex" key={i}><span>{x.text}</span><span className="src">Sauvé le {x.at}</span></blockquote>)}
        </div>
      </section>

      <section className="sec" aria-labelledby="simh">
        <div className="sim">
          <div style={{ display: 'grid', gap: 4 }}><h2 id="simh" style={{ fontSize: 18, fontWeight: 700 }}>Simulateur d'examen</h2><p className="blurred" aria-hidden="true">Examen blanc complet · conditions réelles</p><span className="prem" style={{ justifySelf: 'start' }}>Premium</span></div>
          <button className="btn btn-quiet" type="button" onClick={() => say('Aperçu : la comparaison Gratuit / Premium s’ouvre ici.')}>Débloquer avec Premium</button>
        </div>
      </section>
      <SessionSheet open={open} onClose={() => { setOpen(false); launch.current?.focus() }} reduced={reduced} say={say} />
    </div>
  )
}
