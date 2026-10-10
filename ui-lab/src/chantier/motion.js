// Motion runtime shared by the Chantier screens: GSAP + ScrollTrigger + Lenis, gated by reduced motion.
// Rule: story pages scroll-tell with ScrollTrigger + Lenis; working screens get one quiet entrance only;
// with prefers-reduced-motion (or the account-menu toggle) everything renders in its final state.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)
export { gsap, ScrollTrigger }

const mq = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null)
const ls = { get: (k, d) => { try { return localStorage.getItem(k) ?? d } catch { return d } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch {} } }

/** true when the OS asks for reduced motion OR the user toggled it in the account menu. */
export function useReducedMotion() {
  const [sys, setSys] = useState(() => !!mq()?.matches)
  const [pref, setPref] = useState(() => ls.get('cz-reduced', 'false') === 'true')
  useEffect(() => { const m = mq(); if (!m) return; const h = (e) => setSys(e.matches); m.addEventListener('change', h); return () => m.removeEventListener('change', h) }, [])
  useEffect(() => { document.documentElement.setAttribute('data-reduced-motion', String(sys || pref)) }, [sys, pref])
  const toggle = () => { ls.set('cz-reduced', String(!pref)); setPref(!pref) }
  return { reduced: sys || pref, toggled: pref, toggle }
}

/** Lenis smooth scroll, wired to ScrollTrigger (story pages only). Returns the instance ref. */
export function useLenis(enabled) {
  const ref = useRef(null)
  useEffect(() => {
    if (!enabled) return
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 })
    ref.current = lenis
    window.lenis = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    document.documentElement.classList.add('lenis', 'lenis-smooth')
    return () => { gsap.ticker.remove(raf); lenis.destroy(); ref.current = null; window.lenis = null; document.documentElement.classList.remove('lenis', 'lenis-smooth') }
  }, [enabled])
  return ref
}

/** gsap.context bound to a root ref; `fn(ctx, root)` runs after layout and is reverted on unmount. */
export function useGsap(fn, deps = []) {
  const root = useRef(null)
  useLayoutEffect(() => {
    if (!root.current) return
    const ctx = gsap.context(() => fn(root.current), root)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return root
}

export const refreshSoon = () => { requestAnimationFrame(() => ScrollTrigger.refresh()) }
