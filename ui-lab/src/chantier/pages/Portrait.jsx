// « Portrait » — a document, not a dashboard. Three figures at the top, then lights, the four-step critical path
// and a trajectory without numeric clutter. Generated from the learner's data; it belongs to them.
import React from 'react'
import { useGsap, gsap } from '../motion.js'
import { readiness, MASTERY, LEVERS, TRAJECTORY, REFLEXES, LIGHT_LABEL } from '../../data.js'

const DOMC = { people: '--people', process: '--process', business: '--biz' }
const gain = (l) => `+${(l.lever * 100).toFixed(1).replace('.', ',')} pts`

export default function Portrait({ reduced, say }) {
  const r = readiness()
  const acquired = MASTERY.filter((m) => m.light === 'solid').length
  const root = useGsap((el) => { if (reduced) return; gsap.from(el.querySelectorAll('.docu > *'), { y: 16, opacity: 0, duration: .7, stagger: .08, ease: 'power3.out' }) }, [reduced])
  const W = 520, H = 160, px = 12, py = 14
  const xs = TRAJECTORY.map((_, i) => px + (i / (TRAJECTORY.length - 1)) * (W - 2 * px))
  const y = (v) => H - py - v * (H - 2 * py)
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x} ${y(TRAJECTORY[i].r)}`).join(' ')
  return (
    <article className="docu" ref={root} aria-labelledby="pt">
      <div className="page-head" style={{ paddingBlock: 0 }}>
        <div className="sec-head"><p className="eyebrow">Portrait d'apprentissage · édité le 2 oct. 2026 · ECO 2026</p><button className="link" type="button" onClick={() => say('Aperçu : le portrait s’exporte en PDF ici.')}>Exporter (PDF)</button></div>
        <h1 className="page-title" id="pt">Ce que vous avez construit, et ce qui vous attend.</h1>
        <p className="lead muted">Un document, pas un tableau de bord. Il est généré à partir de vos données ; elles vous appartiennent.</p>
      </div>
      <div className="cartouche">
        <div><span className="eyebrow">Préparation</span><b>{Math.round(r.score * 100)} %</b><span className="tier" data-tier={r.label.tier}><i aria-hidden="true" />{r.label.fr}</span></div>
        <div><span className="eyebrow">Tâches acquises</span><b>{acquired} / 26</b><span className="muted" style={{ fontSize: 13 }}>maîtrisées d'après vos réponses</span></div>
        <div><span className="eyebrow">Examen</span><b style={{ fontSize: 'clamp(18px, 2.2vw, 24px)' }}>14 nov. 2026</b><span className="muted" style={{ fontSize: 13 }}>cohorte PMP-2026-A</span></div>
      </div>

      <section aria-labelledby="p1">
        <span className="num">01</span><h2 id="p1">Face à l'examen réel</h2>
        <p className="muted" style={{ marginTop: 8 }}>Pondération officielle ECO 2026 : Personnes, Processus, Environnement d'affaires. Une tâche jamais travaillée compte pour zéro.</p>
        <div className="domrows" style={{ marginTop: 16 }}>
          {r.domains.map((d) => { const ts = MASTERY.filter((m) => m.domain === d.id); return <div className="domrow" key={d.id}><span><b>{d.fr}</b></span><div className="cells sm" role="img" aria-label={`${d.fr} : ${ts.filter((m) => m.covered).length} tâches travaillées sur ${ts.length}`}>{ts.map((m) => <span key={m.id} style={m.covered ? { background: `color-mix(in oklab, var(${DOMC[d.id]}) ${Math.round(25 + m.score * 75)}%, transparent)` } : { background: 'transparent', border: '1.5px dashed var(--line)' }} />)}</div><span className="pill" data-light={d.score < 0.5 ? 'fragile' : d.score < 0.75 ? 'progress' : 'solid'}><i className="dot-l" aria-hidden="true" />{d.score < 0.5 ? 'Fragile' : d.score < 0.75 ? 'En progression' : 'Solide'}</span></div> })}
        </div>
      </section>

      <section aria-labelledby="p2">
        <span className="num">02</span><h2 id="p2">Votre chemin critique</h2>
        <p className="muted" style={{ marginTop: 8 }}>Quatre étapes, dans l'ordre où chacune débloque la suivante.</p>
        <ol className="path" aria-label="Quatre étapes, dans l'ordre" style={{ marginTop: 16 }}>
          {LEVERS.map((l, i) => <li key={l.id} className={`step ${i === 0 ? 'now' : ''} ${i >= 2 ? 'locked' : ''}`}><span className="n">{i + 1}</span><span className="t">{l.fr}</span><span className="g">{gain(l)}</span>{i >= 2 && <span className="prem">Premium</span>}</li>)}
        </ol>
      </section>

      <section aria-labelledby="p3">
        <span className="num">03</span><h2 id="p3">Votre carte, tâche par tâche</h2>
        <p className="muted" style={{ marginTop: 8 }}>Les zones en pointillé ne sont pas des trous : elles vous attendent.</p>
        <div className="gridtasks" style={{ marginTop: 16 }}>{MASTERY.map((m) => <div key={m.id} data-light={m.light}><span className="code">{m.id} · {LIGHT_LABEL[m.light].fr}</span><span>{m.fr}</span></div>)}</div>
      </section>

      <section aria-labelledby="p4" className="two">
        <div>
          <span className="num">04</span><h2 id="p4">Votre trajectoire</h2>
          <figure style={{ margin: '16px 0 0' }}>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Trajectoire de préparation sur ${TRAJECTORY.length} semaines, en hausse régulière ; seuil visé 80 %.`}>
              <line x1={px} x2={W - px} y1={y(0.8)} y2={y(0.8)} stroke="var(--line)" strokeDasharray="4 4" />
              <text x={W - px} y={y(0.8) - 6} textAnchor="end" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--muted)">SEUIL VISÉ</text>
              <path d={`${d} L${xs[xs.length - 1]} ${H - py} L${xs[0]} ${H - py} Z`} fill="color-mix(in oklab, var(--accent) 18%, transparent)" />
              <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
              {xs.map((x, i) => <circle key={i} cx={x} cy={y(TRAJECTORY[i].r)} r={i === xs.length - 1 ? 5 : 3} fill={i === xs.length - 1 ? 'var(--accent)' : 'var(--surface)'} stroke="var(--accent)" strokeWidth="2" />)}
            </svg>
            <figcaption className="muted" style={{ fontSize: 13 }}>Une mesure par semaine, uniquement les jours où vous avez répondu. Du {TRAJECTORY[0].day} au {TRAJECTORY[TRAJECTORY.length - 1].day}.</figcaption>
          </figure>
        </div>
        <div>
          <span className="num">05</span><h2>Vos réflexes</h2>
          <div style={{ marginTop: 16 }}>{REFLEXES.map((x, i) => <blockquote className="reflex" key={i}><span>{x.text}</span><span className="src">{x.seatLabel} · {x.at}</span></blockquote>)}</div>
        </div>
      </section>
      <p className="muted" style={{ fontSize: 13, borderTop: '1px solid var(--line)', paddingTop: 16 }}>Certifizer · Document généré à partir de vos données, elles vous appartiennent · ECO PMP 2026 (PMI) · Les traductions FR des tâches sont celles de Certifizer, non officielles.</p>
    </article>
  )
}
