import React, { useMemo, useRef, useState } from 'react'
import { Plus, Mail, Users, Flag, Download, Maximize2, AlertTriangle, Gauge, ShieldCheck, Activity, Search } from 'lucide-react'
import { COHORT, COHORT_TASKS, BANDS, cohortBand, FLAGS, DOMAINS, TASKS } from '../data.js'
import { KnowledgeGraph } from '@/components/21st/knowledge-graph'
import AnimatedTabs from '@/components/21st/animated-tabs'
import { StatsCard } from '@/components/21st/stats-card'
import Table05 from '@/components/21st/data-table'
import HeatCalendar from '@/components/21st/heat-calendar'
import ChartDonutHalftone from '@/components/21st/donut-halftone'
import { RadarChart } from '@/components/21st/radar-chart'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/21st/popover'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, PageHead, TierBadge, EmptyState, ErrorAlert, LoadingCard, Skeleton, pct } from './_shared.jsx'

const tierOf = (r) => r < 0.5 ? 1 : r < 0.7 ? 2 : r < 0.85 ? 3 : 4
const TIER_COLOR = { 1: 'var(--tier-1)', 2: 'var(--tier-2)', 3: 'var(--tier-3)', 4: 'var(--tier-4)' }
const DOM_COLOR = { people: 'var(--dom-people)', process: 'var(--dom-process)', business: 'var(--dom-be)' }
const TABS = [{ id: 'map', label: 'Constellation' }, { id: 'groups', label: 'Groupes' }, { id: 'heat', label: 'Heatmap' }, { id: 'quality', label: 'Qualité' }]

