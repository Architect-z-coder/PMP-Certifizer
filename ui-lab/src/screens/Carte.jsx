import React, { useMemo, useState } from 'react'
import { ArrowRight, Presentation, Route, Lock } from 'lucide-react'
import { DOMAINS, THEMES, MASTERY, LEVERS, LIGHT_LABEL, lightOf, readiness } from '../data.js'
import { Seg, Meter, pct, LightChip, Premium, Callout } from '../ui.jsx'

// Tree layout (default): PMP → 3 domains → 13 themes (or 26 tasks). Left-to-right, calm.
function layout(dens) {
  const cols = [60, 250, 470]
  const H = dens === 26 ? 860 : 560
  const nodes = [], links = []
  nodes.push({ id: 'root', x: cols[0], y: H / 2, label: 'PMP', kind: 'root' })
  const items = dens === 13 ? THEMES : MASTERY
  let y = 40
  DOMAINS.forEach(d => {
    const children = items.filter(i => i.domain === d.id)
    const step = (H - 80) / items.length
    const ys = children.map((_, i) => y + i * step)
    y += children.length * step
    const dy = ys.reduce((a, b) => a + b, 0) / ys.length
    nodes.push({ id: d.id, x: cols[1], y: dy, label: d.fr, kind: 'domain', domain: d.id })
    links.push({ from: 'root', to: d.id })
    children.forEach((c, i) => {
      const m = dens === 13 ? { score: avg(c.tasks), attempts: c.tasks.reduce((s, id) => s + MASTERY.find(x => x.id === id).attempts, 0) } : c
      nodes.push({ id: c.id, x: cols[2], y: ys[i], label: c.fr, kind: 'leaf', domain: d.id, score: m.score, attempts: m.attempts, light: lightOf(m.score, m.attempts), tasks: c.tasks })
      links.push({ from: d.id, to: c.id })
    })
  })
  return { nodes, links, H }
}
const avg = (ids) => { const t = ids.map(id => MASTERY.find(x => x.id === id)).filter(x => x.covered); return t.length ? t.reduce((s, x) => s + x.score, 0) / t.length : 0 }

