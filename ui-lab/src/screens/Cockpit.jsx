import React, { useMemo, useRef, useState } from 'react'
import { Plus, Mail, Download, ZoomIn, ZoomOut, Maximize2, AlertTriangle, Flag, Users, Check } from 'lucide-react'
import { COHORT, cohortBand, BANDS, COHORT_TASKS, DOMAINS, FLAGS, TASKS } from '../data.js'
import { pct, Meter, Seg, Skeleton, Empty, Callout, TierChip } from '../ui.jsx'

export default function Cockpit({ state }) {
  if (state === 'Chargement') return <div className="page stack" aria-busy="true"><div className="label">Cockpit formateur</div><Skeleton h={40} w="40%" /><div className="grid-3"><Skeleton h={100} /><Skeleton h={100} /><Skeleton h={100} /></div><Skeleton h={320} /></div>
  if (state === 'Erreur') return <div className="page stack"><div className="label">Cockpit formateur</div><h1>Cohorte PMP-2026-A</h1><Callout kind="warm" icon={AlertTriangle}>Impossible de charger la cohorte. Le serveur se réveille peut-être. <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 8 }}>Réessayer</button></Callout></div>
  if (state === 'Cohorte vide') return <div className="page stack"><div className="label">Cockpit formateur</div><h1>Votre cohorte est vide pour l’instant.</h1><Empty icon={Users} title="Aucun apprenant rattaché" action={<div className="row" style={{ justifyContent: 'center' }}><a href="#invitations" className="btn btn-primary"><Mail size={16} aria-hidden="true" /> Inviter des apprenants</a><button type="button" className="btn btn-secondary">Configurer la cohorte de démonstration</button></div>}>Invitez vos apprenants par lien ou par code de classe. Pour explorer le cockpit avant, une cohorte de démonstration (données « Exemple ») peut être créée en un clic.</Empty></div>
  const tab = { Constellation: 'map', "Groupes d'action": 'groups', Heatmap: 'heat', 'Qualité des questions': 'quality' }[state] || 'map'
  const L = COHORT.learners
  const mean = L.reduce((s, l) => s + l.readiness, 0) / L.length
  const ready = L.filter(l => l.readiness >= 0.85).length, risk = L.filter(l => l.readiness < 0.5).length, active = L.filter(l => l.inactive <= 7).length
  const fragile = [...COHORT_TASKS].filter(t => t.tested).sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)).sort((a, b) => a.avg - b.avg).slice(0, 3)
  return (
    <div className="page" style={{ maxWidth: 1240 }}>
      <div className="page-head">
        <div><div className="label">Cockpit formateur · cohorte <span className="num">PMP-2026-A</span> · {L.length} apprenants · examen le 14 nov.</div><h1>Ce qui bloque la cohorte, et quoi faire aujourd’hui.</h1></div>
        <div className="row"><a href="#seance-ciblee" className="btn btn-primary"><Plus size={16} aria-hidden="true" /> Créer une séance ciblée</a><a href="#invitations" className="btn btn-secondary"><Mail size={16} aria-hidden="true" /> Inviter</a></div>
      </div>

      <div className="grid-main" style={{ '--aside-w': '340px' }}>
        <div className="stack">
          <section className="grid-3" aria-label="Indicateurs">
            {[['Préparation moyenne', pct(mean), 'indicateur Certifizer', mean < 0.5 ? 1 : mean < 0.7 ? 2 : 3], ['Prêt·es', `${ready}`, `sur ${L.length} · ≥ 85 %`, 4], ['À risque', `${risk}`, '< 50 % ou inactifs', 1]].map(([k, v, s, t]) => <div key={k} className="card" style={{ padding: 'var(--s-4)' }}><div className="label">{k}</div><div className={`display num tier-${t}`} style={{ fontSize: 'var(--t-3xl)', marginTop: 4 }}>{v}</div><div className="small subtle">{s}</div></div>)}
          </section>

          <section className="card" aria-labelledby="h-tabs">
            <div className="card-head" style={{ alignItems: 'center' }}>
              <h2 id="h-tabs" style={{ fontSize: 'var(--t-xl)' }}>{tab === 'map' ? 'Constellation de la cohorte' : tab === 'groups' ? 'Groupes d’action' : tab === 'heat' ? 'Carte de chaleur par tâche' : 'Qualité des questions'}</h2>
              <Seg size="sm" label="Vue" value={tab} onChange={() => {}} options={[{ value: 'map', label: 'Constellation' }, { value: 'groups', label: 'Groupes' }, { value: 'heat', label: 'Heatmap' }, { value: 'quality', label: 'Qualité' }]} />
            </div>
            {tab === 'map' && <Constellation />}
            {tab === 'groups' && <Groups />}
            {tab === 'heat' && <Heat />}
            {tab === 'quality' && <Quality />}
          </section>
        </div>

        <aside className="stack" aria-label="Brief du jour">
          <section className="card"><div className="label">Brief du jour</div><p style={{ marginTop: 8 }}>{active} apprenants actifs sur 7 jours. Le chemin critique collectif commence par <strong>{fragile[0].fr}</strong> : {fragile[0].fragile} apprenants fragiles sur {fragile[0].tested} testés.</p></section>
          <section className="card"><h3 style={{ fontSize: 'var(--t-lg)' }}>Ce qui bloque le plus</h3><ul className="list" style={{ marginTop: 8 }}>{fragile.map(t => <li key={t.id} style={{ display: 'block' }}><div className="row between small"><span style={{ fontWeight: 500 }}>{t.fr}</span><span className="num subtle">{pct(t.avg)}</span></div><Meter value={t.avg} tier={t.avg < 0.5 ? 1 : t.avg < 0.75 ? 2 : 3} thin /><div className="small subtle" style={{ marginTop: 4 }}>{t.fragile}/{t.tested} fragiles · {DOMAINS.find(d => d.id === t.domain).fr}</div></li>)}</ul></section>
          <section className="card"><h3 style={{ fontSize: 'var(--t-lg)' }}>Interventions suggérées</h3><ul className="stack-sm" style={{ marginTop: 8 }}>
            {[['Priorité 1', `Mini-séance · ${fragile[0].fr}`, 'Planifier 20 min', '#seance-ciblee'], ['Suivi', `${risk} apprenants à risque`, 'Voir le groupe', '#cockpit'], ['Qualité', `${FLAGS.length} questions signalées`, 'Ouvrir la revue', '#cockpit']].map(([tag, t, cta, href]) => <li key={t} className="row between" style={{ gap: 8 }}><div><div className="label">{tag}</div><div className="small">{t}</div></div><a href={href} className="btn btn-sm btn-secondary">{cta}</a></li>)}
          </ul></section>
          <section className="card card-quiet"><h3 style={{ fontSize: 'var(--t-lg)' }}>Séances ciblées</h3><ul className="list" style={{ marginTop: 8 }}><li className="small"><span>Risques &amp; obstacles · 8 questions</span><span className="num subtle" style={{ marginLeft: 'auto' }}>9/14 terminées</span></li><li className="small"><span>Périmètre · 10 questions</span><span className="num tier-3" style={{ marginLeft: 'auto' }}>14/14</span></li></ul></section>
        </aside>
      </div>
    </div>
  )
}

