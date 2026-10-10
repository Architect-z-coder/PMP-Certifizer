// Source: 21st.dev — "Scroll Progress" by @cnippet-dev (demo id 18715) — https://21st.dev/@cnippet-dev/components/scroll-progress
// Original: motion/react useScroll + useSpring({ damping: 50, stiffness: 200 }) driving scaleX of a fixed bar.
// Changes for Certifizer: the spring became a GSAP quickTo (0.5 s, power3.out) fed by a ScrollTrigger over the whole page,
// so it follows Lenis; Tailwind classes → .progress (chantier.css). Hidden with reduced motion (final state = no bar).
import React, { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../../motion.js'

export default function ScrollProgress({ reduced }) {
  const ref = useRef(null)
  useEffect(() => {
    if (reduced || !ref.current) return
    const setProg = gsap.quickTo(ref.current, 'scaleX', { duration: 0.5, ease: 'power3.out' })
    const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => setProg(s.progress) })
    return () => st.kill()
  }, [reduced])
  if (reduced) return null
  return <div ref={ref} className="progress" aria-hidden="true" />
}
