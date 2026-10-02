import React from 'react'
import { Download, Quote, FileText, Compass, Gauge } from 'lucide-react'
import { readiness, MASTERY, LEVERS, LIGHT_LABEL, REFLEXES, TRAJECTORY, TOTAL_ATTEMPTS, DOMAINS } from '../data.js'
import { RadarChart } from '@/components/21st/radar-chart'
import { LineChart } from '@/components/21st/line-chart'
import HeatCalendar from '@/components/21st/heat-calendar'
import SkillsProgress from '@/components/21st/skills-progress'
import { StatsCard } from '@/components/21st/stats-card'
import { ScrollReveal } from '@/components/21st/scroll-reveal'
import { Hero115 } from '@/components/21st/hero-115'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, EmptyState, Skeleton, LoadingCard, TierBadge, LightBadge, pct } from './_shared.jsx'
import { PHOTO_SLOT } from './Acces.jsx'

const reveal = { variants: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }, transition: { duration: 0.4, ease: 'easeOut' }, viewOptions: { amount: 0.15 }, once: true }
// Activity field for the heat calendar: 12 weeks × 7 days, intensities 0..1 (Exemple)
const ACTIVITY = Array.from({ length: 12 }, (_, w) => Array.from({ length: 7 }, (_, d) => (d === 5 || d === 6) ? (w % 3 === 0 ? 0.2 : 0) : Math.min(1, Math.max(0, Math.sin((w * 7 + d) * 0.9) * 0.5 + 0.35 + w * 0.03))))

