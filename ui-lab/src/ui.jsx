import React, { useEffect, useRef } from 'react'
import { Check, X, Lock, Sparkles, Info, AlertTriangle, ChevronRight } from 'lucide-react'
import { DOMAINS, LIGHT_LABEL } from './data.js'

export const pct = (x) => `${Math.round(x * 100)} %`
export const cx = (...a) => a.filter(Boolean).join(' ')

export function Meter({ value, tier, thin, label }) {
  return (
    <div className={cx('meter', thin && 'meter-thin')} data-tier={tier ?? ''} role="img" aria-label={label || `${Math.round(value * 100)} %`}>
      <span style={{ width: `${Math.max(2, Math.round(value * 100))}%` }} />
    </div>
  )
}

export function TierChip({ tier, children }) {
  return <span className={cx('chip chip-tier', `tier-${tier}`)}><span className="dot" aria-hidden="true" />{children}</span>
}

export function LightChip({ light }) {
  const l = LIGHT_LABEL[light]
  return <TierChip tier={l.tier}>{l.fr}</TierChip>
}

export function DomainTag({ id }) {
  const d = DOMAINS.find(x => x.id === id)
  return <span className="chip" style={{ color: `var(--dom-${id === 'business' ? 'be' : id})`, background: 'transparent', paddingLeft: 0 }}><span className="dot" aria-hidden="true" />{d.fr} · {Math.round(d.weight * 100)} %</span>
}

export function Premium({ children, label = 'Premium', note }) {
  return (
    <div className="premium" aria-describedby={undefined}>
      <div className="premium-body" aria-hidden="true">{children}</div>
      <span className="premium-tag"><Lock size={11} aria-hidden="true" /> {label}</span>
      <span className="sr-only">{note || 'Contenu disponible avec le plan Premium.'}</span>
    </div>
  )
}

export function Switch({ checked, onChange, label, id }) {
  return (
    <button type="button" role="switch" aria-checked={checked} id={id} className="switch" onClick={() => onChange(!checked)}>
      <span className="switch-track" aria-hidden="true"><span className="switch-thumb" /></span>
      <span>{label}</span>
    </button>
  )
}

export function Seg({ options, value, onChange, label, size }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button type="button" key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} style={size === 'sm' ? { minHeight: 32, padding: '0 10px', fontSize: 12 } : undefined}>{o.label}</button>
      ))}
    </div>
  )
}

