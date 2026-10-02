import React, { useState } from 'react'
import { RefreshCw, Trash2, ArrowUp, ArrowDown, Sparkles, Search } from 'lucide-react'
import { BANK, COHORT, TASKS } from '../data.js'
import { QuestionTool } from '@/components/21st/question-tool'
import VerticalTitledStepper from '@/components/21st/vertical-stepper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, PageHead, EmptyState, Alert, AlertTitle, AlertDescription } from './_shared.jsx'

const DIFF = ['', 'Fondamental', 'Intermédiaire', 'Avancé']
export default function SeanceCiblee({ state }) {
  const items = state === 'Liste vide' ? [] : BANK.slice(0, 3)
  const [recip, setRecip] = useState(COHORT.learners.map(() => true))
  const panel = state === 'Banque' ? 'bank' : (state === 'Ma question' || state === 'Correction proposée') ? 'author' : null
  const n = recip.filter(Boolean).length
  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <PageHead kicker="Séance ciblée · cohorte PMP-2026-A" title="Composez votre séance."><p className="max-w-[36ch] text-sm text-muted-foreground">Vos apprenants recevront exactement ces questions, dans cet ordre.</p></PageHead>
      <div className="grid-main" style={{ '--aside-w': '320px' }}>
        <div className="flex flex-col gap-5">
          <div className="grid gap-1.5"><Label htmlFor="sc-title">Titre</Label><Input id="sc-title" defaultValue="Risques & obstacles — révision ciblée" /></div>
          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0"><CardTitle>{items.length} questions</CardTitle><div className="flex gap-2"><Button variant="secondary" size="sm" aria-pressed={panel === 'bank'}>Depuis la banque</Button><Button variant="secondary" size="sm" aria-pressed={panel === 'author'}>Ma question</Button></div></CardHeader>
            <CardContent>
              {items.length === 0 ? <EmptyState className="max-w-none" icons={[Search]} title="Toutes les questions ont été retirées" description="Ajoutez-en depuis la banque auditée ou créez la vôtre." /> : (
                <ol className="divide-y">{items.map((q, i) => <li key={q.id} className="flex items-start gap-3 py-3">
                  <div className="flex flex-col gap-0.5" aria-label="Réordonner"><Button variant="ghost" size="icon" className="size-8" aria-label={`Monter la question ${i + 1}`} disabled={i === 0}><ArrowUp className="size-4" aria-hidden="true" /></Button><Button variant="ghost" size="icon" className="size-8" aria-label={`Descendre la question ${i + 1}`} disabled={i === items.length - 1}><ArrowDown className="size-4" aria-hidden="true" /></Button></div>
                  <div className="min-w-0 flex-1"><p>{q.prompt}</p><p className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground"><Badge variant="outline" className="font-normal">{q.task} · {TASKS.find(t => t.id === q.task).fr}</Badge><span>{DIFF[q.difficulty]}</span></p>
                    {state === 'Suggestion ↻' && i === 1 && <Alert className="mt-3"><Sparkles className="size-4" aria-hidden="true" /><AlertTitle>Suggestion · même tâche, niveau proche</AlertTitle><AlertDescription>{BANK[1].prompt}<div className="mt-2 flex gap-2"><Button size="sm">Remplacer</Button><Button size="sm" variant="ghost">Garder l’actuelle</Button></div></AlertDescription></Alert>}
                  </div>
                  <div className="flex gap-0.5"><Button variant="ghost" size="icon" aria-label={`Suggérer un remplacement pour la question ${i + 1}`}><RefreshCw className="size-4" aria-hidden="true" /></Button><Button variant="ghost" size="icon" aria-label={`Retirer la question ${i + 1}`}><Trash2 className="size-4" aria-hidden="true" /></Button></div>
                </li>)}</ol>
              )}
            </CardContent>
          </Card>
          {panel === 'bank' && <Card><CardHeader><CardTitle>Banque auditée · 150 questions</CardTitle></CardHeader><CardContent>
            <div className="relative mb-3"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input className="pl-9" placeholder="Rechercher une question, une tâche…" aria-label="Rechercher dans la banque" /></div>
            <ul className="divide-y">{BANK.map(q => <li key={q.id} className="flex items-center justify-between gap-3 py-2 text-sm"><div><p>{q.prompt}</p><p className="text-muted-foreground">{q.task} · {DIFF[q.difficulty]}</p></div><Button size="sm" variant="secondary">Ajouter</Button></li>)}</ul></CardContent></Card>}
          {panel === 'author' && <Card><CardHeader><CardTitle>Ma question</CardTitle><CardDescription>Reste dans votre organisation. Jamais servie à une autre cohorte.</CardDescription></CardHeader><CardContent>
            <form className="flex flex-col gap-4" onSubmit={e => e.preventDefault()}>
              <div className="grid gap-1.5"><Label htmlFor="a-prompt">Énoncé</Label><textarea id="a-prompt" className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="Le comité de pilotage demande un reporting hebdomadaire alors que le plan prévoit un reporting mensuel. Que faites-vous ?" /></div>
              <QuestionTool questions={[{ kind: 'single', title: 'Réponses (cochez la bonne)', options: ['Refuser : le plan de communication fait foi.', 'Mettre à jour le plan de communication et informer les parties prenantes.', 'Produire le reporting hebdomadaire sans le formaliser.', 'Escalader au sponsor.'].map((o, i) => ({ id: 'ABCD'[i], label: `${'ABCD'[i]}. ${o}` })) }]} submitLabel="Marquer comme bonne réponse" allowSkip={false} className="bg-card" />
              <div className="grid gap-1.5"><Label htmlFor="a-expl">Explication</Label><textarea id="a-expl" className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="Un besoin de communication nouveau se traite dans le plan (PE8), pas en dehors." /></div>
              {state === 'Correction proposée' && <Alert><Sparkles className="size-4" aria-hidden="true" /><AlertTitle>Correction proposée · orthographe, vouvoiement, forme d’examen</AlertTitle><AlertDescription>« Le comité de pilotage demande désormais un reporting hebdomadaire, alors que le plan de communication prévoit un rythme mensuel. Quelle est l’action la plus appropriée ? »<div className="mt-2 flex gap-2"><Button size="sm">Appliquer</Button><Button size="sm" variant="ghost">Ignorer</Button></div></AlertDescription></Alert>}
              <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary"><Sparkles className="mr-2 size-4" aria-hidden="true" /> Corriger la formulation</Button><Button type="submit">Ajouter à la séance</Button></div>
              <p className="text-sm text-muted-foreground">La correction est une proposition de l’IA ; elle n’est jamais imposée.</p>
            </form></CardContent></Card>}
        </div>
        <aside className="flex flex-col gap-4" aria-label="Destinataires">
          <Card><CardHeader><CardTitle className="text-base"><h2>Étapes</h2></CardTitle></CardHeader><CardContent><VerticalTitledStepper steps={[{ title: 'Questions' }, { title: 'Destinataires' }, { title: 'Assigner' }]} value={items.length ? 2 : 1} panelClassName="hidden" /></CardContent></Card>
          <Card><CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-base">Destinataires · {n}</CardTitle><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => setRecip(recip.map(() => true))}>Tous</Button><Button variant="ghost" size="sm" onClick={() => setRecip(recip.map(() => false))}>Aucun</Button></div></CardHeader>
            <CardContent><ul className="flex flex-col gap-1">{COHORT.learners.map((l, i) => <li key={l.name} className="flex items-center gap-2 py-1"><Checkbox id={`r-${i}`} checked={recip[i]} onCheckedChange={() => setRecip(recip.map((v, j) => j === i ? !v : v))} /><Label htmlFor={`r-${i}`} className="font-normal">{l.name}</Label></li>)}</ul></CardContent></Card>
          <div className="flex flex-wrap gap-2"><Button disabled={!items.length || !n}>Assigner à {n} apprenant{n > 1 ? 's' : ''} ({items.length} questions)</Button><Button variant="ghost" asChild><a href="#cockpit">Annuler</a></Button></div>
        </aside>
      </div>
    </div>
  )
}
