import React, { useState } from 'react'
import { Send, RotateCcw, BookOpen, Puzzle, Lightbulb, Scale, Plus, Check, AlertTriangle, Quote, Trash2, FileText, ChevronRight } from 'lucide-react'
import { REFLEXES, DELIVERABLES, EVIDENCE_STATES, TASKS } from '../data.js'
import { Callout, Empty, Seg } from '../ui.jsx'

const MODES = {
  expliquer: { icon: BookOpen, title: 'Expliquer', lead: 'Posez une question sur un sujet de l’ECO 2026. Le co-penseur explique, cite la tâche concernée et vous renvoie vers la pratique.', starter: 'Expliquez-moi la différence entre risque et obstacle, avec un exemple de chantier.' },
  scenario: { icon: Puzzle, title: 'Cas d’examen', lead: 'Un scénario au format de l’examen, puis la correction raisonnée. Chaque cas est rattaché à une tâche officielle.', starter: 'Donnez-moi un cas d’examen sur la gestion des attentes des parties prenantes.' },
  relier: { icon: Lightbulb, title: 'Relier à mon projet', lead: 'Décrivez votre projet réel. Le co-penseur relie les concepts à votre situation et vous aide à produire de vrais livrables.', starter: 'Comment ce concept s’applique à mon projet ?' },
  casreel: { icon: Scale, title: 'Cas réel', lead: 'Une situation vécue, lue depuis un siège. Six étapes : cadrer, situer, diagnostiquer, explorer, concevoir, décider. Vous gardez un réflexe.', starter: 'Mon sponsor veut avancer la date de livraison de six semaines sans budget supplémentaire.' },
}
const SEATS = [{ value: 'moa', label: 'Maître d’ouvrage', hint: 'Vous possédez l’actif, le budget, la valeur.' }, { value: 'moe', label: 'Maître d’œuvre', hint: 'Vous portez l’exécution et le contrat.' }, { value: 'both', label: 'Les deux angles', hint: 'Comparez les deux sièges côte à côte.' }]

const CONVO = {
  expliquer: [
    ['user', 'Quelle est la différence entre un risque et un obstacle ?'],
    ['ai', 'Un risque est un événement incertain qui pourrait se produire ; un obstacle est une situation qui bloque déjà le travail. Dans l’ECO 2026, les risques relèvent de BE5 (planifier et gérer les risques) et les obstacles de BE4 (lever les obstacles et gérer les problèmes).\n\nSur votre station de pompage : « le fournisseur pourrait livrer en retard » est un risque ; « le fournisseur a annoncé trois semaines de retard » est un obstacle. Le premier se planifie, le second se lève.\n\nPour ancrer la distinction, essayez une question BE4 en mode Me tester.'],
  ],
  scenario: [
    ['user', 'Un cas d’examen sur les attentes des parties prenantes.'],
    ['ai', 'Scénario. Vous dirigez le déploiement d’un logiciel de paie. Le directeur financier attend une mise en service au 1er du mois ; l’équipe technique estime deux semaines de plus. Il n’a pas été consulté sur l’estimation.\n\nQuelle est la meilleure action ?\nA. Imposer la date du 1er à l’équipe.\nB. Rencontrer le directeur financier pour aligner l’attente sur l’estimation et ses hypothèses.\nC. Mettre en service une version partielle sans l’en informer.\nD. Escalader au sponsor.\n\nRépondez, puis je vous donne la correction raisonnée (PE5 · Aligner les attentes des parties prenantes).'],
  ],
  relier: [
    ['user', 'Comment la gouvernance de projet s’applique à ma rénovation de station de pompage ?'],
    ['ai', 'Dans votre projet, la gouvernance (BE1) répond à trois questions : qui décide quoi, à quel moment, sur quelle base. Concrètement : un comité de pilotage mensuel avec le maître d’ouvrage et l’exploitant ; des seuils de décision (tout écart supérieur à 10 % du budget remonte au comité) ; une charte qui fixe le périmètre de haut niveau.\n\nVoulez-vous que nous rédigions la charte de projet à partir de ces éléments ? Elle ira dans vos livrables.'],
  ],
  casreel: [
    ['user', 'Mon sponsor veut avancer la livraison de six semaines sans budget supplémentaire.'],
    ['ai', 'Cadrons. Depuis le siège du maître d’ouvrage, la question n’est pas « peut-on » mais « que vaut six semaines de plus tôt, et que coûte-t-il de les obtenir ».\n\nSituons : quelles activités portent le chemin critique ? Diagnostiquons : la demande vient-elle d’un engagement externe ou d’une préférence ? Explorons : compression (crashing) ou chevauchement (fast-tracking) ; chacune a un prix, en argent ou en risque.\n\n⟡ Réflexe : avant de répondre au sponsor, je qualifie l’impact sur le chemin critique, pas seulement sur la tâche.'],
  ],
}

