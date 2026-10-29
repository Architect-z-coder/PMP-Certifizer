import React from 'react'
import { ArrowRight, Lock } from 'lucide-react'
import { LEVERS, DOMAINS } from '../data.js'
import VerticalTitledStepper from '@/components/21st/vertical-stepper'
import { Progress } from '@/components/21st/progress'
import { Button, PageHead, LightBadge, Premium, Alert, AlertTitle, AlertDescription, pct } from './_shared.jsx'

const reason = (l, i) => {
  const d = DOMAINS.find(x => x.id === l.domain)
  if (l.attempts === 0) return i === 0 ? `Jamais pratiquée, dans un domaine à ${Math.round(d.weight * 100)} % de l’examen : c’est le levier le plus rentable aujourd’hui. Elle compte 0 tant que vous ne l’avez pas abordée.` : `Jamais pratiquée. La couverture compte autant que la réussite : une première séance la fait entrer dans votre indicateur.`
  if (l.score < 0.5) return `Fragile sur un domaine à ${Math.round(d.weight * 100)} % de l’examen. Deux séances suffisent souvent à passer le seuil de 50 %.`
  return 'En progression. Une révision d’entretien dans deux semaines pour consolider.'
}

export default function Chemin({ state, go }) {
  const free = state === 'Gratuit (2 + aperçu)'
  const active = state === 'Étape 1 en cours' ? 1 : 0
  const steps = LEVERS.map((l, i) => {
    const locked = free && i >= 2
    const content = (
      <div className="flex flex-col gap-3 text-left">
        <div className="flex flex-wrap items-center gap-2"><span className="label">{l.id} · semaine {i + 1}</span><LightBadge light={l.light} /></div>
        <p className="text-muted-foreground">{reason(l, i)}</p>
        <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{l.attempts ? `${pct(l.score)} de réussite · ${l.attempts} réponses` : 'Jamais pratiquée'}</span><span className="num">Levier : {(l.lever * 100).toFixed(1).replace('.', ',')}</span></div>
        <Progress value={l.score * 100} className="h-1.5" aria-label={`Réussite ${pct(l.score)}`} />
        {!locked && <div><Button variant={active === i + 1 ? 'default' : 'secondary'} asChild><a href="#tester">{active === i + 1 ? 'Continuer cette étape' : 'Commencer cette étape'} <ArrowRight className="ml-2 size-4" aria-hidden="true" /></a></Button></div>}
      </div>
    )
    return { title: `Étape ${i + 1} · ${l.fr}`, content: locked ? <Premium go={go} reason={`Étape ${i + 1} disponible en Premium`}>{content}</Premium> : content }
  })
  return (
    <div className="page" style={{ maxWidth: 880 }}>
      <PageHead kicker="Chemin critique" title="Quatre étapes, dans cet ordre." lead="Comme sur un projet, le chemin critique est la chaîne qui décide de la date. Ici : les tâches où chaque heure rapporte le plus de points, dans l’ordre où les travailler." />
      <div className="[&_nav]:items-stretch">
        <h2 className="sr-only">Vue d’ensemble des étapes</h2>
        <VerticalTitledStepper steps={steps} value={active || 1} panelClassName="hidden" />
      </div>
      <ol className="mt-2 flex flex-col gap-6" aria-label="Détail des étapes">{steps.map((s, i) => <li key={i} className="rounded-xl border bg-card p-5"><h2 className="mb-3 text-xl">{s.title}</h2>{s.content}</li>)}</ol>
      {free && <Alert className="mt-5"><Lock className="size-4" aria-hidden="true" /><AlertTitle>Les étapes 3 et 4 sont incluses en Premium.</AlertTitle><AlertDescription>Votre progression est la même dans les deux cas. <a className="underline" href="#premium">Voir Premium</a></AlertDescription></Alert>}
      <p className="mt-6 text-sm text-muted-foreground">Le levier combine le poids de la tâche à l’examen (hypothèse de conception Certifizer : poids égal entre les tâches d’un domaine) et ce qu’il vous reste à construire. Il se recalcule après chaque séance.</p>
    </div>
  )
}
