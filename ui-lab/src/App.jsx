import React, { useEffect, useState } from 'react'
import { Gauge, HelpCircle, BookOpen, Puzzle, Lightbulb, Scale, Compass, GitBranch, Route, FileText, Settings, Users, LayoutGrid, Mail, Building2, FlaskConical, ChevronUp, ChevronDown, Menu, Triangle, Search, Library } from 'lucide-react'
import { ROUTES, GROUPS, routeOf } from './routes.js'
import { LEARNER } from './data.js'
// 21st.dev components (see 21st-manifest.md)
import { Sidebar, SidebarFooter, SidebarHeader, SidebarItem, SidebarNav, SidebarSection, SidebarToggle, useSidebar } from '@/components/21st/sidebar'
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from '@/components/21st/drawer'
import { CommandMenu, CommandGroup, CommandItem, CommandSeparator, useCommandShortcut } from '@/components/21st/command-menu'
import { SegmentedControl } from '@/components/21st/segmented-control'
import { Switch } from '@/components/21st/switch'
import { BjorkSonnerDemo as Toaster } from '@/components/21st/sonner-toast'
import AnimatedTabs from '@/components/21st/animated-tabs'
import { Button } from '@/components/ui/button'
import Lab from './screens/Lab.jsx'
import Sources from './screens/Sources.jsx'
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
  lab: Lab, sources: Sources, accueil: Acces, invitation: Acces, email: Acces, lien: Acces,
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
const I = (Icon) => <Icon className="size-[18px]" aria-hidden="true" />
const LEARNER_NAV = [
  { title: "Aujourd'hui", items: [['preparation', 'Ma préparation', Gauge]] },
  { title: 'Apprendre', items: [['tester', 'Me tester', HelpCircle], ['expliquer', 'Expliquer', BookOpen], ['scenario', "Cas d'examen", Puzzle], ['casreel', 'Cas réel', Scale], ['relier', 'Relier à mon projet', Lightbulb]] },
  { title: 'Comprendre', items: [['parcours', 'Parcours ECO', Compass], ['carte', 'Carte mentale', GitBranch], ['chemin', 'Chemin critique', Route], ['portrait', 'Mon portrait', FileText]] },
  { title: 'Compte', items: [['reglages', 'Réglages', Settings]] },
]
const TRAINER_NAV = [
  { title: 'Cohorte', items: [['cockpit', 'Cockpit', LayoutGrid], ['seance-ciblee', 'Séances ciblées', Puzzle], ['invitations', 'Invitations', Mail]] },
  { title: 'Compte', items: [['reglages', 'Réglages', Settings]] },
]
const INSTITUTION_NAV = [{ title: 'Institution', items: [['institution', 'Vue générale', Building2]] }]
const TABS = { apprenant: [['preparation', 'Préparation', Gauge], ['tester', 'Tester', HelpCircle], ['carte', 'Carte', GitBranch], ['portrait', 'Portrait', FileText]], formateur: [['cockpit', 'Cockpit', LayoutGrid], ['seance-ciblee', 'Séances', Puzzle], ['invitations', 'Invitations', Mail]], institution: [['institution', 'Institution', Building2]] }
const PERSONA = {
  apprenant: { initials: LEARNER.initials, name: LEARNER.name, sub: 'Gratuit · PMP-2026-A', brand: 'Préparation PMP · ECO 2026' },
  formateur: { initials: 'FR', name: 'Formateur (Exemple)', sub: 'PMP-2026-A', brand: 'Cockpit formateur' },
  institution: { initials: 'IN', name: 'Institution (Exemple)', sub: '2 cohortes · 20 sièges', brand: 'Espace institution' },
}

