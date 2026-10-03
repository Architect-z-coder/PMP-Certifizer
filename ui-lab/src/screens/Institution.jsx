import React from 'react'
import { AlertTriangle, Armchair, Gauge, ShieldCheck } from 'lucide-react'
import { StatsCard } from '@/components/21st/stats-card'
import { LineChart } from '@/components/21st/line-chart'
import ChartDonutHalftone from '@/components/21st/donut-halftone'
import Table05 from '@/components/21st/data-table'
import { Hero115 } from '@/components/21st/hero-115'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, PageHead, Alert, AlertTitle, AlertDescription, TierBadge, pct } from './_shared.jsx'
import { PHOTO_SLOT } from './Acces.jsx'

export default function Institution({ state }) {
  const full = state === 'Sièges épuisés'
  const used = full ? 20 : 14
  const cohorts = [{ id: 'A', name: 'PMP-2026-A', date: '14 nov. 2026', status: 'processing', amount: '61 %', n: 14, ready: 3 }, { id: 'B', name: 'PMP-2026-B', date: '20 mars 2027', status: full ? 'pending' : 'cancelled', amount: full ? '—' : '—', n: full ? 6 : 0, ready: 0 }]
  return (
    <div className="page" style={{ maxWidth: 1040 }}>
      <PageHead kicker="Vue institution · proposition" title="Deux cohortes, vingt sièges, une seule mesure." lead="L’institution voit ce que voient ses formateurs, agrégé : préparation moyenne, apprenants prêts, sièges consommés. Jamais le détail d’un apprenant : cela reste entre lui et son formateur."><Badge variant="outline" className="font-normal">N’existe pas encore dans le produit</Badge></PageHead>
      {full && <Alert variant="destructive" className="mb-5"><AlertTriangle className="size-4" aria-hidden="true" /><AlertTitle>Vos 20 sièges sont tous attribués.</AlertTitle><AlertDescription>Les prochaines invitations seront refusées jusqu’au renouvellement du 1er janvier ou à l’ajout de sièges.</AlertDescription></Alert>}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Sièges" value={`${used} / 20`} icon={<Armchair className="size-4 text-muted-foreground" aria-hidden="true" />} change={full ? 'épuisés' : `${20 - used} libres`} changeType={full ? 'negative' : 'positive'} changeNote="· renouvellement le 1er janvier" />
        <StatsCard title="Préparation moyenne" value="61 %" icon={<Gauge className="size-4 text-muted-foreground" aria-hidden="true" />} change="indicateur Certifizer" changeType="positive" changeNote="· cohorte A" />
        <StatsCard title="Prêt·es pour l’examen" value="3" icon={<ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />} change="≥ 85 %" changeType="positive" changeNote="· cohorte A" />
      </div>
      <section className="section">
        <h2 className="mb-4">Cohortes</h2>
        <Table05 data={cohorts} pageSize={5} className="w-full space-y-4" searchPlaceholder="Rechercher une cohorte…" columns={[
          { accessorKey: 'name', header: 'Cohorte', cell: ({ row }) => <code className="text-sm font-medium">{row.getValue('name')}</code> },
          { accessorKey: 'n', header: 'Apprenants', cell: ({ row }) => <span className="num">{row.getValue('n')}</span> },
          { accessorKey: 'amount', header: 'Préparation moyenne', cell: ({ row }) => row.original.n ? <TierBadge tier={2}>{row.getValue('amount')}</TierBadge> : <span className="text-muted-foreground">pas encore de mesure</span> },
          { accessorKey: 'ready', header: 'Prêt·es', cell: ({ row }) => <span className="num">{row.getValue('ready')}</span> },
          { accessorKey: 'date', header: 'Examen' },
        ]} />
      </section>
      <section className="section grid gap-6 lg:grid-cols-2">
        <LineChart data={[{ mois: 'juil.', A: 21 }, { mois: 'août', A: 31 }, { mois: 'sept.', A: 49 }, { mois: 'oct.', A: 61 }]} xKey="mois" yKeys={['A']} title="Préparation moyenne · PMP-2026-A" description="Une mesure par mois (Exemple)." showDots />
        <Card><CardHeader><CardTitle>Sièges par cohorte</CardTitle><CardDescription>{used} attribués sur 20.</CardDescription></CardHeader><CardContent className="flex justify-center"><ChartDonutHalftone className="flex-wrap justify-center" title="Sièges" unit="sièges" data={[{ label: 'PMP-2026-A', value: 14 }, { label: 'PMP-2026-B', value: full ? 6 : 0 }, { label: 'Libres', value: 20 - used }].filter(d => d.value > 0)} /></CardContent></Card>
      </section>
      <section className="section [&_section]:py-6" aria-label="Travail réel">
        <Hero115 icon={<ShieldCheck className="size-6" aria-hidden="true" />} heading="La formation produit du travail réel." description="Quand « Relier à mon projet » sera ouvert, cette vue montrera aussi les livrables validés par les formateurs : charte, WBS, registre des risques." button={{ text: 'Voir le cockpit formateur', url: '#cockpit' }} trustText="Données « Exemple » · cette vue est une proposition : le backend ne possède ni écran ni point d’accès institution." imageSrc={PHOTO_SLOT.src} imageAlt={PHOTO_SLOT.alt} />
      </section>
    </div>
  )
}