export default function Cockpit({ state }) {
  const [tab, setTab] = useState({ Constellation: 'map', "Groupes d'action": 'groups', Heatmap: 'heat', 'Qualité des questions': 'quality' }[state] || 'map')
  if (state === 'Chargement') return <div className="page flex flex-col gap-4" aria-busy="true"><p className="label">Cockpit formateur</p><Skeleton className="h-10 w-2/5" /><div className="grid gap-4 md:grid-cols-3"><LoadingCard lines={1} /><LoadingCard lines={1} /><LoadingCard lines={1} /></div><LoadingCard lines={8} /></div>
  if (state === 'Erreur') return <div className="page flex flex-col gap-4"><p className="label">Cockpit formateur</p><h1>Cohorte PMP-2026-A</h1><ErrorAlert title="Impossible de charger la cohorte" onRetry={() => {}}>Le serveur se réveille peut-être ; réessayez dans quelques secondes. Vos séances et invitations sont intactes.</ErrorAlert></div>
  if (state === 'Cohorte vide') return <div className="page flex flex-col gap-6"><p className="label">Cockpit formateur</p><h1>Votre cohorte est vide pour l’instant.</h1><EmptyState className="max-w-none" icons={[Users, Mail, Gauge]} title="Aucun apprenant rattaché" description="Partagez le code de classe PMP-2026-A ou créez des liens d’invitation à usage unique." action={{ label: 'Créer des invitations', onClick: () => { location.hash = 'invitations' } }} /></div>
  const L = COHORT.learners
  const mean = L.reduce((s, l) => s + l.readiness, 0) / L.length
  const ready = L.filter(l => l.readiness >= 0.85).length, risk = L.filter(l => l.readiness < 0.5).length, active = L.filter(l => l.inactive <= 7).length
  const fragile = [...COHORT_TASKS].filter(t => t.tested).sort((a, b) => a.avg - b.avg).slice(0, 3)
  return (
    <div className="page" style={{ maxWidth: 1240 }}>
      <PageHead kicker={<>Cockpit formateur · cohorte <span className="num">PMP-2026-A</span> · {L.length} apprenants · examen le 14 nov.</>} title="Ce qui bloque la cohorte, et quoi faire aujourd’hui.">
        <Button asChild><a href="#seance-ciblee"><Plus className="mr-2 size-4" aria-hidden="true" /> Créer une séance ciblée</a></Button><Button variant="secondary" asChild><a href="#invitations"><Mail className="mr-2 size-4" aria-hidden="true" /> Inviter</a></Button>
      </PageHead>
      <div className="grid-main" style={{ '--aside-w': '340px' }}>
        <div className="flex flex-col gap-6">
          <section className="grid gap-4 md:grid-cols-3" aria-label="Indicateurs">
            <StatsCard title="Préparation moyenne" value={pct(mean)} icon={<TierBadge tier={tierOf(mean)} />} change="+4 pts" changeType="positive" />
            <StatsCard title="Prêt·es pour l’examen" value={String(ready)} icon={<ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />} change={`sur ${L.length}`} changeType="positive" changeNote="· ≥ 85 %" />
            <StatsCard title="À risque" value={String(risk)} icon={<AlertTriangle className="size-4 text-muted-foreground" aria-hidden="true" />} change="< 50 % ou inactifs" changeType="negative" changeNote="" />
          </section>
          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0"><CardTitle id="h-tabs">{TABS.find(t => t.id === tab).label === 'Constellation' ? 'Constellation de la cohorte' : tab === 'groups' ? 'Groupes d’action' : tab === 'heat' ? 'Carte de chaleur par tâche' : 'Qualité des questions'}</CardTitle><AnimatedTabs variant="segment" className="flex-wrap" layoutId="cockpit-tabs" activeTab={tab} onChange={setTab} tabs={TABS} /></CardHeader>
            <CardContent>
              {tab === 'map' && <Constellation />}
              {tab === 'groups' && <Groups />}
              {tab === 'heat' && <Heat />}
              {tab === 'quality' && <Quality />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Apprenants</CardTitle><CardDescription>Codes « Exemple ». Tri par colonne, recherche, sélection pour une séance ciblée.</CardDescription></CardHeader>
            <CardContent><LearnerTable /></CardContent>
          </Card>
        </div>
        <aside className="flex flex-col gap-4" aria-label="Brief du jour">
          <Card><CardHeader><CardDescription className="label">Brief du jour</CardDescription></CardHeader><CardContent><p>{active} apprenants actifs sur 7 jours. Le chemin critique collectif commence par <strong>{fragile[0].fr}</strong> : {fragile[0].fragile} apprenants fragiles sur {fragile[0].tested} testés. Une mini-séance de 20 minutes sur cette tâche est le geste le plus rentable aujourd’hui.</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Ce qui bloque le plus</CardTitle></CardHeader><CardContent><ul className="divide-y text-sm">{fragile.map(t => <li key={t.id} className="py-2"><div className="flex items-center justify-between gap-2"><span>{t.id} · {t.fr}</span><TierBadge tier={tierOf(t.avg)}>{pct(t.avg)}</TierBadge></div><p className="text-muted-foreground">{t.fragile} fragiles sur {t.tested} testés</p></li>)}</ul></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Interventions suggérées</CardTitle></CardHeader><CardContent>
            <ul className="divide-y text-sm">
              {[['Priorité 1', `Mini-séance · ${fragile[0].fr}`, 'Planifier 20 min', () => { location.hash = 'seance-ciblee' }], ['Suivi', `${risk} apprenants à risque`, 'Voir le groupe', () => setTab('groups')], ['Qualité', `${FLAGS.length} questions signalées`, 'Trancher', () => setTab('quality')]].map(([k, t, cta, fn]) => <li key={k} className="flex items-center justify-between gap-3 py-2"><div><p className="label">{k}</p><p>{t}</p></div><Button size="sm" variant="secondary" onClick={fn}>{cta}</Button></li>)}
            </ul></CardContent></Card>
          <Card className="bg-muted/40"><CardHeader><CardTitle className="text-base">Séances ciblées</CardTitle></CardHeader><CardContent><ul className="text-sm"><li className="flex items-center justify-between gap-2"><span>Risques &amp; obstacles · 8 questions</span><Badge variant="secondary" className="font-normal">en attente · 9/14</Badge></li></ul></CardContent></Card>
        </aside>
      </div>
    </div>
  )
}

/* Constellation: learners as stars around the three domains (21st Knowledge Graph, d3 force layout, zoom + export). */
function Constellation() {
  const ref = useRef(null)
  const [sel, setSel] = useState(null)
  // Positions are pinned (fx/fy): distance to the domain = 1 − readiness, as in the product rule. Zoom, pan, tooltip and export stay the component's.
  const nodes = useMemo(() => [...DOMAINS.map((d, i) => ({ id: d.id, label: d.fr, type: 'Domaine', size: 22, color: DOM_COLOR[d.id], fx: [170, 330, 490][i], fy: [150, 310, 150][i] })), ...COHORT.learners.map((l, i) => { const hub = [[170, 150], [330, 310], [490, 150]][i % 3]; const a = (Math.floor(i / 3) / Math.ceil(COHORT.learners.length / 3)) * Math.PI * 2 + (i % 3) * 0.7; const rr = 60 + (1 - l.readiness) * 70; return { id: `l${i}`, label: l.name.split(' ')[0], type: ['', 'Pas encore prêt·e', 'En construction', 'Presque prêt·e', 'Prêt·e pour l’examen'][tierOf(l.readiness)], size: l.inactive > 7 ? 8 : 11, color: TIER_COLOR[tierOf(l.readiness)], data: l, fx: hub[0] + Math.cos(a) * rr, fy: hub[1] + Math.sin(a) * rr * 0.8 } })], [])
  const links = useMemo(() => COHORT.learners.map((l, i) => ({ source: DOMAINS[i % 3].id, target: `l${i}`, strength: 0.6 + l.readiness * 0.4 })), [])
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Chaque étoile est un apprenant ; sa couleur dit son palier, sa proximité au domaine sa préparation. Molette pour zoomer, glisser pour déplacer.</p>
        <div className="flex gap-1"><Button variant="ghost" size="icon" aria-label="Réinitialiser la vue" onClick={() => ref.current?.resetZoom()}><Maximize2 className="size-4" aria-hidden="true" /></Button><Button variant="secondary" size="sm" onClick={() => ref.current?.exportAsSVG()}><Download className="mr-2 size-3.5" aria-hidden="true" /> Exporter (SVG)</Button></div>
      </div>
      <div className="h-[460px] overflow-hidden rounded-xl border bg-muted/30" role="group" aria-label="Constellation de la cohorte PMP-2026-A : 14 apprenants autour de 3 domaines">
        <KnowledgeGraph ref={ref} nodes={nodes} links={links} showLinkLabels={false} onNodeClick={(n) => { if (n.data) setSel(n.data) }} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <ul className="flex flex-wrap gap-3 text-muted-foreground">{[1, 2, 3, 4].map(t => <li key={t} className="flex items-center gap-1.5"><span className="size-3 rounded-full" style={{ background: TIER_COLOR[t] }} aria-hidden="true" />{['', 'Pas encore prêt·e', 'En construction', 'Presque prêt·e', 'Prêt·e pour l’examen'][t]}</li>)}<li className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-foreground" aria-hidden="true" />petite étoile : inactif &gt; 7 j</li></ul>
        {sel && <div className="flex items-center gap-2" aria-live="polite"><strong>{sel.name}</strong><TierBadge tier={tierOf(sel.readiness)}>{pct(sel.readiness)}</TierBadge><span className="text-muted-foreground">{sel.attempts} réponses{sel.inactive > 7 ? ` · inactif depuis ${sel.inactive} j` : ''}</span></div>}
      </div>
    </div>
  )
}

