// Source: 21st.dev — "Heat Calendar" by @ssychui (demo id 30542, demo "Default")
// https://21st.dev/@ssychui/components/heat-calendar
// Install: https://21st.dev/r/ssychui/heat-calendar
"use client"

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/** Heat Calendar — weeks of activity as a sequential single-hue grid: magnitude
 *  is the alpha of the ONE hue, never a second color. Hovering a cell floats a
 *  tooltip with its exact count and weekday; clicking a cell pins that whole
 *  week — the column lifts onto a faint plate and the footer holds the week's
 *  total, so the pointer is free to leave. Clicking the pinned week again
 *  releases it. Columns settle in left to right. Light and dark via shadcn
 *  theme tokens; respects reduced motion. */

const EASE = [0.16, 1, 0.3, 1] as const
/* the lift spring: cells are physical objects, so they settle instead of easing */
const LIFT_SPRING = { type: 'spring', stiffness: 500, damping: 30 } as const
/** how far a cell rises when it is the hovered one, its neighbour, or two away */
const LIFT = [1.3, 1.08, 1.03]

/** Pointer devices only: touch never hovers, so the ripple stays off there. */
function useCanHover() {
  const [can, setCan] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)')
    setCan(mq.matches)
    const onChange = () => setCan(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return can
}

const SURFACE = 'var(--surface, var(--card))'
const HAIRLINE = 'var(--border)'

const DAYS = 7
/** 14px cell + 4px gap — the tooltip rides the grid on this pitch */
const PITCH = 18
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** deterministic activity field so demo renders agree (quieter weekends) */
const demoLevel = (w: number, d: number) => {
  const s = Math.sin(w * 12.9898 + d * 78.233) * 43758.5453
  const r = s - Math.floor(s)
  return d >= 5 ? Math.max(0, r - 0.55) * 1.4 : r
}

/** five intensity steps — color-mix percentages of the one hue */
const STEPS = [4, 14, 30, 50, 75]