export default function Chat({ route, state }) {
  const mode = route.hash
  const M = MODES[mode]
  const Icon = M.icon
  const [seat, setSeat] = useState('moa')
  const [text, setText] = useState('')
  const empty = state === 'Vide' || state === 'Sans projet' || state === 'Choisir un siège'
  const loading = state === 'Réflexion…'
  const error = state === 'Erreur'
  const msgs = empty ? [] : CONVO[mode]
  const savedReflex = state === 'Réflexe sauvé'
  return (
    <div className="page">
      <div className="page-head"><div><div className="label">{M.title}</div><h1 style={{ maxWidth: '22ch' }}>{M.title === 'Cas réel' ? 'Une situation vécue, lue depuis un siège.' : M.title === 'Relier à mon projet' ? 'Votre projet, vos livrables.' : M.title === 'Expliquer' ? 'Comprendre avant de retenir.' : 'Au format de l’examen.'}</h1></div></div>
      <div className="grid-main">
        <section className="stack" aria-label="Conversation">
          {empty && (
            <Empty icon={Icon} title={M.title === 'Cas réel' ? 'Choisissez un siège, puis décrivez votre cas' : M.title === 'Relier à mon projet' ? 'Décrivez votre projet dans le panneau de droite' : 'Choisissez un sujet, puis posez votre question'} action={<button type="button" className="btn btn-secondary" onClick={() => setText(M.starter)}>{M.starter}</button>}>{M.lead}</Empty>
          )}
          {msgs.map(([who, t], i) => (
            <div key={i} className={who === 'user' ? 'msg msg-user' : 'msg msg-ai'}>
              {who === 'ai' && <div className="label" style={{ marginBottom: 6 }}>Co-penseur · IA</div>}
              <p style={{ whiteSpace: 'pre-wrap' }}>{t}</p>
              {who === 'ai' && mode === 'casreel' && (state === 'Réflexe proposé' || savedReflex) && (
                <div className="row" style={{ marginTop: 12 }}>
                  <button type="button" className={savedReflex ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'} disabled={savedReflex}>{savedReflex ? <><Check size={14} aria-hidden="true" /> Sauvé dans mes réflexes</> : <><Plus size={14} aria-hidden="true" /> Sauver dans mes réflexes</>}</button>
                </div>
              )}
              {who === 'ai' && mode === 'relier' && state === 'Livrable en cours' && <div className="row" style={{ marginTop: 12 }}><button type="button" className="btn btn-primary btn-sm"><FileText size={14} aria-hidden="true" /> Rédiger la charte de projet</button></div>}
            </div>
          ))}
          {loading && <div className="msg msg-ai" aria-live="polite"><div className="label" style={{ marginBottom: 6 }}>Co-penseur · IA</div><p className="subtle">Réflexion…</p></div>}
          {error && <Callout kind="warm" icon={AlertTriangle}>Connexion impossible. Votre message est conservé dans le champ ci-dessous ; réessayez.</Callout>}
          <form className="card" style={{ padding: 'var(--s-3)', position: 'sticky', bottom: 'calc(64px + var(--s-3))' }} onSubmit={e => e.preventDefault()}>
            <label htmlFor="chat-input" className="sr-only">Votre message</label>
            <textarea id="chat-input" className="textarea" style={{ minHeight: 56, border: 0, padding: '8px 10px' }} placeholder={mode === 'casreel' ? 'Décrivez votre situation réelle : contexte, contrainte, décision en jeu…' : 'Posez votre question…'} value={text} onChange={e => setText(e.target.value)} />
            <div className="row between" style={{ marginTop: 8 }}>
              <div className="row small subtle">{msgs.length > 0 && <button type="button" className="btn btn-ghost btn-sm"><RotateCcw size={14} aria-hidden="true" /> Recommencer</button>}<span>Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne</span></div>
              <button type="submit" className="btn btn-primary" aria-label="Envoyer"><Send size={18} aria-hidden="true" /> Envoyer</button>
            </div>
          </form>
          <p className="small subtle">Les réponses sont générées par une IA à partir de l’ECO 2026 et du PMBOK. Elles peuvent se tromper ; votre formateur reste le juge.</p>
        </section>
        <aside className="stack" aria-label="Contexte">
          {mode === 'casreel' && <>
            <div className="card">
              <div className="label">Depuis quel siège ?</div>
              <div role="radiogroup" aria-label="Siège" className="stack-sm" style={{ marginTop: 8 }}>
                {SEATS.map(s => <button type="button" key={s.value} role="radio" aria-checked={seat === s.value} className="choice" onClick={() => setSeat(s.value)}><span className="choice-key" aria-hidden="true">{seat === s.value ? <Check size={14} /> : ''}</span><span><strong>{s.label}</strong><br /><span className="small subtle">{s.hint}</span></span></button>)}
              </div>
              <p className="small subtle" style={{ marginTop: 8 }}>Changer de siège recommence la conversation.</p>
            </div>
            <div className="card">
              <div className="card-head"><h3 style={{ fontSize: 'var(--t-lg)' }}>Mes réflexes · {REFLEXES.length}</h3></div>
              <ul className="stack-sm">{REFLEXES.map((r, i) => <li key={i} style={{ display: 'flex', gap: 8 }}><Quote size={14} aria-hidden="true" style={{ flex: 'none', marginTop: 5, color: 'var(--ink-3)' }} /><div style={{ flex: 1 }}><p className="small">{r.text}</p><div className="small subtle">{r.seatLabel} · {r.at}</div></div><button type="button" className="btn btn-ghost btn-icon" aria-label={`Supprimer le réflexe ${i + 1}`}><Trash2 size={14} aria-hidden="true" /></button></li>)}</ul>
            </div>
          </>}
          {mode === 'relier' && <>
            <div className="card">
              <label htmlFor="proj" className="label">Mon projet</label>
              <textarea id="proj" className="textarea" style={{ marginTop: 8 }} placeholder="Ex. : réhabilitation d’une station de pompage, équipe de 8, 14 mois, maître d’ouvrage public…" defaultValue={state === 'Sans projet' ? '' : 'Réhabilitation d’une station de pompage, équipe de 8, 14 mois, maître d’ouvrage public, fournisseur unique pour les pompes. (Exemple)'} />
              <p className="small subtle" style={{ marginTop: 8 }}>Partagé avec « Cas réel ». Ne collez pas de document confidentiel : ce texte est envoyé à l’IA.</p>
            </div>
            <div className="card">
              <div className="card-head"><div><h3 style={{ fontSize: 'var(--t-lg)' }}>Mes livrables</h3><p className="small subtle">Proposition · le produit ne les enregistre pas encore</p></div></div>
              <ul className="list">
                {DELIVERABLES.map(d => <li key={d.id}><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 500 }}>{d.fr}</div><div className="small subtle">{TASKS.find(t => t.id === d.task).id} · {d.hint}</div></div><span className={`chip ${d.state === 'applique' ? 'chip-accent' : d.state === 'compris' ? '' : 'chip-outline'}`}>{EVIDENCE_STATES.find(e => e[0] === d.state)[1]}</span></li>)}
              </ul>
              <p className="small subtle" style={{ marginTop: 10 }}>Carte de preuves, pas barre de progression : Découvert → Compris → Appliqué → Validé → Retenu → Transféré. « Validé » et au-delà n’apparaissent qu’après revue par votre formateur.</p>
            </div>
          </>}
          {(mode === 'expliquer' || mode === 'scenario') && <div className="card">
            <div className="label">Sujet</div>
            <ul className="list" style={{ marginTop: 8 }}>{['BE4', 'BE5', 'PE5', 'PR3'].map(id => { const t = TASKS.find(x => x.id === id); return <li key={id} style={{ padding: '6px 0' }}><button type="button" className="btn btn-ghost btn-sm" aria-pressed={id === 'BE4'} style={{ justifyContent: 'start', flex: 1, textAlign: 'left', whiteSpace: 'normal', minHeight: 36 }}>{t.fr}</button><ChevronRight size={14} aria-hidden="true" style={{ color: 'var(--ink-3)' }} /></li> })}</ul>
            <a href="#parcours" className="small">Tous les sujets dans le parcours ECO</a>
          </div>}
        </aside>
      </div>
    </div>
  )
}
