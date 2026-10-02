import React, { useState } from 'react'
import { ArrowUp, ArrowDown, RefreshCw, X, Plus, Sparkles, Check, Search } from 'lucide-react'
import { BANK, TASKS, COHORT, DOMAINS } from '../data.js'
import { Empty, Callout, Toast } from '../ui.jsx'

const DIFF = ['', 'Fondamental', 'Intermédiaire', 'Avancé']
export default function SeanceCiblee({ state }) {
  const items = state === 'Liste vide' ? [] : BANK.slice(0, 3)
  const [recip, setRecip] = useState(COHORT.learners.map(() => true))
  const panel = state === 'Banque' ? 'bank' : (state === 'Ma question' || state === 'Correction proposée') ? 'author' : null
  const n = recip.filter(Boolean).length
  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-head"><div><div className="label">Séance ciblée · cohorte PMP-2026-A</div><h1>Composez votre séance.</h1></div><p className="small subtle" style={{ maxWidth: '36ch' }}>Vos apprenants recevront exactement ces questions, dans cet ordre.</p></div>
      <div className="grid-main" style={{ '--aside-w': '320px' }}>
        <div className="stack">
          <div className="field"><label htmlFor="sc-title">Titre</label><input id="sc-title" className="input" defaultValue="Risques & obstacles — révision ciblée" /></div>
          <section className="card" aria-labelledby="sc-q">
            <div className="card-head"><h2 id="sc-q" style={{ fontSize: 'var(--t-xl)' }}>{items.length} questions</h2><div className="row"><button type="button" className="btn btn-secondary btn-sm" aria-pressed={panel === 'bank'}><Plus size={14} aria-hidden="true" /> Ajouter depuis la banque</button><button type="button" className="btn btn-secondary btn-sm" aria-pressed={panel === 'author'}>Créer ma question</button></div></div>
            {items.length === 0 ? <Empty title="Toutes les questions ont été retirées">Ajoutez-en depuis la banque auditée ou créez la vôtre.</Empty> : (
              <ol className="list">
                {items.map((q, i) => <li key={q.id} style={{ alignItems: 'start' }}>
                  <div className="row" style={{ flexDirection: 'column', gap: 2 }} aria-label="Réordonner"><button type="button" className="btn btn-ghost btn-icon" style={{ width: 32, minHeight: 32 }} aria-label={`Monter la question ${i + 1}`} disabled={i === 0}><ArrowUp size={14} aria-hidden="true" /></button><button type="button" className="btn btn-ghost btn-icon" style={{ width: 32, minHeight: 32 }} aria-label={`Descendre la question ${i + 1}`} disabled={i === items.length - 1}><ArrowDown size={14} aria-hidden="true" /></button></div>
                  <div style={{ flex: 1, minWidth: 0 }}><div>{q.prompt}</div><div className="row small subtle" style={{ marginTop: 4 }}><span className="chip chip-outline" style={{ minHeight: 22, fontSize: 11 }}>{q.task} · {TASKS.find(t => t.id === q.task).fr}</span><span className="chip" style={{ minHeight: 22, fontSize: 11 }}>{DIFF[q.difficulty]}</span></div>
                    {state === 'Suggestion ↻' && i === 1 && <div className="card card-quiet" style={{ marginTop: 10, padding: 'var(--s-3)' }}><div className="label">Suggestion · même tâche, niveau proche</div><p className="small" style={{ marginTop: 4 }}>{BANK[3].prompt}</p><div className="row" style={{ marginTop: 8 }}><button type="button" className="btn btn-primary btn-sm">Remplacer</button><button type="button" className="btn btn-ghost btn-sm">Autre suggestion</button><button type="button" className="btn btn-ghost btn-sm">Garder l’originale</button></div></div>}
                  </div>
                  <div className="row" style={{ gap: 2 }}><button type="button" className="btn btn-ghost btn-icon" aria-label={`Suggérer un remplacement pour la question ${i + 1}`}><RefreshCw size={16} aria-hidden="true" /></button><button type="button" className="btn btn-ghost btn-icon" aria-label={`Retirer la question ${i + 1}`}><X size={16} aria-hidden="true" /></button></div>
                </li>)}
              </ol>
            )}
          </section>
          {panel === 'bank' && <section className="card" aria-labelledby="sc-bank"><h2 id="sc-bank" style={{ fontSize: 'var(--t-xl)' }}>Banque auditée · 150 questions</h2>
            <div className="row" style={{ marginTop: 12 }}><label className="sr-only" htmlFor="bank-q">Rechercher</label><div style={{ position: 'relative', flex: 1, minWidth: 200 }}><Search size={16} aria-hidden="true" style={{ position: 'absolute', left: 12, top: 14, color: 'var(--ink-3)' }} /><input id="bank-q" className="input" style={{ paddingLeft: 36 }} placeholder="Rechercher un énoncé…" /></div><label className="sr-only" htmlFor="bank-dom">Domaine</label><select id="bank-dom" className="select" style={{ width: 'auto' }}><option>Tous les domaines</option>{DOMAINS.map(d => <option key={d.id}>{d.fr}</option>)}</select><label className="sr-only" htmlFor="bank-diff">Niveau</label><select id="bank-diff" className="select" style={{ width: 'auto' }}><option>Tous niveaux</option>{DIFF.slice(1).map(d => <option key={d}>{d}</option>)}</select></div>
            <ul className="list" style={{ marginTop: 8 }}>{BANK.map(q => <li key={q.id}><div style={{ flex: 1, minWidth: 0 }} className="small">{q.prompt}<div className="subtle">{q.task} · {DIFF[q.difficulty]}</div></div><button type="button" className="btn btn-sm btn-secondary"><Plus size={14} aria-hidden="true" /> Ajouter</button></li>)}</ul>
          </section>}
          {panel === 'author' && <section className="card" aria-labelledby="sc-auth"><h2 id="sc-auth" style={{ fontSize: 'var(--t-xl)' }}>Ma question</h2><p className="small subtle" style={{ marginTop: 4 }}>Reste dans votre organisation ; n’alimente jamais le moteur adaptatif global.</p>
            <form className="stack-sm" style={{ marginTop: 12 }} onSubmit={e => e.preventDefault()}>
              <div className="field"><label htmlFor="a-prompt">Énoncé</label><textarea id="a-prompt" className="textarea" defaultValue="Le comité de pilotage demande un reporting hebdomadaire alors que le plan prévoit un reporting mensuel. Que fais tu en premier ?" /></div>
              <fieldset style={{ border: 0, padding: 0 }} className="stack-sm"><legend className="small" style={{ fontWeight: 500 }}>Réponses (cochez la bonne)</legend>{['Refuser : le plan de communication fait foi.', 'Mettre à jour le plan de communication après avoir compris le besoin du comité.', 'Produire les deux reportings sans rien changer.', 'Escalader au sponsor.'].map((o, i) => <div key={i} className="row"><input type="radio" name="good" id={`a-good-${i}`} defaultChecked={i === 1} style={{ width: 20, height: 20 }} /><label htmlFor={`a-good-${i}`} className="sr-only">Bonne réponse {i + 1}</label><input className="input" aria-label={`Réponse ${i + 1}`} defaultValue={o} /></div>)}</fieldset>
              <div className="field"><label htmlFor="a-expl">Explication</label><textarea id="a-expl" className="textarea" style={{ minHeight: 80 }} defaultValue="Un besoin de communication nouveau se traite dans le plan (PE8), pas par un refus ni par du travail en double." /></div>
              <div className="row"><div className="field" style={{ flex: 1 }}><label htmlFor="a-task">Tâche ECO</label><select id="a-task" className="select"><option>PE8 · Planifier et gérer la communication</option></select></div><div className="field" style={{ flex: 1 }}><label htmlFor="a-diff">Niveau</label><select id="a-diff" className="select"><option>Intermédiaire</option></select></div></div>
              {state === 'Correction proposée' && <Callout kind="accent" icon={Sparkles}><strong>Correction proposée</strong> · orthographe, vouvoiement, forme d’examen.<p style={{ marginTop: 6 }}>« Le comité de pilotage demande un reporting hebdomadaire alors que le plan prévoit un reporting mensuel. Que faites-vous en premier ? »</p><div className="row" style={{ marginTop: 8 }}><button type="button" className="btn btn-primary btn-sm">Appliquer</button><button type="button" className="btn btn-ghost btn-sm">Garder ma version</button></div></Callout>}
              <div className="row"><button type="button" className="btn btn-secondary"><Sparkles size={16} aria-hidden="true" /> Corriger la formulation</button><button type="submit" className="btn btn-primary">Ajouter à la séance</button><button type="button" className="btn btn-ghost">Annuler</button></div>
              <p className="small subtle">La correction est une proposition de l’IA ; elle n’est jamais imposée.</p>
            </form></section>}
        </div>
        <aside className="stack" aria-label="Destinataires">
          <section className="card"><div className="card-head"><h2 style={{ fontSize: 'var(--t-lg)' }}>Destinataires · {n}</h2><div className="row" style={{ gap: 4 }}><button type="button" className="btn btn-ghost btn-sm" onClick={() => setRecip(recip.map(() => true))}>Tous</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setRecip(recip.map(() => false))}>Aucun</button></div></div>
            <ul className="list">{COHORT.learners.map((l, i) => <li key={l.name} style={{ padding: '4px 0' }}><input type="checkbox" id={`r-${i}`} checked={recip[i]} onChange={() => setRecip(recip.map((v, j) => j === i ? !v : v))} style={{ width: 20, height: 20 }} /><label htmlFor={`r-${i}`} className="small" style={{ flex: 1, minHeight: 36, display: 'flex', alignItems: 'center' }}>{l.name}</label><span className={`small num tier-${l.readiness < 0.5 ? 1 : l.readiness < 0.75 ? 2 : 3}`}>{l.readiness < 0.5 ? 'à risque' : l.readiness < 0.75 ? 'en construction' : 'prêt·e'}</span></li>)}</ul>
          </section>
          <div className="row"><button type="button" className="btn btn-primary" disabled={!items.length || !n}>Assigner à {n} apprenant{n > 1 ? 's' : ''} ({items.length} questions)</button><a href="#cockpit" className="btn btn-ghost">Annuler</a></div>
        </aside>
      </div>
    </div>
  )
}
