// Source: 21st.dev — "Horizontal Scroll Gallery" by @pulkitxm (demo id 20139) — https://21st.dev/@pulkitxm/components/horizontal-scroll-gallery
// Original: a wrapper of scrollHeight (300%) with a sticky 100vh viewport; a scroll listener maps the wrapper's scrolled
//   fraction to translateX(-progress × (trackWidth − viewportWidth)) on a flex track (w-max, will-change-transform).
// Changes for Certifizer: the scroll listener became a GSAP ScrollTrigger (scrub 0.6, invalidateOnRefresh) so it follows
//   Lenis and exposes `containerAnimation` to children; an `intro` slot sits above the track inside the sticky area;
//   Tailwind → .hz/.hz-sticky/.hz-track; with reduced motion the track simply scrolls sideways (overflow-x: auto).
import React, { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../../motion.js'

export default function HorizontalScrollGallery({ children, intro, scrollHeight = '300%', reduced, onAnimation, ...rest }) {
  const wrapper = useRef(null)
  const track = useRef(null)
  const [tween, setTween] = useState(null)
  useLayoutEffect(() => {
    if (reduced || !wrapper.current || !track.current) return
    const dist = () => Math.max(0, track.current.scrollWidth - window.innerWidth + 32)
    const t = gsap.to(track.current, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: wrapper.current, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true } })
    setTween(t); onAnimation?.(t)
    return () => { t.scrollTrigger?.kill(); t.kill(); setTween(null) }
  }, [reduced])
  return (
    <section ref={wrapper} className="hz" style={{ height: reduced ? 'auto' : scrollHeight }} {...rest}>
      <div className="hz-sticky" style={reduced ? { position: 'static', minHeight: 0, overflow: 'visible' } : undefined}>
        {intro}
        <div style={reduced ? { overflowX: 'auto', overflowY: 'hidden' } : undefined} {...(reduced ? { tabIndex: 0, role: 'region', 'aria-label': 'Livrables, défilement horizontal' } : {})}>
          <div ref={track} className="hz-track">{typeof children === 'function' ? children(tween) : children}</div>
        </div>
      </div>
    </section>
  )
}