export default function Portrait({ state }) {
  const r = readiness()
  if (state === 'Chargement') return <div className="page flex flex-col gap-4" aria-busy="true"><p className="label">Mon portrait</p><Skeleton className="h-11 w-1/2" /><LoadingCard /><LoadingCard lines={6} /><p className="text-sm text-muted-foreground">Composition de votre portrait…</p></div>
  if (state === 'Vide') return <div className="page flex flex-col gap-6"><p className="label">Mon portrait</p><h1>Ce que vous avez construit, et ce qui vous attend.</h1><EmptyState className="max-w-none" icons={[FileText, Compass, Gauge]} title="Votre portrait prendra forme après vos premières réponses" description="Une séance de dix questions suffit pour une première lecture honnête." action={{ label: 'Faire ma première séance', onClick: () => { location.hash = 'seance' } }} /></div>
  const traj = state === 'Trajectoire courte' ? TRAJECTORY.slice(-2) : TRAJECTORY
  const acquired = MASTERY.filter(m => m.light === 'solid').length
  const DOM_PROGRESS = { people: ["**:data-[slot='progress-indicator']:bg-dom-people!", "**:data-[slot='progress']:bg-dom-people/20!"], process: ["**:data-[slot='progress-indicator']:bg-dom-process!", "**:data-[slot='progress']:bg-dom-process/20!"], business: ["**:data-[slot='progress-indicator']:bg-dom-be!", "**:data-[slot='progress']:bg-dom-be/20!"] }
  return (
    <div className="page" style={{ maxWidth: 980 }}>
      <article className="flex flex-col gap-10" aria-labelledby="h-portrait">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="label">Portrait d’apprentissage · édité le 2 oct. 2026 · ECO 2026</p><Button variant="secondary" size="sm"><Download className="mr-2 size-3.5" aria-hidden="true" /> Exporter (PDF)</Button></div>
          <h1 id="h-portrait" style={{ fontSize: 'var(--t-4xl)', maxWidth: '20ch' }}>Ce que vous avez construit, et ce qui vous attend.</h1>
          <p className="lead">Un document, pas un tableau de bord. Il est généré à partir de vos données ; elles vous appartiennent.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatsCard title="Préparation" value={pct(r.score)} icon={<TierBadge tier={r.label.tier} />} change={r.label.fr} changeType="positive" changeNote="" />
            <StatsCard title="Tâches acquises" value={`${acquired} / 26`} icon={<Compass className="size-4 text-muted-foreground" aria-hidden="true" />} change={`${MASTERY.filter(m => m.covered).length} pratiquées`} changeType="positive" changeNote="" />
            <StatsCard title="Réponses" value={String(TOTAL_ATTEMPTS)} icon={<Quote className="size-4 text-muted-foreground" aria-hidden="true" />} change={`${REFLEXES.length} réflexes`} changeType="positive" changeNote="gardés" />
          </div>
        </header>

        <ScrollReveal as="section" {...reveal}>
          <p className="label">01</p><h2 id="p1">Votre carte, et votre chemin critique</h2>
          <p className="mt-2 max-w-[62ch] text-muted-foreground">Les zones pâles ne sont pas des trous. Elles vous attendent. Votre carte n’est pas incomplète : elle est en cours.</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_minmax(0,380px)]">
            <Card><CardContent className="pt-6"><ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MASTERY.map(m => { const step = LEVERS.findIndex(l => l.id === m.id) + 1; return <li key={m.id} className={`rounded-md border-l-[3px] bg-muted/30 px-3 py-2 ${m.covered ? '' : 'border-dashed'}`} style={{ borderLeftColor: `var(--tier-${LIGHT_LABEL[m.light].tier})` }}><div className="flex items-center justify-between gap-2 text-xs"><span className="label">{m.id}</span>{step > 0 && <Badge variant="outline" className="font-normal">Étape {step}</Badge>}</div><p className="mt-1 text-sm">{m.fr}</p><p className="num text-xs text-muted-foreground">{m.attempts ? pct(m.score) : 'jamais pratiquée'}</p></li> })}
            </ul></CardContent></Card>
            <div className="[&_[data-slot=card]]:h-full"><RadarChart data={r.domains.map(d => ({ domaine: d.fr, vous: Math.round(d.score * 100), seuil: 80 }))} angleKey="domaine" valueKeys={['vous', 'seuil']} title="Face aux trois domaines" description="Votre réussite par domaine, et le seuil visé de 80 %." footer="Pondération ECO 2026 : 33 / 41 / 26" /></div>
          </div>
          <Card className="mt-4 bg-muted/40"><CardHeader><CardDescription className="label">Lecture</CardDescription></CardHeader><CardContent><p>Vous tenez le processus par ses deux bouts, <strong>le périmètre et l’échéancier</strong>, et la gouvernance est solide. Le milieu reste à construire : la valeur, la qualité, les obstacles. Quatre tâches n’ont jamais été pratiquées ; elles comptent zéro, et c’est pour cela que votre indicateur dit « en construction » plutôt que « presque prêt·e ».</p></CardContent></Card>
        </ScrollReveal>

        <ScrollReveal as="section" {...reveal}>
          <p className="label">02</p><h2 id="p2">Votre trajectoire, et la pente devant</h2>
          <div className="mt-4 grid-main" style={{ '--aside-w': '300px' }}>
            <LineChart data={traj.map(p => ({ semaine: p.day, préparation: Math.round(p.r * 100), seuil: 80 }))} xKey="semaine" yKeys={['préparation', 'seuil']} title="Préparation par semaine" description="Une mesure par semaine, uniquement les jours où vous avez répondu." showDots />
            <Card className="bg-foreground text-background"><CardHeader><CardDescription className="label text-background/70">À ce rythme</CardDescription>{traj.length >= 3 ? <><CardTitle className="font-display text-xl font-normal">Seuil de 80 % vers le 20 décembre.</CardTitle><CardDescription className="text-background/80">Projection linéaire sur vos sept dernières semaines ; votre examen est le 14 novembre. Deux séances par semaine au lieu d’une avancent la date d’environ trois semaines.</CardDescription></> : <><CardTitle className="font-display text-xl font-normal">Trop tôt pour une pente.</CardTitle><CardDescription className="text-background/80">Deux mesures seulement. La projection apparaît à partir de trois semaines de pratique.</CardDescription></>}</CardHeader></Card>
          </div>
          <div className="mt-4"><HeatCalendar title="Activité des douze dernières semaines" unit="réponses" weeks={12} maxCount={12} values={ACTIVITY} color="var(--accent)" /></div>
        </ScrollReveal>

        <ScrollReveal as="section" {...reveal}>
          <p className="label">03</p><h2 id="p3">Face à l’examen réel</h2>
          <p className="mt-2 text-muted-foreground">Pondération officielle ECO 2026 : Personnes 33 %, Processus 41 %, Environnement d’affaires 26 %. Seuil visé : 80 %.</p>
          <div className="mt-4"><SkillsProgress className="max-w-none" title="Réussite par domaine" subtitle="Une tâche jamais pratiquée compte 0" badge={<span>{pct(r.score)}</span>} stats={r.domains.map(d => ({ label: `${d.fr} · ${Math.round(d.weight * 100)} % · ${d.covered}/${d.tasks} pratiquées`, value: Math.round(d.score * 100), indicatorClass: DOM_PROGRESS[d.id][0], trackClass: DOM_PROGRESS[d.id][1] }))} /></div>
        </ScrollReveal>

        <ScrollReveal as="section" {...reveal}>
          <p className="label">04</p><h2 id="p4">Vos réflexes</h2>
          <p className="mt-2 text-muted-foreground">Ce que vous avez décidé de retenir, dans vos mots.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {REFLEXES.map((x, i) => <Card key={i} asChild={false}><CardContent className="flex gap-3 pt-6"><Quote className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><blockquote><p>{x.text}</p><footer className="mt-2 text-sm text-muted-foreground">{x.seatLabel} · {x.at}</footer></blockquote></CardContent></Card>)}
            <Card className="grid place-items-center border-dashed"><CardContent className="pt-6 text-center text-sm text-muted-foreground">Le prochain s’écrira à votre prochain « Cas réel ».</CardContent></Card>
          </div>
        </ScrollReveal>

        <section className="[&_section]:py-6" aria-label="Votre métier">
          <Hero115 icon={<Compass className="size-6" aria-hidden="true" />} heading="Le portrait mesure ce que vous reconnaissez. Vos livrables montreront ce que vous savez faire." description="Réussir l’examen et savoir diriger un projet : une seule vérité, la vôtre." button={{ text: 'Relier à mon projet', url: '#relier' }} trustText="Formation PMP-2026-A · atelier échéancier (Exemple)" imageSrc={PHOTO_SLOT.src} imageAlt={PHOTO_SLOT.alt} />
        </section>
        <footer className="border-t pt-4 text-sm text-muted-foreground">Certifizer · Document généré à partir de vos données, elles vous appartiennent · ECO PMP 2026 (PMI) · Les traductions FR des tâches sont celles de Certifizer, non officielles.</footer>
      </article>
    </div>
  )
}
