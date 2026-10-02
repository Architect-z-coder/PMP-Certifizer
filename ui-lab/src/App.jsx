import React, { useEffect, useMemo, useState } from 'react'
import { Gauge, HelpCircle, BookOpen, Puzzle, Lightbulb, Scale, Compass, GitBranch, Route, FileText, Settings, Users, LayoutGrid, Mail, Building2, FlaskConical, ChevronUp, ChevronDown, Menu, X, Triangle } from 'lucide-react'
import { ROUTES, GROUPS, routeOf } from './routes.js'
import { LEARNER } from './data.js'
import { Seg, Switch } from './ui.jsx'
import Lab from './screens/Lab.jsx'
import Acces from './screens/Acces.jsx'
import Preparation from './screens/Preparation.jsx'
import Seance from './screens/Seance.jsx'
import Tester from './screens/Tester.jsx'
import Chat from './screens/Chat.jsx'
import Parcours from './screens/Parcours.jsx'
import Carte from './screens/Carte.jsx'
import Chemin from './screens/Chemin.jsx'
import Portrait from './screens/Portrait.jsx'
import Reglages from './screens/Reglages.jsx'
import Premium from './screens/Premium.jsx'
import Cockpit from './screens/Cockpit.jsx'
import SeanceCiblee from './screens/SeanceCiblee.jsx'
import Invitations from './screens/Invitations.jsx'
import Institution from './screens/Institution.jsx'

const SCREENS = {
  lab: Lab, accueil: Acces, invitation: Acces, email: Acces, lien: Acces,
  preparation: Preparation, seance: Seance, tester: Tester, expliquer: Chat, scenario: Chat, relier: Chat, casreel: Chat,
  parcours: Parcours, carte: Carte, chemin: Chemin, portrait: Portrait, reglages: Reglages, premium: Premium,
  cockpit: Cockpit, 'seance-ciblee': SeanceCiblee, invitations: Invitations, institution: Institution,
}
const DIRECTIONS = [
  { value: 'observatoire', label: 'Observatoire' }, { value: 'atelier', label: 'Atelier' }, { value: 'chantier', label: 'Chantier' }, { value: 'jardin', label: 'Jardin' },
]
const ls = {
  get: (k, d) => { try { return localStorage.getItem(k) ?? d } catch { return d } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch {} },
}

const LEARNER_NAV = [
  { title: "Aujourd'hui", items: [['preparation', 'Ma préparation', Gauge]] },
  { title: 'Apprendre', items: [['tester', 'Me tester', HelpCircle], ['expliquer', 'Expliquer', BookOpen], ['scenario', "Cas d'examen", Puzzle], ['casreel', 'Cas réel', Scale], ['relier', 'Relier à mon projet', Lightbulb]] },
  { title: 'Comprendre', items: [['parcours', 'Parcours ECO', Compass], ['carte', 'Carte mentale', GitBranch], ['chemin', 'Chemin critique', Route], ['portrait', 'Mon portrait', FileText]] },
  { title: '', items: [['reglages', 'Réglages', Settings]] },
]
const TRAINER_NAV = [
  { title: 'Cohorte', items: [['cockpit', 'Cockpit', LayoutGrid], ['seance-ciblee', 'Séances ciblées', Puzzle], ['invitations', 'Invitations', Mail]] },
  { title: '', items: [['reglages', 'Réglages', Settings]] },
]
const INSTITUTION_NAV = [{ title: 'Institution', items: [['institution', 'Vue générale', Building2]] }]
const TABS = { apprenant: [['preparation', 'Préparation', Gauge], ['tester', 'Tester', HelpCircle], ['carte', 'Carte', GitBranch], ['portrait', 'Portrait', FileText], ['reglages', 'Réglages', Settings]], formateur: [['cockpit', 'Cockpit', LayoutGrid], ['seance-ciblee', 'Séances', Puzzle], ['invitations', 'Invitations', Mail], ['reglages', 'Réglages', Settings]], institution: [['institution', 'Institution', Building2]] }

