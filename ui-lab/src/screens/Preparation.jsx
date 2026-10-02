import React from 'react'
import { ArrowRight, RotateCcw, Target, Quote, RefreshCw, Sparkles, CalendarDays, Gauge, Compass, FileText, Info } from 'lucide-react'
import { readiness, LEVERS, MISSED, STALE, SESSION, ASSIGNED, REFLEXES, TASKS, LEARNER, MASTERY, TOTAL_ATTEMPTS, READINESS_TIERS } from '../data.js'
import CircularProgress from '@/components/21st/circular-progress'
import SkillsProgress from '@/components/21st/skills-progress'
import { StatsCard } from '@/components/21st/stats-card'
import { Accordion01 } from '@/components/21st/accordion'
import { ScrollReveal } from '@/components/21st/scroll-reveal'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/21st/popover'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/21st/carousel'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, TierBadge, DomainBadge, Premium, EmptyState, LoadingCard, Skeleton, pct } from './_shared.jsx'
import { PHOTO_SLOT } from './Acces.jsx'

const daysTo = (iso) => Math.max(0, Math.round((new Date(iso) - new Date('2026-10-02')) / 86400000))
const reveal = { variants: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }, transition: { duration: 0.4, ease: 'easeOut' }, viewOptions: { amount: 0.15 }, once: true }
const tierOfDomain = (s) => s < 0.5 ? 1 : s < 0.7 ? 2 : s < 0.85 ? 3 : 4
const DOM_PROGRESS = { people: ["**:data-[slot='progress-indicator']:bg-dom-people!", "**:data-[slot='progress']:bg-dom-people/20!"], process: ["**:data-[slot='progress-indicator']:bg-dom-process!", "**:data-[slot='progress']:bg-dom-process/20!"], business: ["**:data-[slot='progress-indicator']:bg-dom-be!", "**:data-[slot='progress']:bg-dom-be/20!"] }

