import React, { useState } from 'react'
import { X, Check, ArrowRight, Flag, AlertTriangle } from 'lucide-react'
import { QUESTION, TASKS, SESSION } from '../data.js'
import { QuestionTool } from '@/components/21st/question-tool'
import { Progress } from '@/components/21st/progress'
import { Drawer, DrawerContent, DrawerClose } from '@/components/21st/drawer'
import ChartDonutHalftone from '@/components/21st/donut-halftone'
import CircularProgress from '@/components/21st/circular-progress'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Alert, AlertTitle, AlertDescription, TierBadge, pct } from './_shared.jsx'

export const LETTERS = ['A', 'B', 'C', 'D']
export const toQuestion = (q, task) => ({ kind: 'single', title: q.prompt, description: `${task.id} · ${task.fr} · niveau ${q.difficulty} · ${q.type === 'scenario' ? 'scénario' : 'connaissance'}`, options: q.options.map((o, i) => ({ id: LETTERS[i], label: `${LETTERS[i]}. ${o}` })) })

export function Grading({ right, chosen, onFlag, flagged }) {
  return (
    <Alert variant={right ? 'default' : 'destructive'} className={right ? 'border-tier-3/40' : ''} aria-live="polite">
      {right ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
      <AlertTitle>{right ? 'Juste.' : `Pas cette fois. Vous aviez choisi ${LETTERS[chosen]} ; la bonne réponse est ${LETTERS[QUESTION.answer]}.`}</AlertTitle>
      <AlertDescription>
        <p className="text-foreground">{QUESTION.rationale}</p>
        {!right && <p className="mt-2 text-muted-foreground">Cette question reviendra dans 1 jour, puis 3, puis 7. Apprentissage adaptatif de vos erreurs.</p>}
        {onFlag && <Button variant="ghost" size="sm" className="mt-2" onClick={onFlag} aria-pressed={flagged} disabled={flagged}><Flag className="mr-1 size-3.5" aria-hidden="true" /> {flagged ? 'Signalée, merci' : 'Signaler cette question'}</Button>}
      </AlertDescription>
    </Alert>
  )
}

export default function Seance({ state }) {
  const [picked, setPicked] = useState(null)
  const task = TASKS.find(t => t.id === QUESTION.task)
  const graded = state === 'Réponse juste' || state === 'Réponse fausse'
  const chosen = state === 'Réponse juste' ? QUESTION.answer : state === 'Réponse fausse' ? 0 : picked
  const n = 4
  if (state === 'Fin de séance') return <End />
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="page flex items-center gap-4 !py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-sm"><span className="font-medium">Séance du jour</span><span className="num text-muted-foreground">Question {n} sur {SESSION.size}</span></div>
            <Progress className="mt-2 h-1.5" value={(n / SESSION.size) * 100} aria-label="Progression de la séance" />
          </div>
          <Button variant="ghost" size="icon" asChild><a href="#preparation" aria-label="Quitter la séance"><X className="size-5" aria-hidden="true" /></a></Button>
        </div>
      </header>
      <div className="page flex flex-col gap-6" style={{ maxWidth: 760 }}>
        <h1 className="sr-only">Séance du jour, question {n}</h1>
        <QuestionTool key={state} questions={[toQuestion(QUESTION, task)]} submitLabel="Valider" allowSkip={false} onSubmitAnswer={(a) => setPicked(LETTERS.indexOf(a.selectedIds?.[0]))} output={graded ? { answer: { kind: 'single', selectedIds: [LETTERS[chosen]] } } : undefined} className="bg-card" />
        {state === 'Erreur réseau' && <Alert variant="destructive"><AlertTriangle className="size-4" aria-hidden="true" /><AlertTitle>Connexion impossible</AlertTitle><AlertDescription>Votre réponse n’a pas été enregistrée ; le serveur se réveille peut-être. Choisissez à nouveau une réponse.</AlertDescription></Alert>}
        {graded && <Grading right={state === 'Réponse juste'} chosen={chosen} onFlag={() => {}} />}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Vous pouvez quitter à tout moment, vos réponses sont gardées.</span>
          {graded && <Button asChild><a href="#seance">Continuer <ArrowRight className="ml-2 size-4" aria-hidden="true" /></a></Button>}
        </div>
      </div>
      <Drawer side="bottom" open={state === 'Quitter ?'} onOpenChange={() => {}}>
        <DrawerContent title="Quitter la séance ?" description={`Vous avez répondu à ${n - 1} questions sur ${SESSION.size}. Elles sont enregistrées. Vous pourrez reprendre cette séance depuis Ma préparation.`}>
          <div className="flex flex-wrap gap-2"><Button variant="secondary" asChild><a href="#preparation">Quitter</a></Button><DrawerClose asChild><Button onClick={() => { location.hash = 'seance' }}>Continuer la séance</Button></DrawerClose></div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function End() {
  const correct = 7, total = SESSION.size, score = correct / total
  const tier = score >= 0.7 ? 3 : score >= 0.5 ? 2 : 1
  return (
    <div className="page flex min-h-dvh flex-col gap-6" style={{ maxWidth: 880 }}>
      <p className="label">Séance terminée</p>
      <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
        <div role="img" aria-label={`${correct} bonnes réponses sur ${total}`}><CircularProgress value={Math.round(score * 100)} size={132} strokeWidth={10} showLabel renderLabel={() => <span className="num font-display text-3xl">{correct}/{total}</span>} className="stroke-muted" progressClassName={['', 'stroke-tier-1', 'stroke-tier-2', 'stroke-tier-3'][tier]} /></div>
        <div><h1 style={{ fontSize: 'var(--t-4xl)' }}>Sept bonnes réponses sur dix.</h1><p className="lead mt-2">Votre indicateur de préparation passe de 44 % à 49 %. Deux tâches ont été pratiquées pour la première fois : elles comptent désormais dans votre couverture.</p></div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Ce que cette séance a changé</CardTitle></CardHeader><CardContent><ul className="divide-y text-sm">
          {[['Lever les obstacles et gérer les problèmes (BE4)', '33 % → 46 %'], ['Favoriser une livraison fondée sur la valeur (PR3)', '41 % → 52 %'], ['Aligner les attentes des parties prenantes (PE5)', 'jamais pratiquée → 50 %'], ['3 questions manquées', 'reviennent demain']].map(([a, b]) => <li key={a} className="flex items-center justify-between gap-3 py-2"><span>{a}</span><span className="num text-muted-foreground">{b}</span></li>)}
        </ul></CardContent></Card>
        <Card><CardHeader><CardTitle>Composition de la séance</CardTitle><CardDescription>Par domaine ECO (33 / 41 / 26) et par origine.</CardDescription></CardHeader><CardContent className="flex justify-center"><ChartDonutHalftone className="flex-wrap justify-center" title="Questions par origine" unit="questions" data={[{ label: 'Leviers', value: SESSION.composition.weak }, { label: 'Manquées', value: SESSION.composition.missed }, { label: 'Pondérées', value: SESSION.composition.weighted }, { label: 'Entretien', value: SESSION.composition.maintenance }]} /></CardContent></Card>
      </div>
      <div className="flex flex-wrap gap-2"><Button asChild><a href="#preparation">Retour à ma préparation</a></Button><Button variant="secondary" asChild><a href="#seance">Nouvelle séance</a></Button></div>
    </div>
  )
}