export default function Carte({ state }) {
  const free = state === 'Gratuit (26 verrouillé)'
  const [dens, setDens] = useState(state === 'Arbre · 26 tâches' ? 26 : 13)
  const [sel, setSel] = useState(state === 'Sujet sélectionné' ? 't11' : null)
  const focus = state === 'Chemin critique' || state === 'Présentation'
  const present = state === 'Présentation'
  const r = readiness()
  const { nodes, links, H } = useMemo(() => layout(dens), [dens])
  const pathIds = LEVERS.map(l => dens === 13 ? THEMES.find(t => t.tasks.includes(l.id))?.id : l.id).filter(Boolean)
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  const selected = sel ? byId[sel] : null
  return (
    <div className="page" style={{ maxWidth: 1240 }}>
      <div className="page-head">
        <div><div className="label">Carte mentale PMP</div><h1>Votre carte, en arbre.</h1></div>
        <div className="row">
          <div className="row" style={{ gap: 8 }}>
            <Seg label="Densité" value={dens} onChange={(v) => { if (v === 26 && free) return; setDens(v) }} options={[{ value: 13, label: '13 thèmes' }, { value: 26, label: free ? '26 tâches · Premium' : '26 tâches' }]} />
          </div>
          <a href="#chemin" className="btn btn-secondary"><Route size={16} aria-hidden="true" /> Chemin critique</a>
          <button type="button" className="btn btn-ghost" aria-pressed={present}><Presentation size={16} aria-hidden="true" /> Présentation</button>
        </div>
      </div>
      {free && <Callout icon={Lock}>La carte de base (13 thèmes) reste complète et gratuite. Premium ajoute le détail par tâche ECO (26). <a href="#premium" style={{ marginLeft: 8 }}>Voir Premium</a></Callout>}
      <div className="grid-main" style={{ '--aside-w': '320px', marginTop: free ? 'var(--s-5)' : 0 }}>
        <div className="card" style={{ padding: 'var(--s-3)', overflow: 'auto' }}>
          <svg viewBox={`0 0 760 ${H}`} width="100%" style={{ minWidth: 640, display: 'block' }} role="group" aria-label={`Carte mentale en arbre : PMP, 3 domaines, ${dens === 13 ? '13 thèmes' : '26 tâches'}. Votre préparation : ${pct(r.score)}.`}>
            <g fill="none" stroke="var(--line-strong)" strokeWidth="1.5">
              {links.map(l => { const a = byId[l.from], b = byId[l.to]; const onPath = pathIds.includes(l.to) || (a.kind === 'root' && nodes.some(n => n.domain === l.to && pathIds.includes(n.id))); const mx = (a.x + b.x) / 2; return <path key={l.from + l.to} d={`M${a.x + 44} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x - 8} ${b.y}`} stroke={focus && onPath ? 'var(--accent)' : undefined} strokeWidth={focus && onPath ? 2.5 : undefined} opacity={focus && !onPath ? 0.3 : 1} /> })}
            </g>
            {nodes.map(n => {
              const dim = focus && n.kind === 'leaf' && !pathIds.includes(n.id)
              const stepN = pathIds.indexOf(n.id) + 1
              if (n.kind === 'root') return <g key={n.id}><circle cx={n.x} cy={n.y} r="40" fill="var(--ink)" /><text x={n.x} y={n.y - 4} textAnchor="middle" fill="var(--surface)" fontFamily="var(--font-display)" fontSize="18">PMP</text><text x={n.x} y={n.y + 14} textAnchor="middle" fill="var(--surface)" fontFamily="var(--font-mono)" fontSize="10" opacity="0.8">{Math.round(r.score * 100)} %</text></g>
              if (n.kind === 'domain') { const d = DOMAINS.find(x => x.id === n.id); return <g key={n.id}><rect x={n.x - 8} y={n.y - 22} width="150" height="44" rx="22" fill="var(--surface)" stroke={`var(--dom-${n.id === 'business' ? 'be' : n.id})`} strokeWidth="2" /><text x={n.x + 67} y={n.y - 2} textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-body)" fontSize="13" fontWeight="500">{d.short}</text><text x={n.x + 67} y={n.y + 13} textAnchor="middle" fill="var(--ink-3)" fontFamily="var(--font-mono)" fontSize="10">{Math.round(d.weight * 100)} % · {d.tasks} tâches</text></g> }
              const tier = LIGHT_LABEL[n.light].tier
              return (
                <g key={n.id} opacity={dim ? 0.35 : 1} style={{ cursor: 'pointer' }} onClick={() => setSel(n.id)} role="button" tabIndex={0} aria-label={`${n.label} : ${n.attempts ? pct(n.score) : 'à découvrir'}${stepN ? `, étape ${stepN} du chemin critique` : ''}`} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(n.id) } }}>
                  <circle cx={n.x} cy={n.y} r={dens === 13 ? 11 : 8} fill={`var(--tier-${tier})`} stroke={sel === n.id ? 'var(--ink)' : 'var(--surface)'} strokeWidth="2" />
                  {stepN > 0 && <g><circle cx={n.x - 16} cy={n.y - 12} r="8" fill="var(--accent)" /><text x={n.x - 16} y={n.y - 9} textAnchor="middle" fill="var(--accent-ink)" fontSize="9" fontFamily="var(--font-mono)">{stepN}</text></g>}
                  <text x={n.x + 18} y={n.y + 4} fill="var(--ink)" fontFamily="var(--font-body)" fontSize={dens === 13 ? 13 : 11.5}>{n.label}<tspan dx="8" fill="var(--ink-3)" fontFamily="var(--font-mono)" fontSize="10">{n.attempts ? `${Math.round(n.score * 100)} %` : '—'}</tspan></text>
                </g>
              )
            })}
          </svg>
          <div className="row small subtle" style={{ padding: '8px 8px 0', gap: 14 }}>
            {[0,1,2,3].map(t => <span key={t} className="row" style={{ gap: 6 }}><span className={`dot bg-tier-${t}`} aria-hidden="true" />{['À découvrir','Fragile','En progression','Maîtrisé'][t]}</span>)}
            <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: 'var(--accent)' }} aria-hidden="true" />Chemin critique</span>
          </div>
        </div>
        <aside className="stack" aria-live="polite">
          {present && <div className="card" style={{ background: 'var(--ink)', color: 'var(--surface)' }}><div className="label" style={{ color: 'inherit', opacity: 0.7 }}>Script simple pour présenter</div><p style={{ marginTop: 8, fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)' }}>« Voici ma carte PMP. En vert, ce que je maîtrise ; en ambre, ce qui progresse ; en rouge, mes priorités. Mon chemin critique : {pathIds.map(id => byId[id]?.label).join(' → ')}. »</p></div>}
          {!selected ? (
            <div className="card card-quiet"><p className="muted">Sélectionnez un sujet sur la carte pour voir votre niveau et l’action recommandée.</p></div>
          ) : (
            <div className="card stack-sm">
              <div className="row between"><LightChip light={selected.light} />{pathIds.includes(selected.id) && <span className="chip chip-accent">Étape {pathIds.indexOf(selected.id) + 1} du chemin critique</span>}</div>
              <h2 style={{ fontSize: 'var(--t-xl)' }}>{selected.label}</h2>
              <Meter value={selected.score} tier={LIGHT_LABEL[selected.light].tier} />
              <p className="small muted">{selected.attempts ? `Vous réussissez environ ${pct(selected.score)} des questions de ce ${dens === 13 ? 'thème' : 'sujet'} (${selected.attempts} réponses).` : 'Jamais pratiqué. Il compte 0 dans votre préparation tant que vous ne l’avez pas abordé.'}</p>
              {dens === 13 && selected.tasks && (
                <div><div className="label" style={{ marginBottom: 6 }}>Ce thème contient ({selected.tasks.length})</div>
                  {free ? <Premium label="Premium" note="Détail par tâche disponible en Premium"><ul className="list">{selected.tasks.map(id => { const m = MASTERY.find(x => x.id === id); return <li key={id} style={{ padding: '6px 0' }} className="small"><span>{m.fr}</span><span className="num subtle" style={{ marginLeft: 'auto' }}>{m.attempts ? pct(m.score) : '—'}</span></li> })}</ul></Premium>
                    : <ul className="list">{selected.tasks.map(id => { const m = MASTERY.find(x => x.id === id); return <li key={id} style={{ padding: '6px 0' }} className="small"><button type="button" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, whiteSpace: 'normal', textAlign: 'left', flex: 1, justifyContent: 'start' }} onClick={() => { setDens(26); setSel(id) }}>{m.fr}</button><span className="num subtle">{m.attempts ? pct(m.score) : '—'}</span></li> })}</ul>}
                </div>
              )}
              <a href="#tester" className="btn btn-primary">{selected.attempts === 0 ? 'Commencer ce sujet' : selected.score >= 0.75 ? 'Maintenir le niveau' : 'Renforcer ce sujet'} <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
          )}
          <p className="small subtle">Une zone visible peut regrouper plusieurs tâches officielles ; votre maîtrise reste enregistrée par tâche, sur les 26 identifiants ECO.</p>
        </aside>
      </div>
    </div>
  )
}
