import React, { useEffect, useState } from 'react'
import { parseHash } from './routes.js'
import { useReducedMotion, ScrollTrigger } from './motion.js'
import { TopBar, BottomNav, Footer, useToast } from './components/Chrome.jsx'
import Story from './pages/Story.jsx'
import Aujourdhui from './pages/Aujourdhui.jsx'
import Parcours from './pages/Parcours.jsx'
import Entrainer from './pages/Entrainer.jsx'
import Projet from './pages/Projet.jsx'
import Portrait from './pages/Portrait.jsx'

const PAGES = { aujourdhui: Aujourdhui, parcours: Parcours, entrainer: Entrainer, projet: Projet, portrait: Portrait }
const TITLES = { aujourdhui: "Aujourd'hui", parcours: 'Parcours', entrainer: 'S’entraîner', projet: 'Mon projet', portrait: 'Portrait' }

export default function App() {
  const [route, setRoute] = useState(parseHash)
  const motion = useReducedMotion()
  const { say, Toast } = useToast()
  useEffect(() => {
    const h = () => {
      const next = parseHash()
      if (next === '' || PAGES[next]) { ScrollTrigger.getAll().forEach(t => t.kill()); setRoute(next); window.scrollTo(0, 0); return }
      // in-page anchor on the story (#taches, #chemin…): scroll there, keep the page mounted
      const el = document.getElementById(next)
      if (!el) return
      if (window.lenis) window.lenis.scrollTo(el, { offset: -64, duration: 1.4 }); else el.scrollIntoView({ block: 'start' })
    }
    addEventListener('hashchange', h); return () => removeEventListener('hashchange', h)
  }, [])
  useEffect(() => { document.title = route ? `${TITLES[route] || 'Certifizer'} · Certifizer` : 'Certifizer · Préparez le PMP sur votre vrai chantier' }, [route])
  if (!route || !PAGES[route]) return <Story key="story" reduced={motion.reduced} motion={motion} />
  const Page = PAGES[route]
  return (
    <div className="work">
      <a className="skip" href="#main">Aller au contenu</a>
      <TopBar route={route} say={say} motion={motion} />
      <main id="main" className="wrap"><Page key={route} reduced={motion.reduced} say={say} /></main>
      <Footer />
      <BottomNav route={route} />
      <Toast />
    </div>
  )
}
