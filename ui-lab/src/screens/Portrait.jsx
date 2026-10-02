import React from 'react'
import { Download, Quote } from 'lucide-react'
import { readiness, MASTERY, TRAJECTORY, REFLEXES, DOMAINS, TOTAL_ATTEMPTS, LEVERS, LIGHT_LABEL } from '../data.js'
import { pct, Meter, Skeleton, Empty, TierChip, Callout } from '../ui.jsx'

export default function Portrait({ state }) {
  const r = readiness()
  if (state === 'Chargement') return <div className="page stack" aria-busy="true"><div className="label">Mon portrait</div><Skeleton h={44} w="50%" /><Skeleton h={120} /><Skeleton h={240} /><p className="small subtle">Composition de votre portrait…</p></div>
  if (state === 'Vide') return <div className="page stack"><div className="label">Mon portrait</div><h1>Ce que vous avez construit, et ce qui vous attend.</h1><Empty title="Votre portrait prendra forme après vos premières réponses">Il dira ce que vous reconnaissez aujourd’hui, par domaine et par tâche, sans jamais arrondir vers le haut.</Empty></div>
  const traj = state === 'Trajectoire courte' ? TRAJECTORY.slice(-2) : TRAJECTORY
  const acquired = MASTERY.filter(m => m.light === 'solid').length
  return (
    <div className="page" style={{ maxWidth: 920 }}>
      <article className="stack" aria-labelledby="h-portrait">
        <header className="stack-sm">
          <div className="row between"><div className="label">Portrait d’apprentissage · édité le 2 oct. 2026 · ECO 2026</div><button type="button" className="btn btn-secondary btn-sm"><Download size={14} aria-hidden="true" /> Imprimer / PDF</button></div>
          <h1 id="h-portrait" style={{ fontSize: 'var(--t-4xl)', maxWidth: '20ch' }}>Ce que vous avez construit, et ce qui vous attend.</h1>
          <p className="lead">Un document, pas un tableau de bord. Il est généré à partir de vos données ; elles vous appartiennent.</p>
          <dl className="grid-3" style={{ marginTop: 8 }}>
            {[['Préparation', pct(r.score), r.label.fr], ['Tâches acquises', `${acquired} / 26`, `${MASTERY.filter(m => m.covered).length} pratiquées`], ['Réponses', String(TOTAL_ATTEMPTS), `${REFLEXES.length} réflexes`]].map(([k, v, s]) => <div key={k} className="card" style={{ padding: 'var(--s-4)' }}><dt className="label">{k}</dt><dd className="display num" style={{ fontSize: 'var(--t-2xl)', marginTop: 4 }}>{v}</dd><dd className="small subtle">{s}</dd></div>)}
          </dl>
        </header>

        <section className="section" aria-labelledby="p1">
          <div className="label">01</div><h2 id="p1">Votre carte, et votre chemin critique</h2>
          <p className="muted" style={{ marginTop: 8, maxWidth: '62ch' }}>Les zones pâles ne sont pas des trous. Elles vous attendent. Votre carte n’est pas incomplète : elle est en cours.</p>
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {MASTERY.map(m => { const tier = LIGHT_LABEL[m.light].tier; const step = LEVERS.findIndex(l => l.id === m.id) + 1; return <div key={m.id} style={{ borderLeft: `3px ${m.covered ? 'solid' : 'dashed'} var(--tier-${tier})`, paddingLeft: 10 }}><div className="label">{m.id}{step ? ` · étape ${step}` : ''}</div><div className="small" style={{ marginTop: 2 }}>{m.fr}</div><div className={`small num tier-${tier}`}>{m.attempts ? pct(m.score) : 'vous attend'}</div></div> })}
            </div>
          </div>
          <div className="card card-quiet" style={{ marginTop: 16 }}><div className="label">Lecture</div><p style={{ marginTop: 6 }}>Vous tenez le processus par ses deux bouts, <strong>le périmètre et l’échéancier</strong>, et c’est ce qui porte votre indicateur. Ce qui le retient : trois tâches jamais abordées et un domaine Environnement d’affaires encore fragile. Le chemin critique commence par <strong>{LEVERS[0].fr}</strong>. C’est l’ordre qui compte, pas le volume.</p></div>
        </section>

        <section className="section" aria-labelledby="p2">
          <div className="label">02</div><h2 id="p2">Votre trajectoire, et la pente devant</h2>
          <div className="grid-main" style={{ marginTop: 16, '--aside-w': '280px' }}>
            <div className="card"><Trajectory data={traj} /></div>
            <div className="card" style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
              <div className="label" style={{ color: 'inherit', opacity: 0.7 }}>À ce rythme</div>
              {traj.length >= 3 ? <><p style={{ marginTop: 8, fontFamily: 'var(--font-display)', fontSize: 'var(--t-xl)' }}>Seuil de 80 % vers le 20 décembre.</p><p className="small" style={{ marginTop: 8, opacity: 0.85 }}>31 points restants · +4,7 pts par semaine sur six semaines. Ce n’est pas une promesse : c’est une pente, et elle bouge avec vous.</p></> : <p style={{ marginTop: 8 }}>Votre trajectoire se dessine. Il faut au moins trois mesures pour tracer une pente ; nous ne projetons rien avant.</p>}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="p3">
          <div className="label">03</div><h2 id="p3">Face à l’examen réel</h2>
          <p className="muted" style={{ marginTop: 8 }}>Pondération officielle ECO 2026 : Personnes 33 %, Processus 41 %, Environnement d’affaires 26 %. Seuil visé : 80 %.</p>
          <div className="grid-3" style={{ marginTop: 16 }}>
            {r.domains.map(d => <div key={d.id} className="card"><div className="row between"><strong>{d.fr}</strong><span className="label">{Math.round(d.weight * 100)} %</span></div><div className="display num" style={{ fontSize: 'var(--t-2xl)', marginTop: 8 }}>{pct(d.score)}</div><Meter value={d.score} tier={d.score < 0.5 ? 1 : d.score < 0.7 ? 2 : d.score < 0.85 ? 3 : 4} /><p className="small subtle" style={{ marginTop: 8 }}>{d.covered}/{d.tasks} tâches pratiquées · écart au seuil {Math.max(0, Math.round((0.8 - d.score) * 100))} pts</p></div>)}
          </div>
        </section>

        <section className="section" aria-labelledby="p4">
          <div className="label">04</div><h2 id="p4">Vos réflexes</h2>
          <p className="muted" style={{ marginTop: 8 }}>Ce que vous avez décidé de retenir, dans vos mots.</p>
          <div className="grid-2" style={{ marginTop: 16 }}>
            {REFLEXES.map((x, i) => <blockquote key={i} className="card" style={{ display: 'flex', gap: 12 }}><Quote size={18} aria-hidden="true" style={{ flex: 'none', color: 'var(--ink-3)' }} /><div><p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)', lineHeight: 1.35 }}>{x.text}</p><footer className="small subtle" style={{ marginTop: 8 }}>{x.seatLabel} · {x.at}</footer></div></blockquote>)}
            <div className="card" style={{ borderStyle: 'dashed', display: 'grid', placeItems: 'center' }}><p className="subtle" style={{ textAlign: 'center' }}>Le prochain s’écrira à votre prochain cas réel.</p></div>
          </div>
        </section>
        <footer className="small subtle" style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginTop: 'var(--s-7)' }}>Certifizer · Document généré à partir de vos données, elles vous appartiennent · certifizer.app · PMI et PMP sont des marques déposées du Project Management Institute ; Certifizer n’est ni affilié ni endossé.</footer>
      </article>
    </div>
  )
}

