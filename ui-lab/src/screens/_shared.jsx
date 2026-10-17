// Small compositions of 21st.dev components shared by the screens.
// Only two things here are hand-built (see 21st-manifest.md): the premium veil and the "Exemple" tag.
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/21st/alert'
import { Skeleton } from '@/components/21st/skeleton'
import { EmptyState } from '@/components/21st/empty-state'
import { Sparkles, Lock } from 'lucide-react'
import { READINESS_TIERS, LIGHT_LABEL, DOMAINS } from '../data.js'

export { Badge, Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Alert, AlertTitle, AlertDescription, Skeleton, EmptyState }

export const pct = (x) => `${Math.round(x * 100)} %`

const TIER_CLASS = { 0: 'bg-tier-0/10 text-tier-0-ink', 1: 'bg-tier-1/10 text-tier-1-ink', 2: 'bg-tier-2/10 text-tier-2-ink', 3: 'bg-tier-3/10 text-tier-3-ink', 4: 'bg-tier-4/10 text-tier-4-ink' }
export function TierBadge({ tier, children, className = '' }) {
  const t = typeof tier === 'object' ? tier : READINESS_TIERS.find(x => x.tier === tier)
  return <Badge variant="outline" className={`border-0 font-medium ${TIER_CLASS[t?.tier ?? 0]} ${className}`}>{children ?? t?.fr}</Badge>
}
export function LightBadge({ light }) {
  const l = LIGHT_LABEL[light]
  return <Badge variant="outline" className={`border-0 font-medium ${TIER_CLASS[l.tier]}`}>{l.fr}</Badge>
}
const DOM_CLASS = { people: 'bg-dom-people/10 text-dom-people-ink', process: 'bg-dom-process/10 text-dom-process-ink', business: 'bg-dom-be/10 text-dom-be-ink' }
export function DomainBadge({ id }) {
  const d = DOMAINS.find(x => x.id === id)
  return <Badge variant="outline" className={`border-0 font-medium ${DOM_CLASS[id]}`}>{d?.fr}</Badge>
}
export function ExampleTag() {
  return <Badge variant="secondary" className="font-normal text-muted-foreground">Exemple</Badge>
}
export function PremiumTag() {
  return <Badge className="premium-tag gap-1 border-0 bg-warm text-warm-ink hover:bg-warm"><Sparkles className="size-3" aria-hidden="true" /> Premium</Badge>
}
// Premium veil: real content stays visible, softly blurred, with a one-line reason.
export function Premium({ children, reason = 'Inclus dans Premium', cta = 'Découvrir Premium', go }) {
  return (
    <div className="premium">
      <PremiumTag />
      <div className="premium-body" aria-hidden="true">{children}</div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
        <p className="text-sm text-muted-foreground"><Lock className="mr-1 inline size-3.5 align-[-2px]" aria-hidden="true" />{reason}</p>
        <Button size="sm" variant="outline" onClick={() => go?.('premium')}>{cta}</Button>
      </div>
    </div>
  )
}
export function PageHead({ title, lead, children, kicker }) {
  return (
    <div className="page-head">
      <div>
        {kicker && <p className="label mb-2">{kicker}</p>}
        <h1>{title}</h1>
        {lead && <p className="lead mt-2">{lead}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
export function LoadingCard({ lines = 3 }) {
  return (
    <Card aria-busy="true" aria-label="Chargement">
      <CardHeader><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-3/5" /></CardHeader>
      <CardContent className="space-y-2">{Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className="h-3" style={{ width: `${90 - i * 12}%` }} />)}</CardContent>
    </Card>
  )
}
export function ErrorAlert({ title = 'Impossible de charger pour le moment', children, onRetry }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{children ?? 'Vos données sont intactes. Réessayez dans un instant.'}</p>
        {onRetry && <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>Réessayer</Button>}
      </AlertDescription>
    </Alert>
  )
}
