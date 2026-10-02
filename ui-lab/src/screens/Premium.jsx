import React from 'react'
import { Sparkles, Check } from 'lucide-react'
import { Modal, Premium as Gate } from '../ui.jsx'

export default function Premium({ state }) {
  const premium = state === 'Fonctions intelligentes (premium)'
  return (
    <div className="page" style={{ maxWidth: 920 }}>
      <div className="page-head"><div><div className="label">Plan</div><h1>Utile gratuitement. Intelligent en Premium.</h1></div><span className="chip chip-warm">● {premium ? 'Premium' : 'Gratuit'}</span></div>
      <p className="lead" style={{ marginBottom: 'var(--s-6)' }}>Le gratuit n’est jamais punitif : la carte de base, la pratique et votre indicateur restent complets. Premium ajoute la couche qui vous guide. Dans les deux cas, vous gardez toute votre progression.</p>
      <div className="grid-3">
        {[['Séance adaptative complète', 'Composition 33 / 41 / 26, leviers, questions manquées, entretien.'], ['Chemin critique complet', 'Les 4 étapes, pas seulement les 2 premières.'], ['Apprentissage adaptatif de vos erreurs', 'Vos questions manquées reviennent à 1, 3 puis 7 jours.'], ['Carte détaillée', 'Les 26 tâches ECO, en plus des 13 thèmes.'], ['Recommandations', 'Le levier du moment, expliqué.'], ['Simulateur d’examen', '180 questions · 240 minutes. Bientôt.']].map(([t, d]) => {
          const card = <div className="card" style={{ height: '100%' }}><Sparkles size={18} aria-hidden="true" style={{ color: 'var(--accent)' }} /><h2 style={{ fontSize: 'var(--t-lg)', marginTop: 12 }}>{t}</h2><p className="small muted" style={{ marginTop: 6 }}>{d}</p></div>
          return premium ? <div key={t}>{card}</div> : <Gate key={t}>{card}</Gate>
        })}
      </div>
      <p className="small subtle" style={{ marginTop: 'var(--s-5)' }}>Premium s’active par votre formateur ou votre institution. Vous n’avez rien à saisir ici.</p>
      {state === 'Modale' && (
        <Modal title="Certifizer est utile gratuitement. Il devient intelligent en Premium." onClose={() => {}}>
          <div className="grid-2">
            <div><div className="label">Gratuit · vous l’avez</div><ul className="stack-sm small" style={{ marginTop: 8 }}>{['Pratique des questions', 'Carte PMP de base (13 thèmes)', 'Indicateur de préparation', 'Aperçu des zones faibles'].map(x => <li key={x} className="row" style={{ gap: 8 }}><Check size={14} aria-hidden="true" />{x}</li>)}</ul></div>
            <div><div className="label">Premium · l’intelligence</div><ul className="stack-sm small" style={{ marginTop: 8 }}>{['Séances adaptatives complètes', 'Chemin critique complet', 'Apprentissage adaptatif de vos erreurs', 'Simulateur d’examen'].map(x => <li key={x} className="row" style={{ gap: 8 }}><Sparkles size={14} aria-hidden="true" style={{ color: 'var(--accent)' }} />{x}</li>)}</ul></div>
          </div>
          <div className="row" style={{ marginTop: 20 }}><button type="button" className="btn btn-primary">Demander Premium à mon formateur</button><button type="button" className="btn btn-ghost">Plus tard</button></div>
          <p className="small subtle" style={{ marginTop: 12 }}>Vous gardez toute votre progression. Aucune donnée ne se perd.</p>
        </Modal>
      )}
    </div>
  )
}