export function Modal({ title, children, onClose, labelledBy = 'modal-title' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    const first = el?.querySelector('button, [href], input, textarea, select')
    first?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={ref}>
        <div className="card-head">
          <h2 id={labelledBy} style={{ fontSize: 'var(--t-xl)' }}>{title}</h2>
          {onClose && <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fermer"><X size={18} aria-hidden="true" /></button>}
        </div>
        {children}
      </div>
    </div>
  )
}

export function Callout({ kind, icon, children }) {
  const I = icon || (kind === 'danger' ? AlertTriangle : kind === 'accent' ? Sparkles : Info)
  return <div className={cx('callout', kind && `callout-${kind}`)} role={kind === 'danger' ? 'alert' : undefined}><I aria-hidden="true" /><div>{children}</div></div>
}

export function Toast({ children }) {
  return <div role="status" className="card" style={{ position: 'fixed', left: '50%', bottom: 'calc(var(--s-6) + 64px + env(safe-area-inset-bottom, 0px))', transform: 'translateX(-50%)', zIndex: 70, padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center', boxShadow: 'var(--shadow-md)' }}><Check size={16} aria-hidden="true" /> {children}</div>
}

export function Empty({ icon: I, title, children, action, level = 2 }) {
  const H = `h${level}`
  return (
    <div className="empty">
      {I && <I aria-hidden="true" />}
      <H style={{ fontSize: "var(--t-xl)" }}>{title}</H>
      {children && <p className="muted" style={{ marginTop: 8, maxWidth: '44ch', marginInline: 'auto' }}>{children}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  )
}

export function Skeleton({ h = 16, w = '100%', style }) {
  return <div className="skeleton" style={{ height: h, width: w, ...style }} aria-hidden="true" />
}

export function ExampleTag() {
  return <span className="chip chip-outline" style={{ fontSize: 11, minHeight: 22 }}>Exemple</span>
}

export function LinkRow({ children, onClick, href }) {
  const Tag = href ? 'a' : 'button'
  return <Tag type={href ? undefined : 'button'} href={href} onClick={onClick} className="btn btn-ghost" style={{ justifyContent: 'space-between', width: '100%', padding: '0 var(--s-2)' }}>{children}<ChevronRight size={16} aria-hidden="true" /></Tag>
}

/* ---------- Vignettes: people doing real project work (vector, token-coloured) ---------- */
export function Vignette({ kind = 'site', caption, style }) {
  const ink = 'var(--ink)', acc = 'var(--accent)', paper = 'var(--surface)', soft = 'var(--surface-2)', line = 'var(--line-strong)'
  const scenes = {
    site: (
      <svg viewBox="0 0 400 300" role="img" aria-label={caption || 'Deux chefs de projet lisent un plan sur un chantier'}>
        <rect width="400" height="300" fill={soft} />
        <rect x="0" y="210" width="400" height="90" fill={line} opacity="0.5" />
        <path d="M40 210 L120 120 L200 210 Z" fill={paper} stroke={line} />
        <rect x="230" y="110" width="130" height="100" fill={paper} stroke={line} />
        <rect x="250" y="130" width="22" height="26" fill={soft} /><rect x="290" y="130" width="22" height="26" fill={soft} /><rect x="330" y="130" width="22" height="26" fill={soft} />
        <rect x="90" y="40" width="6" height="170" fill={ink} opacity="0.85" /><rect x="60" y="46" width="110" height="6" fill={ink} opacity="0.85" />
        <line x1="166" y1="52" x2="166" y2="110" stroke={ink} strokeWidth="2" /><rect x="156" y="110" width="20" height="14" fill={acc} />
        <circle cx="150" cy="150" r="14" fill={ink} /><rect x="136" y="166" width="28" height="48" rx="8" fill={acc} />
        <circle cx="196" cy="156" r="14" fill={ink} /><rect x="182" y="172" width="28" height="42" rx="8" fill={ink} />
        <rect x="150" y="180" width="60" height="30" rx="3" fill={paper} stroke={ink} strokeWidth="2" transform="rotate(-8 180 195)" />
        <line x1="158" y1="190" x2="200" y2="184" stroke={acc} strokeWidth="2" /><line x1="160" y1="198" x2="196" y2="193" stroke={line} strokeWidth="2" />
        <path d="M136 136 a14 8 0 0 1 28 0" fill={acc} /><path d="M182 142 a14 8 0 0 1 28 0" fill={acc} />
      </svg>
    ),
    board: (
      <svg viewBox="0 0 400 300" role="img" aria-label={caption || 'Une équipe planifie un échéancier devant un tableau'}>
        <rect width="400" height="300" fill={soft} />
        <rect x="60" y="40" width="280" height="150" rx="6" fill={paper} stroke={line} />
        <line x1="80" y1="70" x2="320" y2="70" stroke={line} />
        {[0,1,2,3,4].map(i => <rect key={i} x={90 + i*18} y={84 + i*20} width={70 + (i%3)*30} height="10" rx="5" fill={i===2 ? acc : ink} opacity={i===2 ? 1 : 0.75} />)}
        <line x1="212" y1="76" x2="212" y2="186" stroke={acc} strokeDasharray="4 4" />
        <circle cx="120" cy="226" r="16" fill={ink} /><rect x="102" y="244" width="36" height="50" rx="10" fill={acc} />
        <circle cx="200" cy="230" r="16" fill={ink} /><rect x="182" y="248" width="36" height="46" rx="10" fill={ink} />
        <circle cx="280" cy="224" r="16" fill={ink} /><rect x="262" y="242" width="36" height="52" rx="10" fill={ink} opacity="0.8" />
        <line x1="296" y1="250" x2="330" y2="160" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </svg>
    ),
    desk: (
      <svg viewBox="0 0 400 300" role="img" aria-label={caption || 'Une cheffe de projet rédige un registre des risques'}>
        <rect width="400" height="300" fill={soft} />
        <rect x="40" y="200" width="320" height="12" rx="4" fill={line} />
        <rect x="120" y="110" width="160" height="90" rx="4" fill={paper} stroke={line} />
        {[0,1,2,3].map(i => <g key={i}><rect x="134" y={124 + i*18} width="10" height="10" rx="2" fill={i<2 ? acc : soft} stroke={line} /><rect x="152" y={126 + i*18} width={60 + i*12} height="6" rx="3" fill={ink} opacity="0.6" /></g>)}
        <circle cx="300" cy="120" r="18" fill={ink} /><rect x="278" y="140" width="44" height="60" rx="12" fill={acc} />
        <line x1="284" y1="170" x2="250" y2="190" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <rect x="60" y="150" width="40" height="50" rx="4" fill={paper} stroke={line} /><rect x="66" y="158" width="28" height="4" fill={acc} /><rect x="66" y="168" width="28" height="4" fill={line} /><rect x="66" y="178" width="20" height="4" fill={line} />
      </svg>
    ),
  }
  return <figure style={style}><div className="photo">{scenes[kind]}</div>{caption && <figcaption className="small subtle" style={{ marginTop: 8 }}>{caption}</figcaption>}</figure>
}