export default function App() {
  const [hash, setHash] = useState(() => (location.hash || '#lab').slice(1))
  const [direction, setDirection] = useState(() => ls.get('cz-direction', 'observatoire'))
  const [reduced, setReduced] = useState(() => ls.get('cz-reduced', 'false') === 'true')
  const [labOpen, setLabOpen] = useState(() => { try { return window.innerWidth >= 1024 } catch { return true } })
  const [stateIdx, setStateIdx] = useState({})
  const [menuOpen, setMenuOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useCommandShortcut('k')
  const route = routeOf(hash)
  const state = route.states[stateIdx[route.hash] || 0] || ''

  useEffect(() => { const h = () => { setHash((location.hash || '#lab').slice(1)); setMenuOpen(false); window.scrollTo(0, 0) }; addEventListener('hashchange', h); return () => removeEventListener('hashchange', h) }, [])
  useEffect(() => { document.documentElement.setAttribute('data-direction', direction); ls.set('cz-direction', direction) }, [direction])
  useEffect(() => { document.documentElement.setAttribute('data-reduced-motion', String(reduced)); ls.set('cz-reduced', String(reduced)) }, [reduced])
  useEffect(() => { document.title = `${route.label} · Certifizer Lab` }, [route])

  const go = (h) => { location.hash = h }
  const Screen = SCREENS[route.hash] || Lab
  const audience = route.group === 'formateur' ? 'formateur' : route.group === 'institution' ? 'institution' : 'apprenant'
  const nav = audience === 'formateur' ? TRAINER_NAV : audience === 'institution' ? INSTITUTION_NAV : LEARNER_NAV
  const bare = route.group === 'lab' || route.group === 'acces' || route.hash === 'seance'
  const screen = <Screen state={state} route={route} go={go} reduced={reduced} setReduced={setReduced} direction={setDirection && direction} setDirection={setDirection} />
  const persona = PERSONA[audience]

  const navItems = nav.map((g, i) => (
    <SidebarSection key={i} label={g.title}>
      {g.items.map(([h, l, Icon]) => <SidebarItem key={h} href={`#${h}`} icon={I(Icon)} active={route.hash === h} aria-current={route.hash === h ? 'page' : undefined}>{l}</SidebarItem>)}
    </SidebarSection>
  ))

  return (
    <>
      <a className="skip-link" href="#main">Aller au contenu</a>
      {bare ? <main id="main" className="main">{screen}</main> : (
        <div className="app">
          <Sidebar variant="collapsible" width={248} aria-label="Navigation principale" data-sidebar="">
            <SidebarHeader><Brand audience={audience} /><SidebarToggle className="ml-auto" aria-label="Replier la navigation" /></SidebarHeader>
            <SidebarNav>{navItems}</SidebarNav>
            <SidebarFooter><PersonaFoot persona={persona} /></SidebarFooter>
          </Sidebar>
          <div className="main">
            <header className="topbar">
              <Brand audience={audience} compact />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="Rechercher (⌘K)" onClick={() => setCmdOpen(true)}><Search className="size-5" aria-hidden="true" /></Button>
                <Drawer side="left" open={menuOpen} onOpenChange={setMenuOpen}>
                  <DrawerTrigger asChild><Button variant="ghost" size="icon" aria-label="Ouvrir le menu"><Menu className="size-5" aria-hidden="true" /></Button></DrawerTrigger>
                  <DrawerContent title="Menu" description={persona.brand} className="w-[300px]">
                    <nav aria-label="Menu" className="flex flex-col gap-4">
                      {nav.map((g, i) => (
                        <div key={i}>
                          <p className="label mb-1 px-2">{g.title}</p>
                          {g.items.map(([h, l, Icon]) => (
                            <DrawerClose key={h} asChild>
                              <a href={`#${h}`} aria-current={route.hash === h ? 'page' : undefined} className={`flex items-center gap-2.5 rounded-md px-2 py-2 text-sm ${route.hash === h ? 'bg-accent-soft text-accent-soft-ink font-medium' : 'text-foreground hover:bg-muted'}`}>{I(Icon)}{l}</a>
                            </DrawerClose>
                          ))}
                        </div>
                      ))}
                    </nav>
                  </DrawerContent>
                </Drawer>
              </div>
            </header>
            <main id="main">{screen}</main>
            <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 px-2 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur lg:hidden" aria-label="Navigation rapide">
              <AnimatedTabs className="flex w-full [&_button]:min-w-0 [&_button]:flex-1 [&_button]:flex-col [&_button]:gap-0.5 [&_button]:px-1 [&_button]:py-1.5 [&_button]:text-xs" variant="underline" layoutId="tabbar" activeTab={TABS[audience].some(([h]) => h === route.hash) ? route.hash : '__none'} onChange={go}
                tabs={TABS[audience].map(([h, l, Icon]) => ({ id: h, label: l, icon: I(Icon) }))} />
            </nav>
          </div>
        </div>
      )}

      {/* ⌘K — jump to any screen (21st Command Menu) */}
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} placeholder="Aller à un écran…">
        {GROUPS.map((g, i) => (
          <React.Fragment key={g.id}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={g.fr}>
              {ROUTES.filter(r => r.group === g.id).map(r => <CommandItem key={r.hash} value={r.hash} keywords={[r.label]} icon={<Library />} onSelect={() => { go(r.hash); setCmdOpen(false) }}>{r.label}</CommandItem>)}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandMenu>
      <Toaster showButton={false} />

      {/* Lab chrome: direction, screen state, reduced motion. Not part of the product. */}
      <aside className="lab-bar" aria-label="Laboratoire">
        {labOpen && (
          <div className="lab-panel">
            <div className="flex items-center justify-between"><strong className="text-[13px]">Laboratoire</strong><span className="flex gap-3 text-xs"><a href="#lab">Directions</a><a href="#sources">Sources 21st</a></span></div>
            <div>
              <p className="label mb-1">Direction</p>
              <div className="rounded-md bg-card text-foreground"><SegmentedControl label="Direction de design" options={DIRECTIONS} value={direction} onValueChange={setDirection} /></div>
            </div>
            {route.states.length > 0 && (
              <label className="block"><span className="label mb-1 block">État de l’écran</span>
                <select value={stateIdx[route.hash] || 0} onChange={(e) => setStateIdx({ ...stateIdx, [route.hash]: Number(e.target.value) })}>
                  {route.states.map((s, i) => <option key={s} value={i}>{s}</option>)}
                </select>
              </label>
            )}
            <div className="flex items-center gap-3"><Switch id="lab-reduced" checked={reduced} onCheckedChange={setReduced} /><label htmlFor="lab-reduced" className="text-sm">Réduire les animations</label></div>
            <label className="block"><span className="label mb-1 block">Écran</span>
              <select value={route.hash} onChange={(e) => go(e.target.value)}>
                {GROUPS.map(g => <optgroup key={g.id} label={g.fr}>{ROUTES.filter(r => r.group === g.id).map(r => <option key={r.hash} value={r.hash}>{r.label}</option>)}</optgroup>)}
              </select>
            </label>
            <button type="button" className="text-left text-xs underline-offset-2 hover:underline" onClick={() => setCmdOpen(true)}>Palette ⌘K / Ctrl K</button>
          </div>
        )}
        <button type="button" className="lab-toggle" aria-expanded={labOpen} onClick={() => setLabOpen(!labOpen)}><FlaskConical size={16} aria-hidden="true" /> Labo {labOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}</button>
      </aside>
    </>
  )
}

function Brand({ audience, compact }) {
  let collapsed = false
  try { collapsed = useSidebar().collapsed } catch { /* outside the sidebar */ }
  return (
    <a href="#lab" className="flex min-w-0 items-center gap-2.5 no-underline">
      <span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-primary text-primary-foreground" aria-hidden="true"><Triangle size={13} /></span>
      {!collapsed && <span className="min-w-0"><span className="block truncate font-display text-[15px] leading-tight">Certifizer</span>{!compact && <span className="block truncate text-[11px] leading-tight text-muted-foreground">{PERSONA[audience].brand}</span>}</span>}
    </a>
  )
}
function PersonaFoot({ persona }) {
  const { collapsed } = useSidebar()
  return (
    <>
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-soft-ink" aria-hidden="true">{persona.initials}</span>
      {!collapsed && <div className="min-w-0 flex-1"><div className="truncate text-[12.5px] font-medium leading-tight">{persona.name}</div><div className="truncate text-[11px] leading-tight text-muted-foreground">{persona.sub}</div></div>}
    </>
  )
}