/* Constellation: learners as stars around task clusters; zoom, pan, export (SVG). */
function Constellation() {
  const [z, setZ] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [sel, setSel] = useState(null)
  const svgRef = useRef(null)
  const drag = useRef(null)
  const W = 760, H = 460
  const nodes = useMemo(() => {
    const hubs = DOMAINS.map((d, i) => ({ id: d.id, x: 180 + i * 200, y: 140 + (i % 2) * 150, label: d.fr }))
    const stars = COHORT.learners.map((l, i) => {
      const hub = hubs[i % 3]; const a = (i / COHORT.learners.length) * Math.PI * 2 + i; const rr = 70 + (1 - l.readiness) * 60
      return { ...l, id: `l${i}`, x: hub.x + Math.cos(a) * rr, y: hub.y + Math.sin(a) * rr * 0.75, hub: hub.id }
    })
    return { hubs, stars }
  }, [])
  const onDown = (e) => { drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y } }
  const onMove = (e) => { if (drag.current) setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }) }
  const onUp = () => { drag.current = null }
  const exportSvg = () => {
    try { const s = new XMLSerializer().serializeToString(svgRef.current); const blob = new Blob([s], { type: 'image/svg+xml' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'constellation-PMP-2026-A.svg'; a.click() } catch {}
  }
  const tierOf = (r) => r < 0.5 ? 1 : r < 0.7 ? 2 : r < 0.85 ? 3 : 4
  const selected = nodes.stars.find(s => s.id === sel)
  return (
    <div className="stack-sm">
      <div className="row between">
        <p className="small subtle">Chaque étoile est un apprenant ; sa distance au domaine dit sa préparation. Glissez pour déplacer, molette ou boutons pour zoomer.</p>
        <div className="row" style={{ gap: 4 }}>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Zoom avant" onClick={() => setZ(Math.min(3, z * 1.25))}><ZoomIn size={18} aria-hidden="true" /></button>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Zoom arrière" onClick={() => setZ(Math.max(0.5, z / 1.25))}><ZoomOut size={18} aria-hidden="true" /></button>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Réinitialiser la vue" onClick={() => { setZ(1); setPan({ x: 0, y: 0 }) }}><Maximize2 size={18} aria-hidden="true" /></button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportSvg}><Download size={14} aria-hidden="true" /> Exporter (SVG)</button>
        </div>
      </div>
      <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', overflow: 'hidden', touchAction: 'none' }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onWheel={(e) => { if (e.ctrlKey || e.deltaY) { setZ(Math.min(3, Math.max(0.5, z * (e.deltaY < 0 ? 1.1 : 0.9)))) } }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" role="group" aria-label="Constellation de la cohorte PMP-2026-A : 14 apprenants autour de 3 domaines" style={{ display: 'block', cursor: 'grab' }}>
          <g transform={`translate(${pan.x} ${pan.y}) translate(${W / 2} ${H / 2}) scale(${z}) translate(${-W / 2} ${-H / 2})`}>
            {nodes.stars.map(s => { const h = nodes.hubs.find(x => x.id === s.hub); return <line key={s.id} x1={h.x} y1={h.y} x2={s.x} y2={s.y} stroke="var(--line-strong)" strokeWidth="1" opacity="0.6" /> })}
            {nodes.hubs.map(h => <g key={h.id}><circle cx={h.x} cy={h.y} r="26" fill="var(--surface)" stroke={`var(--dom-${h.id === 'business' ? 'be' : h.id})`} strokeWidth="2" /><text x={h.x} y={h.y + 4} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink)">{h.label.split(' ')[0]}</text></g>)}
            {nodes.stars.map(s => (
              <g key={s.id} role="button" tabIndex={0} aria-label={`${s.name} : ${pct(s.readiness)}${s.inactive > 7 ? `, inactif depuis ${s.inactive} jours` : ''}`} onClick={() => setSel(s.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(s.id) } }} style={{ cursor: 'pointer' }}>
                <circle cx={s.x} cy={s.y} r={sel === s.id ? 11 : 8} fill={`var(--tier-${tierOf(s.readiness)})`} stroke={s.inactive > 7 ? 'var(--ink)' : 'var(--surface)'} strokeWidth="2" strokeDasharray={s.inactive > 7 ? '2 2' : undefined} />
                <text x={s.x} y={s.y + 20} textAnchor="middle" fontSize="10" fontFamily="var(--font-body)" fill="var(--ink-2)">{s.name.split(' ')[0]}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>
      <div className="row between">
        <div className="row small subtle" style={{ gap: 14 }}>{[1,2,3,4].map(t => <span key={t} className="row" style={{ gap: 6 }}><span className={`dot bg-tier-${t}`} aria-hidden="true" />{['','Pas encore prêt·e','En construction','Presque prêt·e','Prêt·e pour l’examen'][t]}</span>)}<span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: 'transparent', border: '1.5px dashed var(--ink)' }} aria-hidden="true" />Inactif &gt; 7 j</span></div>
        {selected && <div className="row small" aria-live="polite"><strong>{selected.name}</strong><TierChip tier={tierOf(selected.readiness)}>{pct(selected.readiness)}</TierChip><span className="subtle">{selected.attempts} réponses · {selected.inactive === 0 ? 'actif aujourd’hui' : `inactif ${selected.inactive} j`}</span></div>}
      </div>
    </div>
  )
}

function Groups() {
  return (
    <div className="grid-2" style={{ gap: 'var(--s-4)' }}>
      {BANDS.map(b => { const ls = COHORT.learners.filter(l => cohortBand(l) === b.id); return (
        <div key={b.id} className="card card-quiet" style={{ padding: 'var(--s-4)' }}>
          <div className="row between"><div><strong className={`tier-${b.tier}`}>{b.fr}</strong><div className="small subtle">{b.sub}</div></div><span className="display num" style={{ fontSize: 'var(--t-2xl)' }}>{ls.length}</span></div>
          <ul className="list" style={{ marginTop: 8 }}>{ls.length ? ls.map(l => <li key={l.name} style={{ padding: '6px 0' }} className="small"><span className="avatar" aria-hidden="true" style={{ width: 26, height: 26, fontSize: 10 }}>{l.initials}</span><span style={{ flex: 1 }}>{l.name}{l.inactive > 7 && <span className="subtle"> · {l.inactive} j</span>}</span><span className="num subtle">{pct(l.readiness)}</span></li>) : <li className="small subtle">aucun</li>}</ul>
        </div>) })}
    </div>
  )
}

function Heat() {
  const steps = (v, tested) => tested === 0 ? 'var(--surface-2)' : `color-mix(in srgb, var(--tier-${v < 0.5 ? 1 : v < 0.75 ? 2 : 3}) ${30 + Math.round(v * 60)}%, var(--surface))`
  return (
    <div className="stack-sm">
      <p className="small subtle">Moyenne de la cohorte par tâche officielle. Gris : tâche jamais pratiquée par la cohorte. Détail par apprenant au survol ou au clavier.</p>
      <div className="table-wrap" tabIndex={0} aria-label="Tableau, défilement horizontal possible"><table className="table" style={{ fontSize: 'var(--t-xs)' }}>
        <caption className="sr-only">Carte de chaleur : moyenne par tâche et par domaine</caption>
        <thead><tr><th scope="col">Domaine</th><th scope="col" colSpan={10}>Tâches</th></tr></thead>
        <tbody>{DOMAINS.map(d => <tr key={d.id}><th scope="row" style={{ whiteSpace: 'normal' }}>{d.fr}</th>{COHORT_TASKS.filter(t => t.domain === d.id).map(t => <td key={t.id} style={{ padding: 4 }}><button type="button" className="num" title={`${t.fr}`} aria-label={`${t.id} ${t.fr} : ${t.tested ? pct(t.avg) : 'non pratiquée'}`} style={{ width: '100%', minHeight: 44, borderRadius: 6, background: steps(t.avg, t.tested), color: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{t.id}<br />{t.tested ? Math.round(t.avg * 100) : '—'}</button></td>)}{d.tasks < 10 && <td colSpan={10 - d.tasks} />}</tr>)}</tbody>
      </table></div>
    </div>
  )
}

function Quality() {
  return (
    <ul className="list">
      {FLAGS.map(f => <li key={f.id}><Flag size={16} aria-hidden="true" style={{ color: 'var(--ink-3)' }} /><div style={{ flex: 1, minWidth: 0 }}><div className="small"><span className="label">{f.id}</span> · {f.count} signalement{f.count > 1 ? 's' : ''} · {TASKS.find(t => t.id === f.id.split('-')[2].replace('.', '')).fr}</div><div className="small subtle">« {f.reason} »</div></div><button type="button" className="btn btn-sm btn-secondary">Ouvrir</button></li>)}
      <li className="small subtle">Les questions signalées restent servies jusqu’à votre décision ; une question mise en quarantaine disparaît des séances.</li>
    </ul>
  )
}