function Groups() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="grid gap-4 sm:grid-cols-2">
        {BANDS.map(b => { const ls = COHORT.learners.filter(l => cohortBand(l) === b.id); return (
          <Card key={b.id} className="bg-muted/40"><CardHeader className="flex-row items-start justify-between space-y-0"><div><CardTitle className="text-base"><TierBadge tier={b.tier}>{b.fr}</TierBadge></CardTitle><CardDescription>{b.sub}</CardDescription></div><span className="num font-display text-2xl">{ls.length}</span></CardHeader>
            <CardContent><ul className="divide-y text-sm">{ls.length ? ls.map(l => <li key={l.name} className="flex items-center justify-between gap-2 py-1.5"><span className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent-soft-ink" aria-hidden="true">{l.initials}</span>{l.name}</span><span className="num text-muted-foreground">{pct(l.readiness)}{l.inactive > 7 ? ` · ${l.inactive} j` : ''}</span></li>) : <li className="py-1.5 text-muted-foreground">Personne pour l’instant.</li>}</ul>
              <Popover><PopoverTrigger asChild><Button variant="ghost" size="sm" className="mt-2 pl-0">Que faire ?</Button></PopoverTrigger><PopoverContent className="w-72 text-sm" side="top"><p className="font-medium">{b.fr}</p><p className="mt-1 text-muted-foreground">{b.id === 'accompany' ? 'Un message personnel et une mini-séance de 5 questions sur une tâche fragile.' : b.id === 'consolidate' ? 'Une séance ciblée sur leurs deux leviers communs.' : b.id === 'challenge' ? 'Des cas d’examen de niveau 3, puis le simulateur.' : 'Une question d’entretien par semaine ; ne pas sur-solliciter.'}</p></PopoverContent></Popover></CardContent></Card>) })}
      </div>
      <ChartDonutHalftone className="flex-wrap justify-center" title="Répartition" unit="apprenants" data={BANDS.map(b => ({ label: b.fr, value: COHORT.learners.filter(l => cohortBand(l) === b.id).length }))} />
    </div>
  )
}