export default function App() {
  const [hash, setHash] = useState(() => (location.hash || '#lab').slice(1))
  const [direction, setDirection] = useState(() => ls.get('cz-direction', 'observatoire'))
  const [reduced, setReduced] = useState(() => ls.get('cz-reduced', 'false') === 'true')
  const [labOpen, setLabOpen] = useState(() => { try { return window.innerWidth >= 1024 } catch { return true } })
  const [stateIdx, setStateIdx] = useState({})
  const [drawer, setDrawer] = useState(false)
  const route = routeOf(hash)
  const state = route.states[stateIdx[route.hash] || 0] || ''

  useEffect(() => { const h = () => { setHash((location.hash || '#lab').slice(1)); setDrawer(false); window.scrollTo(0, 0) }; addEventListener('hashchange', h); return () => removeEventListener('hashchange', h) }, [])
  useEffect(() => { document.documentElement.setAttribute('data-direction', direction); ls.set('cz-direction', direction) }, [direction])
  useEffect(() => { document.documentElement.setAttribute('data-reduced-motion', String(reduced)); ls.set('cz-reduced', String(reduced)) }, [reduced])
  useEffect(() => { document.title = `${route.label} · Certifizer Lab` }, [route])

  const go = (h) => { location.hash = h }
  const Screen = SCREENS[route.hash] || Lab
  const audience = route.group === 'formateur' ? 'formateur' : route.group === 'institution' ? 'institution' : 'apprenant'
  const nav = audience === 'formateur' ? TRAINER_NAV : audience === 'institution' ? INSTITUTION_NAV : LEARNER_NAV
  const bare = route.group === 'lab' || route.group === 'acces' || route.hash === 'seance'
  const screen = <Screen state={state} route={route} go={go} reduced={reduced} setReduced={setReduced} direction={direction} setDirection={setDirection} />

  return (
    <>
      <a className="skip-link" href="#main">Aller au contenu</a>
      {bare ? <main id="main" className="main">{screen}</main> : (
        <div className="app">
          <nav className="nav" aria-label="Navigation principale" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
            <Brand audience={audience} />
            {nav.map((g, i) => (
              <div className="nav-group" key={i}>
                {g.title && <div className="label nav-title">{g.title}</div>}
                {g.items.map(([h, l, I]) => <a key={h} className="nav-item" href={`#${h}`} aria-current={route.hash === h ? 'page' : undefined}><I aria-hidden="true" />{l}</a>)}
              </div>
            ))}
            <div className="nav-foot">
              <div className="label" style={{ padding: '0 var(--s-2)' }}>ECO PMP 2026 · en vigueur · 3 domaines · 26 tâches · 33 / 41 / 26</div>
              <div className="persona"><span className="avatar" aria-hidden="true">{audience === 'apprenant' ? LEARNER.initials : audience === 'formateur' ? 'FR' : 'IN'}</span><div style={{ minWidth: 0 }}><div className="small" style={{ fontWeight: 500 }}>{audience === 'apprenant' ? LEARNER.name : audience === 'formateur' ? 'Formateur (Exemple)' : 'Institution (Exemple)'}</div><div className="small subtle">{audience === 'apprenant' ? 'Gratuit · PMP-2026-A' : audience === 'formateur' ? 'PMP-2026-A' : '2 cohortes · 20 sièges'}</div></div></div>
            </div>
          </nav>
          <div className="main">
            <header className="topbar" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
              <Brand audience={audience} compact />
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Ouvrir le menu" aria-expanded={drawer} onClick={() => setDrawer(true)}><Menu size={20} aria-hidden="true" /></button>
            </header>
            {drawer && (
              <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setDrawer(false) }}>
                <div className="modal" role="dialog" aria-modal="true" aria-label="Menu" style={{ alignSelf: 'start', marginTop: 'var(--s-5)' }}>
                  <div className="card-head"><strong>Menu</strong><button type="button" className="btn btn-ghost btn-icon" aria-label="Fermer le menu" onClick={() => setDrawer(false)}><X size={18} aria-hidden="true" /></button></div>
                  {nav.map((g, i) => <div className="nav-group" key={i}>{g.title && <div className="label nav-title">{g.title}</div>}{g.items.map(([h, l, I]) => <a key={h} className="nav-item" href={`#${h}`} aria-current={route.hash === h ? 'page' : undefined}><I aria-hidden="true" />{l}</a>)}</div>)}
                </div>
              </div>
            )}
            <main id="main">{screen}</main>
            <nav className="tabbar" aria-label="Navigation rapide">
              {TABS[audience].map(([h, l, I]) => <a key={h} className="tab" href={`#${h}`} aria-current={route.hash === h ? 'page' : undefined}><I aria-hidden="true" />{l}</a>)}
            </nav>
          </div>
        </div>
      )}

      {/* Lab chrome: direction, screen state, reduced motion. Not part of the product. */}
      <aside className="lab-bar" aria-label="Laboratoire">
        {labOpen && (
          <div className="lab-panel" aria-label="Commandes du laboratoire">
            <div className="row between"><strong style={{ fontSize: 13 }}>Laboratoire</strong><a href="#lab" style={{ color: 'inherit', fontSize: 12 }}>Directions</a></div>
            <div className="label" style={{ color: 'rgba(255,255,255,0.6)' }}>Direction</div>
            <Seg size="sm" label="Direction de design" options={DIRECTIONS} value={direction} onChange={setDirection} />
            {route.states.length > 0 && <>
              <div className="label" style={{ color: 'rgba(255,255,255,0.6)' }}>État de l’écran</div>
              <select className="select" style={{ minHeight: 36, background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: 'inherit' }} aria-label="État de l’écran" value={stateIdx[route.hash] || 0} onChange={(e) => setStateIdx({ ...stateIdx, [route.hash]: Number(e.target.value) })}>
                {route.states.map((s, i) => <option key={s} value={i} style={{ color: '#000' }}>{s}</option>)}
              </select>
            </>}
            <Switch id="lab-reduced" checked={reduced} onChange={setReduced} label="Réduire les animations" />
            <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span>Écran</span>
              <select className="select" style={{ minHeight: 36, background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: 'inherit', flex: 1 }} aria-label="Aller à un écran" value={route.hash} onChange={(e) => go(e.target.value)}>
                {GROUPS.map(g => <optgroup key={g.id} label={g.fr} style={{ color: '#000' }}>{ROUTES.filter(r => r.group === g.id).map(r => <option key={r.hash} value={r.hash} style={{ color: '#000' }}>{r.label}</option>)}</optgroup>)}
              </select>
            </label>
          </div>
        )}
        <button type="button" className="lab-toggle" aria-expanded={labOpen} onClick={() => setLabOpen(!labOpen)}><FlaskConical size={16} aria-hidden="true" /> Labo {labOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}</button>
      </aside>
    </>
  )
}

function Brand({ audience, compact }) {
  return (
    <a href="#lab" className="brand" style={{ textDecoration: 'none' }}>
      <span className="brand-mark" aria-hidden="true"><Triangle size={14} /></span>
      <span><span className="brand-name">Certifizer</span>{!compact && <span className="brand-sub" style={{ display: 'block' }}>{audience === 'formateur' ? 'Cockpit formateur' : audience === 'institution' ? 'Espace institution' : 'Préparation PMP · ECO 2026'}</span>}</span>
    </a>
  )
}
