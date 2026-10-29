// Source: 21st.dev — "Video Scroll Hero" by @isaiahbjork (demo id 7512) — https://21st.dev/@isaiahbjork/components/video-scroll-hero
// Original: a 200vh container with a sticky 100vh stage; a scroll listener computes progress = scrolled / (height − viewport)
//   and sets transform: scale(startScale + progress × (1 − startScale)) on the video frame (startScale 0.25); autoplay video;
//   framer-motion fades a caption overlay; reduced motion → scale(1).
// Changes for Certifizer: the scroll listener became a GSAP ScrollTrigger (pin-less: the stage stays sticky as in the
//   original, scrub 0.8); the <video> is the shared <Film> (muted, loop, poster, paused off-screen, poster-only with
//   reduced motion — MEDIA.md rules); the overlay copy is a slot; Tailwind → .vsh/.vsh-sticky/.vsh-frame.
import React, { useLayoutEffect, useRef } from 'react'
import { gsap } from '../../motion.js'
import Film from '../Film.jsx'

export default function VideoScrollHero({ src, poster, startScale = 0.25, children, reduced, label }) {
  const root = useRef(null)
  const frame = useRef(null)
  useLayoutEffect(() => {
    if (reduced || !root.current) return
    const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
    tl.fromTo(frame.current, { scale: startScale, borderRadius: 28 }, { scale: 1, borderRadius: 0, ease: 'power2.inOut', duration: 1 })
      .from(frame.current.querySelectorAll('.reel-cap > *'), { y: 30, opacity: 0, stagger: 0.12, duration: 0.4 }, 0.55)
    return () => { tl.scrollTrigger?.kill(); tl.kill() }
  }, [reduced, startScale])
  return (
    <section ref={root} className="vsh" aria-label={label} style={reduced ? { height: 'auto' } : undefined}>
      <div className="vsh-sticky" style={reduced ? { position: 'static', height: '70vh' } : undefined}>
        <div ref={frame} className="vsh-frame" style={reduced ? { borderRadius: 0 } : { transform: `scale(${startScale})` }}>
          <Film src={src} poster={poster} reduced={reduced} />
          <div className="reel-cap wrap">{children}</div>
        </div>
      </div>
    </section>
  )
}