export default function Preparation({ state, go }) {
  const r = readiness()
  if (state === 'Chargement') return <Loading />
  if (state === 'Première visite') return <FirstVisit />
  const premium = state === 'Premium'
  const assigned = state === 'Séance assignée'
  return (
    <div className="page flex flex-col gap-10">
      <section aria-labelledby="h-prepa">
        <p className="label mb-3">Ma préparation · {new Date('2026-10-02').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <div className="grid-main" style={{ '--aside-w': '340px' }}>
          <div className="flex flex-col gap-5">
            <h1 id="h-prepa" style={{ fontSize: 'var(--t-4xl)', maxWidth: '22ch' }}>Bonjour Nadia.<br />Où vous en êtes : <span className="whitespace-nowrap" style={{ color: `var(--tier-${r.label.tier})` }}>{r.label.fr.toLowerCase()}</span>.</h1>
            <p className="lead">La priorité du jour est <strong>{LEVERS[0].fr}</strong>. Une séance de {SESSION.size} questions, environ {SESSION.minutes} minutes, composée pour vous.</p>
            <div className="flex flex-wrap gap-2"><Button size="lg" asChild><a href="#seance">Lancer la séance du jour <ArrowRight className="ml-2 size-4" aria-hidden="true" /></a></Button><Button variant="secondary" size="lg" asChild><a href="#tester">Me tester librement</a></Button></div>
            <ul className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <li><TierBadge tier={1}>{SESSION.composition.weak} leviers prioritaires</TierBadge></li>
              <li><TierBadge tier={2}>{SESSION.composition.missed} à retravailler</TierBadge></li>
              <li><Badge variant="secondary" className="font-normal">{SESSION.composition.maintenance} entretien</Badge></li>
              <li>Apprentissage adaptatif de vos erreurs</li>
            </ul>
          </div>
          <ReadinessDial r={r} />
        </div>
      </section>

      {assigned && (
        <Card className="border-primary/40 bg-accent-soft/40" aria-label="Séance assignée">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div><p className="label"><Target className="mr-1 inline size-3 align-[-1px]" aria-hidden="true" /> Assignée par votre formateur</p><h2 className="mt-1 text-xl">{ASSIGNED[0].title}</h2><p className="mt-1 text-sm text-muted-foreground">{ASSIGNED[0].questions} questions · dans cet ordre exact</p></div>
            <Button asChild><a href="#seance">Commencer</a></Button>
          </CardContent>
        </Card>
      )}

      <ScrollReveal as="section" {...reveal}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 id="h-dom">Face à l’examen réel</h2><p className="mt-1 text-muted-foreground">Pondération officielle ECO 2026. Une tâche jamais pratiquée compte 0 : votre indicateur est bas quand votre couverture est basse, pas quand vous êtes mauvaise.</p></div></div>
        <div className="grid gap-4 md:grid-cols-3">
          {r.domains.map(d => (
            <StatsCard key={d.id} title={`${d.fr} · ${Math.round(d.weight * 100)} % de l’examen`} value={pct(d.score)} icon={<DomainBadge id={d.id} />} change={`${d.covered}/${d.tasks} tâches pratiquées`} changeType={d.covered === d.tasks ? 'positive' : 'negative'} changeNote={d.tasks - d.covered > 0 ? `· ${d.tasks - d.covered} jamais pratiquée${d.tasks - d.covered > 1 ? 's' : ''}` : '· couverture complète'} />
          ))}
        </div>
      </ScrollReveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScrollReveal {...reveal}>
          <SkillsProgress className="h-full max-w-none" title="Vos leviers prioritaires" subtitle="Réussite actuelle · 0 % = jamais pratiquée · classées par poids × reste à construire" badge={<span>{LEVERS.length} leviers</span>}
            stats={LEVERS.map(l => ({ label: `${l.id} · ${l.fr}`, value: Math.round(l.score * 100), indicatorClass: DOM_PROGRESS[l.domain][0], trackClass: DOM_PROGRESS[l.domain][1] }))} />
        </ScrollReveal>
        <ScrollReveal {...reveal}>
          <Card className="h-full">
            <CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>À retravailler</CardTitle><CardDescription>Vos questions manquées reviennent à 1, 3 puis 7 jours. Rien ne baisse avec le temps ; on vous les repropose, c’est tout.</CardDescription></div><Badge variant="secondary">{MISSED.filter(m => m.due === 'aujourd’hui').length} dues aujourd’hui</Badge></div></CardHeader>
            <CardContent>
              <Accordion01 className="w-full" type="single" items={MISSED.slice(0, 3).map(m => ({ id: m.id, title: <span className="text-left text-sm">{TASKS.find(t => t.id === m.task).fr} · <span className="text-muted-foreground">{m.due}</span></span>, content: <span>{m.fr} <span className="text-muted-foreground">(manquée {m.miss} fois)</span></span> }))} />
              <Button variant="secondary" className="mt-4" asChild><a href="#seance"><RotateCcw className="mr-2 size-4" aria-hidden="true" /> Rejouer mes questions manquées</a></Button>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>

      <section aria-labelledby="h-int">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 id="h-int">Fonctions intelligentes</h2><p className="mt-1 text-muted-foreground">{premium ? 'Débloquées avec votre plan.' : 'La couche qui vous guide vraiment, incluse en Premium. Votre progression est la même dans les deux cas.'}</p></div>{!premium && <Button variant="secondary" asChild><a href="#premium">Voir Premium</a></Button>}</div>
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard premium={premium} go={go} title="Séance adaptative complète" text="Composition 33 / 41 / 26, leviers, questions manquées, entretien." />
          <FeatureCard premium={premium} go={go} title="Chemin critique complet" text="Les 4 étapes, pas seulement les 2 premières." />
          <FeatureCard premium={premium} go={go} title="Simulateur d’examen" text="180 questions · 240 minutes · au format réel." soon />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle>Vos réflexes</CardTitle><a className="text-sm underline-offset-2 hover:underline" href="#casreel">Depuis « Cas réel »</a></CardHeader>
          <CardContent>
            <div className="px-12"><Carousel><CarouselContent>{REFLEXES.map((x, i) => <CarouselItem key={i}><div className="flex gap-3"><Quote className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div><p>{x.text}</p><p className="mt-2 text-sm text-muted-foreground">{x.seatLabel} · {x.at}</p></div></div></CarouselItem>)}</CarouselContent><CarouselPrevious /><CarouselNext /></Carousel></div>
          </CardContent>
        </Card>
        <Card className="bg-muted/40">
          <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle>Entretien</CardTitle><RefreshCw className="size-4 text-muted-foreground" aria-hidden="true" /></CardHeader>
          <CardContent><p className="text-sm">Deux tâches solides n’ont pas été pratiquées depuis plus de 21 jours. Votre score ne baisse pas pour autant ; une question d’entretien est glissée dans la séance du jour.</p><ul className="mt-3 flex flex-wrap gap-2">{STALE.map(s => <li key={s.id}><Badge variant="outline" className="font-normal">{s.fr}</Badge></li>)}</ul></CardContent>
        </Card>
      </div>

      <ScrollReveal as="section" {...reveal}>
        <div className="grid items-center gap-6 lg:grid-cols-2">
          <figure><img src={PHOTO_SLOT.src} alt={PHOTO_SLOT.alt} className="w-full rounded-xl border object-cover" /><figcaption className="mt-2 text-sm text-muted-foreground">Formation PMP-2026-A · atelier échéancier (Exemple)</figcaption></figure>
          <div><h2>Deux objectifs, une seule vérité.</h2><p className="mt-2 text-muted-foreground">Réussir l’examen et savoir diriger un projet. Votre portrait mesure ce que vous reconnaissez aujourd’hui ; vos livrables, dans « Relier à mon projet », montreront ce que vous savez faire.</p><Button variant="ghost" className="mt-3 pl-0" asChild><a href="#portrait">Lire mon portrait <ArrowRight className="ml-2 size-4" aria-hidden="true" /></a></Button></div>
        </div>
      </ScrollReveal>
    </div>
  )
}

function FeatureCard({ premium, title, text, soon, go }) {
  const body = <Card className="h-full"><CardHeader><div className="flex items-center justify-between"><Sparkles className="size-4 text-primary" aria-hidden="true" />{soon && <Badge variant="outline" className="font-normal">Bientôt</Badge>}</div><CardTitle className="text-lg">{title}</CardTitle><CardDescription>{text}</CardDescription></CardHeader></Card>
  return premium ? body : <Premium go={go} reason="Inclus dans Premium">{body}</Premium>
}

export function ReadinessDial({ r }) {
  const tier = r.label.tier
  const ring = ['stroke-tier-0', 'stroke-tier-1', 'stroke-tier-2', 'stroke-tier-3', 'stroke-tier-4'][tier]
  return (
    <Card>
      <CardContent className="grid grid-cols-[auto_1fr] items-center gap-4 pt-6">
        <div role="img" aria-label={`Indicateur de préparation Certifizer : ${pct(r.score)}, ${r.label.fr}`}>
          <CircularProgress value={Math.round(r.score * 100)} size={132} strokeWidth={10} showLabel renderLabel={(v) => <span className="num font-display text-3xl">{v}<span className="ml-0.5 text-xs text-muted-foreground">/100</span></span>} className="stroke-muted" progressClassName={ring} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1"><TierBadge tier={tier} />
            <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label="Comment lire les paliers"><Info className="size-4" aria-hidden="true" /></Button></PopoverTrigger>
              <PopoverContent className="w-72 text-sm" side="bottom"><p className="font-medium">Paliers de préparation</p><ul className="mt-2 space-y-1">{READINESS_TIERS.map(t => <li key={t.code} className="flex items-center justify-between gap-2"><TierBadge tier={t.tier} /><span className="num text-muted-foreground">≥ {Math.round(t.min * 100)} %</span></li>)}</ul><p className="mt-2 text-muted-foreground">Exactement les seuils du calcul Certifizer.</p></PopoverContent></Popover>
          </div>
          <p className="text-sm text-muted-foreground">Un miroir, pas une promesse : il reflète {TOTAL_ATTEMPTS} réponses sur {MASTERY.filter(m => m.covered).length} tâches sur 26.</p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-3.5" aria-hidden="true" /> Examen dans {daysTo(LEARNER.examDate)} jours</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Loading() {
  return (
    <div className="page flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <p className="label">Ma préparation</p>
      <Skeleton className="h-11 w-3/5" /><Skeleton className="h-5 w-4/5" /><div className="flex gap-3"><Skeleton className="h-12 w-60" /><Skeleton className="h-12 w-40" /></div>
      <div className="mt-6 grid gap-4 md:grid-cols-3"><LoadingCard /><LoadingCard /><LoadingCard /></div>
      <p className="text-sm text-muted-foreground">Chargement de votre préparation…</p>
    </div>
  )
}

function FirstVisit() {
  return (
    <div className="page flex flex-col gap-10">
      <p className="label">Ma préparation · première visite</p>
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <h1 style={{ fontSize: 'var(--t-4xl)', maxWidth: '18ch' }}>Bonjour Nadia. Commençons par une mesure honnête.</h1>
          <p className="lead">Dix questions, environ quinze minutes, réparties selon le poids réel de l’examen (33 / 41 / 26). Votre portrait apparaîtra après vos premières réponses, et il dira la vérité dès le départ : une tâche jamais pratiquée compte zéro.</p>
          <div className="flex flex-wrap gap-2"><Button size="lg" asChild><a href="#seance">Faire ma première séance <ArrowRight className="ml-2 size-4" aria-hidden="true" /></a></Button><Button variant="ghost" asChild><a href="#parcours">Voir le parcours ECO 2026 d’abord</a></Button></div>
          <p className="text-sm text-muted-foreground">Vous pouvez quitter une séance à tout moment. Vos réponses sont gardées.</p>
        </div>
        <img src={PHOTO_SLOT.src} alt={PHOTO_SLOT.alt} className="w-full rounded-xl border object-cover" />
      </div>
      <EmptyState className="max-w-none" title="Votre portrait prendra forme ici" description="Après vos premières réponses : préparation par domaine, leviers prioritaires et questions à retravailler." icons={[Gauge, Compass, FileText]} />
    </div>
  )
}
