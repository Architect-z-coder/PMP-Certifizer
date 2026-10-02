import React, { useState } from 'react'
import { Download, FileText, Check, AlertTriangle, RotateCcw } from 'lucide-react'
import { LEARNER } from '../data.js'
import { Skeleton, Switch, Seg, Callout, Modal } from '../ui.jsx'

export default function Reglages({ state, reduced, setReduced }) {
  const [lang, setLang] = useState('fr')
  const [email, setEmail] = useState('nadia@exemple.com')
  if (state === 'Chargement') return <div className="page stack" aria-busy="true"><div className="label">Réglages</div><Skeleton h={40} w="40%" /><Skeleton h={180} /><Skeleton h={120} /></div>
  if (state === 'Délai de grâce') return <Grace />
  const editing = state === 'Email en édition'
  const trainer = state === 'Formateur (test)'
  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="page-head"><div><div className="label">Réglages</div><h1>Votre compte, vos préférences, vos données.</h1></div></div>
      <div className="stack">
        <section className="card" aria-labelledby="s-compte">
          <h2 id="s-compte" style={{ fontSize: 'var(--t-xl)' }}>Mon compte</h2>
          <dl className="list" style={{ marginTop: 12 }}>
            <Row k="Nom" v={LEARNER.name} />
            <Row k="Cohorte" v="PMP-2026-A" />
            <Row k="Progression" v="9 tâches acquises sur 26 · 174 réponses" />
            <div style={{ display: 'flex', gap: 'var(--s-4)', padding: 'var(--s-3) 0', borderTop: '1px solid var(--line)', flexWrap: 'wrap', alignItems: 'start' }}>
              <dt className="muted" style={{ width: 160 }}>Email de récupération</dt>
              <dd style={{ flex: 1, minWidth: 240 }}>
                <p className="small subtle" style={{ marginBottom: 8 }}>Sert uniquement à vous reconnecter depuis un autre appareil, par lien magique. Jamais de publicité.</p>
                {editing ? <form className="row" onSubmit={e => e.preventDefault()}><label htmlFor="r-email" className="sr-only">Email</label><input id="r-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, minWidth: 200 }} /><button type="submit" className="btn btn-primary btn-sm">Lier cet email</button><button type="button" className="btn btn-ghost btn-sm">Annuler</button></form>
                  : <div className="row"><span>{email}</span><button type="button" className="btn btn-secondary btn-sm">Modifier</button><button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>Retirer</button></div>}
              </dd>
            </div>
          </dl>
        </section>

        <section className="card" aria-labelledby="s-pref">
          <h2 id="s-pref" style={{ fontSize: 'var(--t-xl)' }}>Préférences</h2>
          <div className="stack-sm" style={{ marginTop: 12 }}>
            <div className="row between"><div><div style={{ fontWeight: 500 }}>Langue</div><div className="small subtle">S’applique à toute l’interface et aux contenus générés.</div></div><Seg label="Langue" value={lang} onChange={setLang} options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} /></div>
            <div className="row between"><div><div style={{ fontWeight: 500 }}>Réduire les animations</div><div className="small subtle">Supprime les transitions et les fondus. Suit aussi le réglage de votre système.</div></div><Switch id="pref-reduced" checked={reduced} onChange={setReduced} label={reduced ? 'Activé' : 'Désactivé'} /></div>
          </div>
        </section>

        {trainer && <section className="card card-quiet" aria-labelledby="s-form"><h2 id="s-form" style={{ fontSize: 'var(--t-xl)' }}>Formateur · outils de test</h2><div className="row between" style={{ marginTop: 12 }}><div><div>Plan actuel : <strong>Gratuit</strong></div><div className="small subtle">Bascule votre propre profil pour vérifier les écrans Premium. Ne change rien pour vos apprenants.</div></div><button type="button" className="btn btn-secondary">Passer en Premium</button></div></section>}

        <section className="card" aria-labelledby="s-data">
          <h2 id="s-data" style={{ fontSize: 'var(--t-xl)' }}>Mes données</h2>
          <p className="muted" style={{ marginTop: 6 }}>Vous restez propriétaire de vos données. Deux fichiers, deux usages.</p>
          <div className="row" style={{ marginTop: 12 }}><a href="#portrait" className="btn btn-secondary"><FileText size={16} aria-hidden="true" /> Mon portrait d’apprentissage (PDF)</a><button type="button" className="btn btn-secondary"><Download size={16} aria-hidden="true" /> Mes données brutes (Excel)</button></div>
        </section>

        <section className="card" style={{ borderColor: 'var(--danger)' }} aria-labelledby="s-zone">
          <h2 id="s-zone" style={{ fontSize: 'var(--t-xl)', color: 'var(--danger)' }}>Zone sensible</h2>
          <p className="muted" style={{ marginTop: 6 }}>La suppression efface définitivement votre compte après un délai de 30 jours. Vos fichiers vous sont envoyés avant.</p>
          <button type="button" className="btn btn-secondary" style={{ marginTop: 12, color: 'var(--danger)', borderColor: 'var(--danger)' }}>Supprimer mon compte</button>
        </section>
        <p className="small subtle">Vos droits : accès, portabilité, effacement. Conformément au RGPD et à la loi 18-07. Contact : contact@certifizer.app</p>
      </div>
      {state === 'Supprimer ?' && <Confirm />}
    </div>
  )
}