function Trajectory({ data }) {
  const W = 520, H = 220, px = 36, py = 20
  const xs = data.map((_, i) => px + (i / Math.max(1, data.length - 1)) * (W - px - 16))
  const y = (v) => H - py - v * (H - 2 * py)
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x} ${y(data[i].r)}`).join(' ')
  const last = data[data.length - 1]
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Trajectoire de préparation : de ${pct(data[0].r)} à ${pct(last.r)} sur ${data.length} semaines. Seuil visé 80 %.`}>
        {[0.2, 0.4, 0.6, 0.8].map(v => <g key={v}><line x1={px} x2={W - 16} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray={v === 0.8 ? '4 4' : undefined} /><text x={px - 8} y={y(v) + 4} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">{Math.round(v * 100)}</text></g>)}
        <text x={W - 16} y={y(0.8) - 6} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">SEUIL VISÉ 80 %</text>
        <path d={`${d} L${xs[xs.length - 1]} ${H - py} L${xs[0]} ${H - py} Z`} fill="var(--accent-soft)" opacity="0.6" />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
        {xs.map((x, i) => <circle key={i} cx={x} cy={y(data[i].r)} r={i === xs.length - 1 ? 5 : 3} fill={i === xs.length - 1 ? 'var(--accent)' : 'var(--surface)'} stroke="var(--accent)" strokeWidth="2" />)}
        <text x={xs[xs.length - 1]} y={y(last.r) - 12} textAnchor="end" fontSize="12" fontFamily="var(--font-mono)" fill="var(--ink)">{Math.round(last.r * 100)} %</text>
        {data.map((p, i) => (i === 0 || i === data.length - 1 || i % 2 === 0) && <text key={i} x={xs[i]} y={H - 4} textAnchor={i === data.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'} fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">{p.day}</text>)}
      </svg>
      <figcaption className="small subtle">Une mesure par semaine, uniquement les jours où vous avez répondu.</figcaption>
    </figure>
  )
}
