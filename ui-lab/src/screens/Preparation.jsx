import React from 'react'
import { ArrowRight, Target, RotateCcw, Sparkles, Lock, Quote, Gauge, CalendarDays, RefreshCw } from 'lucide-react'
import { readiness, LEARNER, LEVERS, MISSED, REFLEXES, SESSION, ASSIGNED, TOTAL_ATTEMPTS, TASKS, STALE, MASTERY } from '../data.js'
import { Meter, pct, TierChip, Premium, Skeleton, Empty, Callout, Vignette, DomainTag } from '../ui.jsx'

const daysTo = (iso) => Math.max(0, Math.round((new Date(iso) - new Date('2026-10-02')) / 86400000))

export default function Preparation({ state, go }) {
  const r = readiness()
  if (state === 'Chargement') return <Loading />
  if (state === 'Première visite') return <FirstVisit />
  const premium = state === 'Premium'
  const assigned = state === 'Séance assignée'
  return (
    <div className="page stack">
      {/* Hero: one truth, one action */}
      <section className="reveal" aria-labelledby="h-prepa">
        <div className="label" style={{ marginBottom: 12 }}>Ma préparation · {new Date('2026-10-02').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div className="grid-main" style={{ '--aside-w': '300px' }}>
          <div className="stack">
            <h1 id="h-prepa" style={{ fontSize: 'var(--t-4xl)', maxWidth: '22ch' }}>Bonjour Nadia.<br />Où vous en êtes : <span className={`tier-${r.label.tier}`} style={{ whiteSpace: 'nowrap' }}>{r.label.fr.toLowerCase()}</span>.</h1>
            <p className="lead">La priorité du jour est <strong>{LEVERS[0].fr}</strong>. Une séance de {SESSION.size} questions, environ {SESSION.minutes} minutes, composée pour vous.</p>
            <div className="row">
              <a href="#seance" className="btn btn-primary btn-lg">Lancer la séance du jour <ArrowRight size={18} aria-hidden="true" /></a>
              <a href="#tester" className="btn btn-secondary">Me tester librement</a>
            </div>
            <ul className="row small subtle" style={{ gap: 'var(--s-4)' }}>
              <li><span className="chip chip-danger">{SESSION.composition.weak} leviers prioritaires</span></li>
              <li><span className="chip chip-warm">{SESSION.composition.missed} à retravailler</span></li>
              <li><span className="chip">{SESSION.composition.maintenance} entretien</span></li>
              <li>Apprentissage adaptatif de vos erreurs</li>
            </ul>
          </div>
          <ReadinessDial r={r} />
        </div>
      </section>

      {assigned && (
        <section className="card card-accent reveal" aria-label="Séance assignée">
          <div className="row between">
            <div><div className="label" style={{ color: 'inherit', opacity: 0.8 }}><Target size={12} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-1px' }} /> Assignée par votre formateur</div><h2 style={{ fontSize: 'var(--t-xl)', marginTop: 4 }}>{ASSIGNED[0].title}</h2><p className="small" style={{ marginTop: 4 }}>{ASSIGNED[0].questions} questions · dans cet ordre exact</p></div>
            <a href="#seance" className="btn btn-primary">Commencer</a>
          </div>
        </section>
      )}

      {/* Domains: honest coverage */}
      <section className="section reveal" aria-labelledby="h-dom">
        <div className="card-head" style={{ alignItems: 'end' }}>
          <div><h2 id="h-dom">Face à l’examen réel</h2><p className="muted" style={{ marginTop: 4 }}>Pondération officielle ECO 2026. Une tâche jamais pratiquée compte 0 : votre indicateur est bas quand votre couverture est basse, pas quand vous êtes mauvaise.</p></div>
        </div>
        <div className="grid-3">
          {r.domains.map(d => {
            const tier = d.score < 0.5 ? 1 : d.score < 0.7 ? 2 : d.score < 0.85 ? 3 : 4
            return (
              <div className="card" key={d.id}>
                <div className="row between"><DomainTag id={d.id} /><span className="label">{d.covered}/{d.tasks} tâches</span></div>
                <div className="display num" style={{ fontSize: 'var(--t-3xl)', marginTop: 12 }}>{pct(d.score)}</div>
                <Meter value={d.score} tier={tier} label={`${d.fr} : ${pct(d.score)}`} />
                <p className="small subtle" style={{ marginTop: 10 }}>{d.tasks - d.covered > 0 ? `${d.tasks - d.covered} tâche${d.tasks - d.covered > 1 ? 's' : ''} jamais pratiquée${d.tasks - d.covered > 1 ? 's' : ''}` : 'Toutes les tâches pratiquées'}</p>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid-2 section">
        {/* Levers */}
        <section className="card reveal" aria-labelledby="h-lev">
          <div className="card-head"><div><h3 id="h-lev">Vos leviers prioritaires</h3><p className="small subtle">Poids à l’examen × ce qu’il vous reste à construire. Hypothèse de conception Certifizer : poids égal entre les tâches d’un domaine.</p></div></div>
          <ul className="list">
            {LEVERS.map((l, i) => (
              <li key={l.id}>
                <span className="label" style={{ width: 28 }}>{l.id}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 500 }}>{l.fr}</div><div className="small subtle">{l.attempts ? `${pct(l.score)} de réussite · ${l.attempts} réponses` : 'Jamais pratiquée'}</div></div>
                <a href="#tester" className="btn btn-sm btn-secondary">Réviser</a>
              </li>
            ))}
          </ul>
        </section>

        {/* Missed */}
        <section className="card reveal" aria-labelledby="h-miss">
          <div className="card-head"><div><h3 id="h-miss">À retravailler</h3><p className="small subtle">Vos questions manquées reviennent à 1, 3 puis 7 jours. Rien ne baisse avec le temps ; on vous les repropose, c’est tout.</p></div><span className="chip">{MISSED.filter(m => m.due === 'aujourd’hui').length} dues aujourd’hui</span></div>
          <ul className="list">
            {MISSED.slice(0, 3).map(m => (
              <li key={m.id}><div style={{ flex: 1, minWidth: 0 }}><div className="small" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.fr}</div><div className="small subtle" style={{ marginTop: 2 }}>{TASKS.find(t => t.id === m.task).fr} · {m.due}</div></div></li>
            ))}
          </ul>
          <a href="#seance" className="btn btn-secondary" style={{ marginTop: 12 }}><RotateCcw size={16} aria-hidden="true" /> Rejouer mes questions manquées</a>
        </section>
      </div>

      {/* Intelligent features (premium gate) */}
      <section className="section" aria-labelledby="h-int">
        <div className="card-head"><div><h2 id="h-int">Fonctions intelligentes</h2><p className="muted" style={{ marginTop: 4 }}>{premium ? 'Débloquées avec votre plan.' : 'La couche qui vous guide vraiment, incluse en Premium. Votre progression est la même dans les deux cas.'}</p></div>{!premium && <a href="#premium" className="btn btn-secondary">Voir Premium</a>}</div>
        <div className="grid-3">
          <FeatureCard premium={premium} title="Séance adaptative complète" text="Composition 33 / 41 / 26, leviers, questions manquées, entretien." />
          <FeatureCard premium={premium} title="Chemin critique complet" text="Les 4 étapes, pas seulement les 2 premières." />
          <FeatureCard premium={premium} title="Simulateur d’examen" text="180 questions · 240 minutes · au format réel." soon />
        </div>
      </section>

      <div className="grid-2 section">
        <section className="card reveal" aria-labelledby="h-ref">
          <div className="card-head"><h3 id="h-ref">Vos réflexes</h3><a href="#casreel" className="small">Depuis « Cas réel »</a></div>
          <ul className="stack-sm">
            {REFLEXES.slice(0, 2).map((x, i) => <li key={i} style={{ display: 'flex', gap: 10 }}><Quote size={16} aria-hidden="true" style={{ flex: 'none', color: 'var(--ink-3)', marginTop: 4 }} /><div><p>{x.text}</p><div className="small subtle" style={{ marginTop: 4 }}>{x.seatLabel} · {x.at}</div></div></li>)}
          </ul>
        </section>
        <section className="card card-quiet reveal" aria-labelledby="h-ent">
          <div className="card-head"><h3 id="h-ent">Entretien</h3><RefreshCw size={18} aria-hidden="true" style={{ color: 'var(--ink-3)' }} /></div>
          <p className="small">Deux tâches solides n’ont pas été pratiquées depuis plus de 21 jours. Votre score ne baisse pas pour autant ; une question d’entretien est glissée dans la séance du jour.</p>
          <ul className="row" style={{ marginTop: 12 }}>{STALE.map(s => <li key={s.id}><span className="chip chip-outline">{s.fr}</span></li>)}</ul>
        </section>
      </div>

      <section className="section grid-2" style={{ alignItems: 'center' }}>
        <Vignette kind="board" caption="Formation PMP-2026-A · atelier échéancier (Exemple)" />
        <div className="stack-sm"><h2>Deux objectifs, une seule vérité.</h2><p className="muted">Réussir l’examen et savoir diriger un projet. Votre portrait mesure ce que vous reconnaissez aujourd’hui ; vos livrables, dans « Relier à mon projet », montreront ce que vous savez faire.</p><a href="#portrait" className="btn btn-ghost" style={{ paddingLeft: 0 }}>Lire mon portrait <ArrowRight size={16} aria-hidden="true" /></a></div>
      </section>
    </div>
  )
}

function FeatureCard({ premium, title, text, soon }) {
  const body = <div className="card" style={{ height: '100%' }}><div className="row between"><Sparkles size={18} aria-hidden="true" style={{ color: 'var(--accent)' }} />{soon && <span className="chip chip-outline" style={{ fontSize: 11, minHeight: 22 }}>Bientôt</span>}</div><h3 style={{ fontSize: 'var(--t-lg)', marginTop: 12 }}>{title}</h3><p className="small muted" style={{ marginTop: 6 }}>{text}</p></div>
  return premium ? body : <Premium>{body}</Premium>
}

export function ReadinessDial({ r, compact }) {
  const R = 54, C = 2 * Math.PI * R
  const tier = r.label.tier
  return (
    <div className="card" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'center' }} aria-label={`Indicateur de préparation Certifizer : ${pct(r.score)}, ${r.label.fr}`} role="img">
      <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
        <circle cx="66" cy="66" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
        <circle cx="66" cy="66" r={R} fill="none" stroke={`var(--tier-${tier})`} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${C * r.score} ${C}`} transform="rotate(-90 66 66)" style={{ transition: 'stroke-dasharray var(--dur-slow) var(--ease-out)' }} />
        {[0.5, 0.7, 0.85].map(t => { const a = -Math.PI / 2 + t * 2 * Math.PI; return <circle key={t} cx={66 + (R + 9) * Math.cos(a)} cy={66 + (R + 9) * Math.sin(a)} r="2" fill="var(--ink-3)" /> })}
        <text x="66" y="62" textAnchor="middle" fontFamily="var(--font-display)" fontSize="30" fill="var(--ink)" className="num">{Math.round(r.score * 100)}</text>
        <text x="66" y="82" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-3)" letterSpacing="1">SUR 100</text>
      </svg>
      <div className="stack-sm">
        <TierChip tier={tier}>{r.label.fr}</TierChip>
        <p className="small muted">Indicateur de préparation Certifizer. Un miroir, pas une promesse : il reflète {TOTAL_ATTEMPTS} réponses sur {MASTERY.filter(m => m.covered).length} tâches sur 26.</p>
        <div className="small subtle row" style={{ gap: 8 }}><CalendarDays size={14} aria-hidden="true" /> Examen dans {daysTo(LEARNER.examDate)} jours</div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="page stack" aria-busy="true" aria-live="polite">
      <div className="label">Ma préparation</div>
      <Skeleton h={44} w="60%" /><Skeleton h={22} w="80%" /><div className="row"><Skeleton h={52} w={240} /><Skeleton h={44} w={160} /></div>
      <div className="grid-3" style={{ marginTop: 32 }}><Skeleton h={160} /><Skeleton h={160} /><Skeleton h={160} /></div>
      <p className="small subtle">Chargement de votre préparation…</p>
    </div>
  )
}

function FirstVisit() {
  return (
    <div className="page stack">
      <div className="label">Ma préparation · première visite</div>
      <div className="grid-main" style={{ alignItems: 'center' }}>
        <div className="stack">
          <h1 style={{ fontSize: 'var(--t-4xl)', maxWidth: '18ch' }}>Bonjour Nadia. Commençons par une mesure honnête.</h1>
          <p className="lead">Dix questions, environ quinze minutes, réparties selon le poids réel de l’examen (33 / 41 / 26). Votre portrait apparaîtra après vos premières réponses, et il dira la vérité dès le départ : une tâche jamais pratiquée compte zéro.</p>
          <div className="row"><a href="#seance" className="btn btn-primary btn-lg">Faire ma première séance <ArrowRight size={18} aria-hidden="true" /></a><a href="#parcours" className="btn btn-ghost">Voir le parcours ECO 2026 d’abord</a></div>
          <Callout>Vous pouvez quitter une séance à tout moment. Vos réponses sont gardées.</Callout>
        </div>
        <Vignette kind="desk" />
      </div>
      <Empty icon={Gauge} title="Votre portrait prendra forme ici">Après vos premières réponses : préparation par domaine, leviers prioritaires et questions à retravailler.</Empty>
    </div>
  )
}
