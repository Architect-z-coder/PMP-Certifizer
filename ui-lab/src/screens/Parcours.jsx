import React, { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { DOMAINS, TASKS, MASTERY, LIGHT_LABEL } from '../data.js'
import { Meter, pct, LightChip, DomainTag } from '../ui.jsx'

export default function Parcours({ state }) {
  const [dom, setDom] = useState('business')
  const [sel, setSel] = useState('BE4')
  const view = state === 'Domaines' ? 'domains' : state === 'Tâches du domaine' ? 'tasks' : 'detail'
  const tasks = MASTERY.filter(m => m.domain === dom)
  const t = MASTERY.find(m => m.id === sel)
  return (
    <div className="page">
      <div className="page-head"><div><div className="label">Parcours ECO 2026</div><h1>Trois domaines, vingt-six tâches.</h1></div><p className="small subtle" style={{ maxWidth: '40ch' }}>Référentiel officiel PMI en vigueur depuis le 9 juillet 2026. Titres anglais officiels ; traductions Certifizer, non officielles.</p></div>
      {view === 'domains' ? (
        <div className="grid-3">
          {DOMAINS.map(d => {
            const ts = MASTERY.filter(m => m.domain === d.id)
            const cov = ts.filter(m => m.covered).length
            return (
              <button type="button" key={d.id} className="card" style={{ textAlign: 'left', display: 'block' }} onClick={() => setDom(d.id)}>
                <div className="display num" style={{ fontSize: 'var(--t-4xl)', color: `var(--dom-${d.id === 'business' ? 'be' : d.id})` }}>{Math.round(d.weight * 100)} %</div>
                <h2 style={{ fontSize: 'var(--t-xl)', marginTop: 4 }}>{d.fr}</h2>
                <p className="small subtle">{d.en} · {d.tasks} tâches · {cov} pratiquées</p>
                <div style={{ display: 'flex', gap: 3, marginTop: 14 }} aria-hidden="true">{ts.map(m => <span key={m.id} className={`bg-tier-${LIGHT_LABEL[m.light].tier}`} style={{ flex: 1, height: 8, borderRadius: 2 }} />)}</div>
                <p className="small" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>Ouvrir les tâches <ArrowRight size={14} aria-hidden="true" /></p>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="grid-main" data-left="" style={{ '--aside-w': 'minmax(0, 360px)' }}>
          <div className="stack-sm">
            <button type="button" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}><ArrowLeft size={14} aria-hidden="true" /> Domaines</button>
            <DomainTag id={dom} />
            <ol className="list">
              {tasks.map((m, i) => (
                <li key={m.id} style={{ padding: '6px 0' }}>
                  <button type="button" className="btn btn-ghost" aria-current={m.id === sel ? 'true' : undefined} onClick={() => setSel(m.id)} style={{ justifyContent: 'start', flex: 1, textAlign: 'left', whiteSpace: 'normal', background: m.id === sel ? 'var(--accent-soft)' : undefined, color: m.id === sel ? 'var(--accent-soft-ink)' : undefined }}>
                    <span className="label" style={{ width: 34, color: 'inherit', opacity: 0.7 }}>{m.id}</span><span style={{ flex: 1 }}>{m.fr}</span><span className={`small num tier-${LIGHT_LABEL[m.light].tier}`}>{m.attempts ? pct(m.score) : '—'}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <article className="card card-lg stack" aria-live="polite">
            <div className="row between"><LightChip light={t.light} /><span className="label">{t.id} · {t.enablers} facilitateurs</span></div>
            <div><h2>{t.fr}</h2><p className="muted" style={{ marginTop: 4 }}>{t.en}</p></div>
            <div><div className="row between small"><span>Votre réussite sur cette tâche</span><span className="num">{t.attempts ? `${pct(t.score)} · ${t.attempts} réponses` : 'jamais pratiquée'}</span></div><Meter value={t.score} tier={LIGHT_LABEL[t.light].tier} /></div>
            <p className="muted">Les questions de cette tâche sont rattachées à un facilitateur officiel précis. Une question « rattachement approximatif » ne prouve pas la couverture de la tâche et pèse moins dans votre maîtrise.</p>
            <div className="row"><a href="#tester" className="btn btn-primary">Réviser cette tâche <ArrowRight size={16} aria-hidden="true" /></a><a href="#expliquer" className="btn btn-secondary">L’expliquer</a></div>
          </article>
        </div>
      )}
    </div>
  )
}