export default function HeatCalendar({
  title = 'Ship activity',
  unit = 'ships',
  weeks = 12,
  maxCount = 14,
  values,
  color = 'var(--chart-1, #4790e4)',
  className = '',
}: {
  title?: string
  /** noun shown after a count, e.g. "ships", "commits" */
  unit?: string
  weeks?: number
  /** count a cell at intensity 1.0 represents — a cell reads `intensity × maxCount` */
  maxCount?: number
  /** `values[week][day]` intensities in 0..1 (7 days per week); defaults to a deterministic demo field */
  values?: number[][]
  /** the single hue; magnitude maps to its alpha */
  color?: string
  className?: string
}) {
  const reduced = useReducedMotion()
  const canHover = useCanHover()
  const [hover, setHover] = useState<{ w: number; d: number } | null>(null)
  const [pinWeek, setPinWeek] = useState<number | null>(null)

  const level = (w: number, d: number) => values?.[w]?.[d] ?? demoLevel(w, d)
  const step = (v: number) => STEPS[Math.min(4, Math.floor(v * 5))]
  const count = (v: number) => Math.round(v * maxCount)
  const tint = (pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`
  const weekTotal = (w: number) =>
    Array.from({ length: DAYS }, (_, d) => count(level(w, d))).reduce((a, b) => a + b, 0)

  return (
    <div className={`relative w-fit ${className}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-medium text-muted-foreground">{title}</span>
        <span className="text-[11px] text-muted-foreground">{weeks} weeks</span>
      </div>

      <div className="relative mt-3 flex gap-[4px]" onPointerLeave={() => setHover(null)}>
        {Array.from({ length: weeks }, (_, w) => {
          const colOn = pinWeek === w || hover?.w === w
          return (
            <motion.div
              key={w}
              className="flex flex-col gap-[4px] rounded-[5px] transition-colors"
              style={{
                background: pinWeek === w ? 'color-mix(in srgb, var(--foreground) 6%, transparent)' : 'transparent',
              }}
              initial={{ opacity: reduced ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={reduced ? { duration: 0 } : { duration: 0.4, ease: EASE, delay: w * 0.035 }}
            >
              {Array.from({ length: DAYS }, (_, d) => {
                const v = level(w, d)
                const on = hover?.w === w && hover?.d === d
                /* the ripple: the hovered cell rises most, the ring around it a little, two out barely */
                const dist = hover ? Math.max(Math.abs(hover.w - w), Math.abs(hover.d - d)) : 9
                const lift = reduced ? 1 : dist === 0 ? LIFT[0] : canHover && dist < LIFT.length ? LIFT[dist] : 1
                return (
                  <span
                    key={d}
                    className="relative block h-[14px] w-[14px]"
                    style={{ zIndex: lift > 1 ? LIFT.length - dist : 0 }}
                  >
                  {/* the hit area is the cell plus half the gap on every side, so a fast pointer
                      never falls through a gap; the visual inside takes no pointer events, so a
                      lifted neighbour cannot steal a click */}
                  <button
                    type="button"
                    aria-label={`${count(v)} ${unit} · ${DOW[d]}, week ${w + 1}`}
                    aria-pressed={pinWeek === w}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setPinWeek(null)
                        setHover(null)
                      }
                    }}
                    onPointerEnter={() => setHover({ w, d })}
                    onFocus={() => setHover({ w, d })}
                    onClick={() => setPinWeek((p) => (p === w ? null : w))}
                    /* 18px on an 18px pitch, under the 24px target size on purpose: these are dense
                       data marks, the exception WCAG 2.5.8 allows, and each is keyboard-reachable */
                    className="absolute -inset-0.5 block cursor-pointer rounded-[5px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <motion.span
                      className="pointer-events-none absolute inset-0.5 block rounded-[3.5px]"
                      style={{
                        background: tint(step(v)),
                        /* a resting 7% ring, so every cell keeps an edge on a white card too */
                        boxShadow: on
                          ? 'inset 0 0 0 1px color-mix(in srgb, var(--foreground) 40%, transparent)'
                          : `inset 0 0 0 1px color-mix(in srgb, var(--foreground) ${colOn ? 14 : 7}%, transparent)`,
                        transition: 'box-shadow 150ms',
                      }}
                      animate={{ scale: lift }}
                      transition={{ ...LIFT_SPRING, delay: Math.min(dist, 3) * 0.03 }}
                    />
                  </button>
                  </span>
                )
              })}
            </motion.div>
          )
        })}

        {/* tooltip riding the hovered cell — position derived from the grid pitch */}
        <AnimatePresence>
          {hover && (
            <motion.span
              key={`${hover.w}-${hover.d}`}
              role="status"
              className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[9.5px] tabular-nums text-foreground/75"
              style={{
                left: hover.w * PITCH + (hover.w < 3 ? 0 : hover.w > weeks - 4 ? 14 : 7),
                top: hover.d * PITCH - 4,
                translate: hover.w < 3 ? '0 -100%' : hover.w > weeks - 4 ? '-100% -100%' : '-50% -100%',
                background: SURFACE,
                borderColor: HAIRLINE,
                boxShadow: '0 8px 24px -6px rgba(0,0,0,0.35)',
              }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.12 }}
            >
              <b className="font-semibold text-foreground/90">{count(level(hover.w, hover.d))}</b> {unit} · {DOW[hover.d]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">less</span>
          {STEPS.map((pct) => (
            <span key={pct} className="h-[11px] w-[11px] rounded-[3px]" style={{ background: tint(pct) }} />
          ))}
          <span className="text-[10px] text-muted-foreground">more</span>
        </span>
        {/* the pinned week's total — survives the pointer leaving the grid */}
        <span className="tabular-nums text-[11px] text-muted-foreground">
          {pinWeek !== null ? `wk ${pinWeek + 1} · ${weekTotal(pinWeek)} ${unit}` : ' '}
        </span>
      </div>
    </div>
  )
}

export function Demo() {
  return (
    <div className="flex min-h-[260px] w-full items-center justify-center p-6">
      <HeatCalendar />
    </div>
  )
}
