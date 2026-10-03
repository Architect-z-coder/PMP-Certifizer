// Readiness ring of the working screens (from certifizer-preparation.html): threshold ticks at 50 / 70 / 85.
import React, { forwardRef } from 'react'
const C = 2 * Math.PI * 84
const Ring = forwardRef(function Ring({ value, label, tier }, ref) {
  return (
    <div className="ring" role="img" aria-label={label}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="84" fill="none" stroke="var(--line)" strokeWidth="14" />
        {[50, 70, 85].map((v) => { const a = (v / 100) * Math.PI * 2 - Math.PI / 2; return <line key={v} x1={100 + Math.cos(a) * 73} y1={100 + Math.sin(a) * 73} x2={100 + Math.cos(a) * 95} y2={100 + Math.sin(a) * 95} stroke="var(--muted)" strokeWidth="1.5" /> })}
        <circle ref={ref} className="ring-arc" cx="100" cy="100" r="84" fill="none" stroke="var(--accent)" strokeWidth="14" strokeLinecap="round" transform="rotate(-90 100 100)" strokeDasharray={C} strokeDashoffset={C * (1 - value / 100)} />
      </svg>
      <div className="val"><b><span className="ring-pct">{value}</span> %</b></div>
    </div>
  )
})
export default Ring
export const RING_C = C
