// Source: 21st.dev — "Scroll Reveal Image" by @unlumen (demo id 24466) — https://21st.dev/@unlumen/components/scroll-reveal-image
// Original: framer-motion useScroll(offset ["start end", "start start"]) + useSpring(120/80) animating the container width
//   (40vw → 95vw), inner image scale (1.6 → 1) and border radius (0 → 22px from progress 0.5); next/image inside.
// Changes for Certifizer: the three tracks run on one GSAP ScrollTrigger (scrub 1 ≈ the spring), same offsets and defaults
//   expressed as percentages of the column (fromWidth 40% → toWidth 100%); next/image → <img>; reduced motion = final frame.
import React, { useLayoutEffect, useRef } from 'react'
import { gsap } from '../../motion.js'

export default function ScrollRevealImage({ src, alt, height = '46vh', fromWidth = '40%', toWidth = '100%', fromRadius = 0, toRadius = 22, radiusStart = 0.5, fromScale = 1.6, toScale = 1, reduced, width, height: h, className = '' }) {
  const box = useRef(null)
  const inner = useRef(null)
  useLayoutEffect(() => {
    if (reduced || !box.current) return
    const st = { trigger: box.current, start: 'top bottom', end: 'top top', scrub: 1 }
    const tl = gsap.timeline({ scrollTrigger: st })
    tl.fromTo(box.current, { width: fromWidth, borderRadius: fromRadius }, { width: toWidth, ease: 'none', duration: 1 }, 0)
      .fromTo(box.current, { borderRadius: fromRadius }, { borderRadius: toRadius, ease: 'none', duration: 1 - radiusStart }, radiusStart)
      .fromTo(inner.current, { scale: fromScale }, { scale: toScale, ease: 'none', duration: 1 }, 0)
    return () => { tl.scrollTrigger?.kill(); tl.kill() }
  }, [reduced])
  return (
    <div ref={box} className={`sri ${className}`} style={{ height, width: reduced ? toWidth : fromWidth, borderRadius: reduced ? toRadius : fromRadius }}>
      <div ref={inner} className="sri-inner" style={{ width: '100%', transformOrigin: '50% 50%' }}><img src={src} alt={alt} width={width} height={h} loading="lazy" /></div>
    </div>
  )
}