function Heat() {
  // weeks = the 26 tasks grouped per domain is not a calendar: we map task index → week column, domain → row-ish block
  const values = Array.from({ length: 13 }, (_, w) => Array.from({ length: 7 }, (_, d) => { const t = COHORT_TASKS[(w * 2 + (d % 2)) % 26]; return d < 2 ? (t.tested ? t.avg : 0) : 0 }))
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Moyenne de la cohorte par tâche officielle. Vide : tâche jamais pratiquée par la cohorte. Détail au survol ou au clavier.</p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <ul className="grid gap-2 sm:grid-cols-2 text-sm">{DOMAINS.map(d => <li key={d.id} className="rounded-lg border p-3"><p className="mb-2 flex items-center justify-between font-medium">{d.fr}<span className="label">{Math.round(d.weight * 100)} %</span></p><ul className="flex flex-wrap gap-1">{COHORT_TASKS.filter(t => t.domain === d.id).map(t => <li key={t.id}><Popover><PopoverTrigger asChild><button type="button" className="num h-9 min-w-[44px] rounded-md px-2 text-xs ring-1 ring-border" style={{ background: t.tested ? `color-mix(in srgb, var(--tier-${t.avg < 0.5 ? 1 : t.avg < 0.75 ? 2 : 3}) ${25 + Math.round(t.avg * 55)}%, var(--surface))` : 'var(--surface-2)' }} aria-label={`${t.id} ${t.fr} : ${t.tested ? `${pct(t.avg)} en moyenne, ${t.fragile} fragiles sur ${t.tested}` : 'jamais pratiquée'}`}>{t.id}</button></PopoverTrigger><PopoverContent className="w-64 text-sm"><p className="font-medium">{t.id} · {t.fr}</p><p className="mt-1 text-muted-foreground">{t.tested ? `${pct(t.avg)} en moyenne · ${t.fragile} fragiles sur ${t.tested} testés` : 'Jamais pratiquée par la cohorte.'}</p></PopoverContent></Popover></li>)}</ul></li>)}</ul>
        <RadarChart data={DOMAINS.map(d => { const ts = COHORT_TASKS.filter(t => t.domain === d.id && t.tested); return { domaine: d.fr, cohorte: Math.round(ts.reduce((s, t) => s + t.avg, 0) / ts.length * 100), seuil: 80 } })} angleKey="domaine" valueKeys={['cohorte', 'seuil']} title="Par domaine" description="Moyenne de la cohorte et seuil visé." />
      </div>
      <HeatCalendar title="Activité de la cohorte · 13 dernières semaines" unit="réponses" weeks={13} maxCount={40} values={values} color="var(--accent)" />
    </div>
  )
}

function Quality() {
  const rows = FLAGS.map(f => ({ id: f.id, name: f.id, date: `${f.count} signalement${f.count > 1 ? 's' : ''}`, status: 'pending', amount: f.reason }))
  return (
    <div className="flex flex-col gap-3">
      <Table05 data={rows} className="w-full space-y-4" columns={[{ accessorKey: 'name', header: 'Question', cell: ({ row }) => <code className="text-xs">{row.getValue('name')}</code> }, { accessorKey: 'date', header: 'Signalements' }, { accessorKey: 'amount', header: 'Motif' }, { id: 'actions', header: '', cell: () => <div className="flex justify-end gap-1"><Button size="sm" variant="secondary">Garder</Button><Button size="sm" variant="outline">Quarantaine</Button></div> }]} searchPlaceholder="Rechercher une question…" />
      <p className="text-sm text-muted-foreground">Les questions signalées restent servies jusqu’à votre décision ; une question mise en quarantaine disparaît des séances.</p>
    </div>
  )
}

export function LearnerTable({ selectable }) {
  const rows = COHORT.learners.map((l, i) => ({ id: String(i), name: l.name, date: l.inactive === 0 ? 'aujourd’hui' : `il y a ${l.inactive} j`, status: cohortBand(l), amount: pct(l.readiness), attempts: l.attempts }))
  const BAND = { accompany: ['À accompagner', 1], consolidate: ['À consolider', 2], challenge: ['À challenger', 3], maintain: ['À maintenir', 4] }
  return <Table05 data={rows} pageSize={5} className="w-full space-y-4" searchPlaceholder="Rechercher un apprenant…" columns={[
    { accessorKey: 'name', header: 'Apprenant', cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
    { accessorKey: 'amount', header: 'Préparation', cell: ({ row }) => <span className="num">{row.getValue('amount')}</span> },
    { accessorKey: 'status', header: 'Groupe', cell: ({ row }) => <TierBadge tier={BAND[row.getValue('status')][1]}>{BAND[row.getValue('status')][0]}</TierBadge> },
    { accessorKey: 'date', header: 'Dernière activité' },
    { accessorKey: 'attempts', header: () => <div className="text-right">Réponses</div>, cell: ({ row }) => <div className="num text-right">{row.getValue('attempts')}</div> },
  ]} />
}
