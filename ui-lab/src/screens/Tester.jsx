import React, { useState } from 'react'
import { ArrowRight, HelpCircle, BookOpen, Compass } from 'lucide-react'
import { QUESTION, TASKS, MASTERY, DOMAINS } from '../data.js'
import { QuestionTool } from '@/components/21st/question-tool'
import { SegmentedControl } from '@/components/21st/segmented-control'
import { TreeView, TreeSection, TreeItem } from '@/components/21st/branching-tree-nav'
import CircularProgress from '@/components/21st/circular-progress'
import { toQuestion, Grading, LETTERS } from './Seance.jsx'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, PageHead, LightBadge, EmptyState, ErrorAlert, LoadingCard, pct } from './_shared.jsx'

export default function Tester({ state }) {
  const [focus, setFocus] = useState('BE4')
  const [dom, setDom] = useState('business')
  const [picked, setPicked] = useState(null)
  const task = TASKS.find(t => t.id === focus) || TASKS[21]
  const graded = state === 'Corrigée' || state === 'Signalée'
  const m = MASTERY.find(x => x.id === task.id)
  return (
    <div className="page">
      <PageHead kicker="Me tester" title="Pratique libre." />
      <div className="grid-main">
        <div className="flex flex-col gap-4">
          {state === 'Chargement' && <LoadingCard lines={5} />}
          {state === 'Erreur' && <ErrorAlert title="Connexion impossible" onRetry={() => {}}>Le serveur se réveille peut-être ; réessayez dans quelques secondes.</ErrorAlert>}
          {state === 'Aucune question' && <EmptyState className="max-w-none" icons={[HelpCircle, BookOpen, Compass]} title="Pas encore de question pour cette tâche" description={`La banque auditée ne couvre pas encore « ${task.fr} ». Vous pouvez l’étudier en mode Expliquer.`} action={{ label: 'L’étudier en mode Expliquer', onClick: () => { location.hash = 'expliquer' } }} />}
          {(state === 'Question' || graded) && <>
            <QuestionTool key={state} questions={[toQuestion(QUESTION, task)]} submitLabel="Valider" allowSkip={false} onSubmitAnswer={(a) => setPicked(LETTERS.indexOf(a.selectedIds?.[0]))} output={graded ? { answer: { kind: 'single', selectedIds: ['A'] } } : undefined} className="bg-card" />
            {graded && <Grading right={false} chosen={0} onFlag={() => {}} flagged={state === 'Signalée'} />}
            {graded && <div className="flex justify-end"><Button>Question suivante <ArrowRight className="ml-2 size-4" aria-hidden="true" /></Button></div>}
          </>}
        </div>
        <aside className="flex flex-col gap-4" aria-label="Sujet">
          <Card>
            <CardHeader><CardTitle className="text-base">Sujet</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <SegmentedControl label="Domaine" options={DOMAINS.map(d => ({ value: d.id, label: `${d.short} · ${Math.round(d.weight * 100)} %` }))} value={dom} onValueChange={setDom} />
              <TreeView selectedId={focus} onSelect={setFocus}>
                <TreeSection title={DOMAINS.find(d => d.id === dom).fr} defaultExpanded>
                  {TASKS.filter(t => t.domain === dom).map(t => { const mm = MASTERY.find(x => x.id === t.id); return <TreeItem key={t.id} id={t.id} label={`${t.id} · ${t.fr}`} badge={mm.attempts ? pct(mm.score) : '—'} /> })}
                </TreeSection>
              </TreeView>
            </CardContent>
          </Card>
          <Card className="bg-muted/40">
            <CardHeader><CardTitle className="text-base">Cette tâche</CardTitle><CardDescription>{task.id} · {task.fr}</CardDescription></CardHeader>
            <CardContent className="flex items-center gap-4">
              <CircularProgress value={Math.round(m.score * 100)} size={72} strokeWidth={7} showLabel renderLabel={(v) => m.attempts ? `${v} %` : '—'} className="stroke-muted" progressClassName={['stroke-tier-0', 'stroke-tier-1', 'stroke-tier-2', 'stroke-tier-3'][{ untested: 0, fragile: 1, progress: 2, solid: 3 }[m.light]]} labelClassName="text-sm font-medium" />
              <div className="flex flex-col gap-2"><LightBadge light={m.light} /><p className="text-sm text-muted-foreground">Les questions servies suivent votre niveau : fondations sous 50 %, consolidation sous 75 %, niveau examen au-delà.</p></div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
