// Source: 21st.dev — "Reveal" by @asanshay (demo id 19240) — https://21st.dev/@asanshay/components/reveal
// Original: motion variants hidden { opacity 0, y 40, blur 10px } → show { delay index*0.15, 0.6 s easeOut }, once, amount 0.2.
// Changes for Certifizer: same values on a GSAP ScrollTrigger (start "top 80%", once); `as` prop for semantic tags;
// with reduced motion the children render in their final state (no tween).
import React, { useLayoutEffect, useRef } from 'react'
import { gsap } from '../../motion.js'

export default function Reveal({ children, className, index = 0, as: Tag = 'div', reduced, ...rest }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    if (reduced || !ref.current) return
    const tween = gsap.from(ref.current, { opacity: 0, y: 40, filter: 'blur(10px)', duration: 0.6, ease: 'power2.out', delay: index * 0.15, scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true } })
    return () => { tween.scrollTrigger?.kill(); tween.kill() }
  }, [reduced, index])
  return <Tag ref={ref} className={className} {...rest}>{children}</Tag>
}