function Row({ k, v }) { return <div style={{ display: 'flex', gap: 'var(--s-4)', padding: 'var(--s-3) 0', borderTop: '1px solid var(--line)', flexWrap: 'wrap' }}><dt className="muted" style={{ width: 160 }}>{k}</dt><dd>{v}</dd></div> }

function Confirm() {
  const [typed, setTyped] = useState('')
  return (
    <Modal title="Supprimer votre compte ?" onClose={() => {}}>
      <div className="stack-sm">
        <p className="muted">Prenez un instant. Cette action est sérieuse.</p>
        <Callout kind="danger"><strong>Sera effacé après 30 jours :</strong> votre nom et votre email ; vos réponses et vos tâches ; vos réflexes ; votre appartenance à la cohorte et vos séances assignées.</Callout>
        <Callout kind="accent"><strong>Avant de partir, emportez votre travail :</strong> <a href="#portrait">portrait (PDF)</a> · données brutes (Excel). Nous vous les envoyons aussi par email.</Callout>
        <div className="field"><label htmlFor="del-confirm">Pour confirmer, saisissez SUPPRIMER</label><input id="del-confirm" className="input" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" /></div>
        <div className="row"><button type="button" className="btn btn-danger" disabled={typed !== 'SUPPRIMER'}>Supprimer définitivement mon compte</button><button type="button" className="btn btn-ghost">Annuler</button></div>
      </div>
    </Modal>
  )
}

function Grace() {
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="stack">
        <div><div className="label">Réglages · suppression demandée</div><h1>Effacement définitif dans <span className="num">27 jours</span>.</h1><p className="lead" style={{ marginTop: 8 }}>Votre compte est désactivé. Vos données vous ont été envoyées par email.</p></div>
        <button type="button" className="btn btn-primary btn-lg"><RotateCcw size={18} aria-hidden="true" /> Annuler la suppression et récupérer mon compte</button>
        <ul className="list small muted">
          <li>Tout est conservé pendant le délai de grâce ; rien n’est perdu si vous changez d’avis.</li>
          <li>Le jour J-7 et J-1, un rappel vous est envoyé avec vos fichiers.</li>
          <li>Effacement immédiat possible sur demande à contact@certifizer.app</li>
        </ul>
        <div className="card card-quiet"><div className="label">Ce que dit la recherche</div><p style={{ marginTop: 6 }}>La courbe de l’oubli (Ebbinghaus) montre qu’une connaissance non utilisée s’estompe vite. Nous n’en tirons aucun pourcentage : ce qui retient le mieux, ce n’est pas la révision, c’est l’usage.</p></div>
      </div>
    </div>
  )
}
