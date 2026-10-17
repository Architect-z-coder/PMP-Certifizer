// Working-screen chrome: top bar with 5 entries + account menu (top-right), bottom bar on phone, toast.
import React, { useEffect, useRef, useState } from 'react'
import { LEARNER } from '../../data.js'

export const NAV = [['aujourdhui', "Aujourd'hui"], ['parcours', 'Parcours'], ['entrainer', 'S’entraîner'], ['projet', 'Mon projet'], ['portrait', 'Portrait']]

export function Brand({ href = '#/', size = 28 }) {
  return (
    <a className="brand" href={href} aria-label="Certifizer, accueil">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true"><path d="M20 6 L34 31 L6 31 Z" fill="none" stroke="var(--accent)" strokeWidth="2.8" strokeLinejoin="round" /><circle cx="20" cy="6" r="3.2" fill="var(--accent)" /><circle cx="6" cy="31" r="3.2" fill="var(--fg)" /><circle cx="34" cy="31" r="3.2" fill="var(--process)" /></svg>
      Certifizer
    </a>
  )
}

export function TopBar({ route, say, motion }) {
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  useEffect(() => { const h = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }; document.addEventListener('click', h); return () => document.removeEventListener('click', h) }, [])
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setOpen(false) }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [])
  return (
    <header className="bar">
      <div className="wrap bar-in">
        <Brand />
        <nav className="tabs" aria-label="Navigation principale">
          {NAV.map(([h, l]) => <a key={h} href={`#/${h}`} aria-current={route === h ? 'page' : undefined}>{l}</a>)}
        </nav>
        <div className="acct" ref={box}>
          <button className="acct-btn" type="button" aria-haspopup="true" aria-expanded={open} aria-controls="acct-menu" onClick={() => setOpen(!open)}><span className="avatar" aria-hidden="true">{LEARNER.initials}</span><span className="mono">{LEARNER.cohort}</span></button>
          {open && (
            <div className="menu" id="acct-menu">
              <div className="who"><b>{LEARNER.name}</b><div className="mono muted">Cohorte {LEARNER.cohort} · Gratuit</div></div>
              <a href="#/aujourdhui" onClick={(e) => { e.preventDefault(); setOpen(false); say('Aperçu : Réglages et données s’ouvrent ici.') }}>Réglages et données <span aria-hidden="true">→</span></a>
              <a href="#/aujourdhui" onClick={(e) => { e.preventDefault(); setOpen(false); say('Aperçu : le cockpit formateur s’ouvre ici.') }}>Cockpit formateur <span aria-hidden="true">→</span></a>
              <button className="item" type="button" onClick={() => { setOpen(false); say('Aperçu : la version anglaise suit la même mise en page.') }}>Langue <span className="mono">FR · EN</span></button>
              <button className="item" type="button" role="switch" aria-checked={motion.toggled} onClick={() => motion.toggle()}>Réduire les animations <span className="mono">{motion.toggled ? 'oui' : 'non'}</span></button>
              <a href="#/">Page d’accueil <span aria-hidden="true">→</span></a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export function BottomNav({ route }) {
  return (
    <nav className="bottomnav" aria-label="Navigation principale (mobile)">
      {NAV.map(([h, l]) => <a key={h} href={`#/${h}`} aria-current={route === h ? 'page' : undefined}>{l}</a>)}
    </nav>
  )
}

export function useToast() {
  const [msg, setMsg] = useState('')
  const t = useRef()
  const say = (m) => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(''), 2600) }
  const Toast = () => <div className="toast" role="status" aria-live="polite" hidden={!msg}>{msg}</div>
  return { say, Toast }
}

export function Footer() {
  return <footer className="wrap">Aperçu visuel, données « Exemple » (apprenant fictif). Rien n’est enregistré.</footer>
}
