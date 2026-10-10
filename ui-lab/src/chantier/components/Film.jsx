// A film, by the MEDIA.md rules: muted, looping, playsinline, with a poster; plays only while on screen
// (IntersectionObserver, threshold 0.15); with reduced motion the poster alone is shown. Films are decorative
// (aria-hidden), so every caption lives in the DOM next to them. Story pages only.
import React, { useEffect, useRef } from 'react'

export default function Film({ src, poster, reduced, className = 'film' }) {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (reduced || !v || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => {}) } else v.pause() }), { threshold: 0.15 })
    io.observe(v)
    return () => { io.disconnect(); v.pause() }
  }, [reduced])
  if (reduced) return <img className={className} src={poster} alt="" aria-hidden="true" />
  return <video ref={ref} className={className} muted loop playsInline preload="metadata" poster={poster} aria-hidden="true"><source src={src} type="video/mp4" /></video>
}
