// Source: 21st.dev — "Reveal Image Mask" by @daiwiikharihar (demo id 10905) — https://21st.dev/@daiwiikharihar/components/reveal-image-mask
// Original: framer-motion useScroll(offset ["start 85%", "end 15%"]) → useSpring(170/24/0.95) → clip-path
//   circle: radius 16% → 75% · rounded: inset 30% → 0 with radius 10% → 0.
// Changes for Certifizer: the same clip-path interpolation is driven by a GSAP ScrollTrigger (scrub 0.8 ≈ the spring),
// start/end match the original offsets; the editorial title/caption block became a <figcaption> slot so the
// "Pour qui" cards keep their own copy; Tailwind → chantier.css; reduced motion = final frame (no clip).
import React, { useLayoutEffect, useRef } from 'react'
import { gsap } from '../../motion.js'

export default function RevealImageMask({ src, alt, shape = 'rounded', className = '', caption, reduced, width, height, loading = 'lazy' }) {
  const ref = useRef(null)
  const img = useRef(null)
  useLayoutEffect(() => {
    if (reduced || !img.current) return
    const from = shape === 'circle' ? 'circle(16% at 50% 50%)' : 'inset(30% round 10%)'
    const to = shape === 'circle' ? 'circle(75% at 50% 50%)' : 'inset(0% round 0%)'
    const tween = gsap.fromTo(img.current, { clipPath: from }, { clipPath: to, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 85%', end: 'bottom 15%', scrub: 0.8 } })
    return () => { tween.scrollTrigger?.kill(); tween.kill() }
  }, [reduced, shape])
  return (
    <figure ref={ref} className={`person ${className}`}>
      <div className="ph" ref={img} style={{ willChange: reduced ? undefined : 'clip-path' }}><img src={src} alt={alt} width={width} height={height} loading={loading} /></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
