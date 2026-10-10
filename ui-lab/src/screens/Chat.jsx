import React, { useState } from 'react'
import { Check, Plus, FileText, RotateCcw, Quote, AlertTriangle } from 'lucide-react'
import { TASKS, REFLEXES, DELIVERABLES, EVIDENCE_STATES } from '../data.js'
import { MODES, SEATS, CONVO } from '../content-chat.js'
import PromptInput from '@/components/21st/prompt-input'
import AnimatedTabs from '@/components/21st/animated-tabs'
import { QuestionTool } from '@/components/21st/question-tool'
import Timeline from '@/components/21st/process-timeline'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, PageHead, EmptyState, Skeleton, Alert, AlertTitle, AlertDescription } from './_shared.jsx'

const TITLES = { expliquer: 'Posez votre question, obtenez la tâche ECO qui va avec.', scenario: 'Un cas au format de l’examen, puis la correction raisonnée.', relier: 'Votre projet, vos livrables.', casreel: 'Une situation vécue, lue depuis un siège.' }

export default function Chat({ route, state }) {
  const mode = route.hash
  const M = MODES[mode]
  const Icon = M.icon
  const [seat, setSeat] = useState('moa')
  const [topic, setTopic] = useState('BE4')
  const [status, setStatus] = useState('ready')
  const empty = state === 'Vide' || state === 'Sans projet' || state === 'Choisir un siège'
  const loading = state === 'Réflexion…' || status === 'streaming'
  const error = state === 'Erreur'
  const msgs = empty ? [] : CONVO[mode]
  const savedReflex = state === 'Réflexe sauvé'
  return (
    <div className="page">
      <PageHead kicker={M.title} title={TITLES[mode]} lead={M.lead} />
      <div className="grid-main">
        <section className="flex flex-col gap-4" aria-label="Conversation">
          {empty && <EmptyState className="max-w-none" icons={[Icon]} title={mode === 'casreel' ? 'Choisissez un siège, puis décrivez votre cas' : mode === 'relier' ? 'Décrivez votre projet dans le panneau de droite' : 'Choisissez un sujet, puis posez votre question'} description={`Par exemple : « ${M.starter} »`} />}
          <ol className="flex flex-col gap-3">
            {msgs.map(([who, t], i) => (
              <li key={i} className={who === 'user' ? 'ml-auto max-w-[85%] rounded-xl bg-accent-soft px-4 py-3 text-accent-soft-ink' : 'max-w-[92%] rounded-xl border bg-card px-4 py-3'}>
                {who === 'ai' && <p className="label mb-1">Co-penseur · IA</p>}
                <p className="whitespace-pre-wrap">{t}</p>
                {who === 'ai' && mode === 'casreel' && (state === 'Réflexe proposé' || savedReflex) && <div className="mt-3"><Button size="sm" variant={savedReflex ? 'secondary' : 'default'} disabled={savedReflex}>{savedReflex ? <><Check className="mr-1 size-3.5" aria-hidden="true" /> Sauvé dans mes réflexes</> : <><Plus className="mr-1 size-3.5" aria-hidden="true" /> Garder ce réflexe</>}</Button></div>}
                {who === 'ai' && mode === 'relier' && state === 'Livrable en cours' && <div className="mt-3"><Button size="sm"><FileText className="mr-1 size-3.5" aria-hidden="true" /> Rédiger la charte de projet</Button></div>}
              </li>
            ))}
            {loading && <li className="max-w-[92%] rounded-xl border bg-card px-4 py-3" aria-live="polite" aria-busy="true"><p className="label mb-2">Co-penseur · IA</p><Skeleton className="h-3 w-4/5" /><Skeleton className="mt-2 h-3 w-3/5" /><p className="sr-only">Réflexion en cours</p></li>}
          </ol>
          {error && <Alert variant="destructive"><AlertTriangle className="size-4" aria-hidden="true" /><AlertTitle>Connexion impossible</AlertTitle><AlertDescription>Votre message est conservé dans le champ ci-dessous ; réessayez.</AlertDescription></Alert>}
          <div className="sticky bottom-[calc(64px+12px)] lg:bottom-3">
            <PromptInput status={loading ? 'streaming' : 'ready'} placeholder={mode === 'casreel' ? 'Décrivez votre situation réelle : contexte, contrainte, décision en jeu…' : 'Posez votre question…'} label="Votre message" defaultValue={error ? 'Quelle est la différence entre un risque et un obstacle ?' : ''} onSubmit={() => setStatus('streaming')} onStop={() => setStatus('ready')} actions={msgs.length > 0 ? <Button type="button" variant="ghost" size="sm"><RotateCcw className="mr-1 size-3.5" aria-hidden="true" /> Recommencer</Button> : null} />
          </div>
          <p className="text-sm text-muted-foreground">Les réponses sont générées par une IA à partir de l’ECO 2026 et du PMBOK. Elles peuvent se tromper ; votre formateur reste le juge.</p>
        </section>
        <aside className="flex flex-col gap-4" aria-label="Contexte">
          {mode === 'casreel' && <>
            <QuestionTool questions={[{ kind: 'single', title: 'Depuis quel siège ?', description: 'Changer de siège recommence la conversation.', options: SEATS.map(s => ({ id: s.value, label: s.label, description: s.hint })) }]} submitLabel="Choisir ce siège" allowSkip={false} onSubmitAnswer={(a) => setSeat(a.selectedIds?.[0] || seat)} className="bg-card" />
            <Card><CardHeader><CardTitle className="text-base">Mes réflexes · {REFLEXES.length}</CardTitle></CardHeader><CardContent><ul className="space-y-3">{REFLEXES.map((r, i) => <li key={i} className="flex gap-2"><Quote className="mt-1 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /><div><p className="text-sm">{r.text}</p><p className="mt-1 text-xs text-muted-foreground">{r.seatLabel} · {r.at}</p></div></li>)}</ul></CardContent></Card>
          </>}
          {mode === 'relier' && <>
            <Card><CardHeader><CardTitle className="text-base"><label htmlFor="proj">Mon projet</label></CardTitle></CardHeader><CardContent>
              <textarea id="proj" className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ex. : réhabilitation d’une station de pompage, équipe de 8, 14 mois, maître d’ouvrage public…" defaultValue={state === 'Sans projet' ? '' : 'Réhabilitation d’une station de pompage, équipe de 8, 14 mois, maître d’ouvrage public.'} />
              <p className="mt-2 text-sm text-muted-foreground">Partagé avec « Cas réel ». Ne collez pas de document confidentiel : ce texte est envoyé à l’IA.</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Mes livrables</CardTitle><CardDescription>Proposition · le produit ne les enregistre pas encore. Carte de preuves, pas barre de progression : Découvert → Compris → Appliqué → Validé → Retenu → Transféré.</CardDescription></CardHeader><CardContent>
              <Timeline className="px-1" steps={DELIVERABLES.map(d => ({ title: d.fr, completed: d.state === 'applique' || d.state === 'valide', description: <span className="text-sm"><Badge variant="outline" className="mr-2 font-normal">{EVIDENCE_STATES.find(([k]) => k === d.state)[1]}</Badge>{TASKS.find(t => t.id === d.task).id} · {d.hint}</span> }))} /></CardContent></Card>
          </>}
          {(mode === 'expliquer' || mode === 'scenario') && <Card><CardHeader><CardTitle className="text-base">Sujet</CardTitle></CardHeader><CardContent>
            <AnimatedTabs variant="segment" className="w-full" layoutId={`topic-${mode}`} activeTab={topic} onChange={setTopic} tabs={['BE4', 'BE5', 'PE5', 'PR3'].map(id => ({ id, label: id }))} />
            <p className="mt-3 text-sm">{TASKS.find(x => x.id === topic).fr}</p>
            <a href="#parcours" className="mt-3 inline-block text-sm underline-offset-2 hover:underline">Tous les sujets dans le parcours ECO</a></CardContent></Card>}
        </aside>
      </div>
    </div>
  )
}
