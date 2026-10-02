import React, { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { DOMAINS, MASTERY, LIGHT_LABEL } from '../data.js'
import { TreeView, TreeSection, TreeItem } from '@/components/21st/branching-tree-nav'
import AnimatedTabs from '@/components/21st/animated-tabs'
import { Progress } from '@/components/21st/progress'
import Timeline from '@/components/21st/process-timeline'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, PageHead, LightBadge, DomainBadge, pct } from './_shared.jsx'

const BAR = { 0: "**:data-[slot='progress-indicator']:bg-tier-0", 1: "**:data-[slot='progress-indicator']:bg-tier-1", 2: "**:data-[slot='progress-indicator']:bg-tier-2", 3: "**:data-[slot='progress-indicator']:bg-tier-3" }

export default function Parcours({ state }) {
  const [dom, setDom] = useState('business')
  const [sel, setSel] = useState('BE4')
  const view = state === 'Domaines' ? 'domains' : state === 'Tâches du domaine' ? 'tasks' : 'detail'
  const t = MASTERY.find(m => m.id === sel)
  return (
    <div className="page">
      <PageHead kicker="Parcours ECO 2026" title="Trois domaines, vingt-six tâches."><p className="max-w-[40ch] text-sm text-muted-foreground">Référentiel officiel PMI en vigueur depuis le 9 juillet 2026. Titres EN officiels ; traductions FR Certifizer.</p></PageHead>
      {view === 'domains' ? (<>
        <h2 className="sr-only">Les trois domaines</h2>
        <Timeline className="px-1" steps={DOMAINS.map(d => { const ts = MASTERY.filter(m => m.domain === d.id); const cov = ts.filter(m => m.covered).length; return { title: `${d.fr} · ${Math.round(d.weight * 100)} % de l’examen`, completed: cov === ts.length, description: (
          <span className="block text-base"><span className="text-muted-foreground">{d.en} · {d.tasks} tâches · {cov} pratiquées</span>
            <span className="mt-3 flex gap-1" aria-hidden="true">{ts.map(m => <span key={m.id} className={`h-2 flex-1 rounded-sm bg-tier-${LIGHT_LABEL[m.light].tier}`} />)}</span>
            <Button variant="ghost" size="sm" className="mt-3 pl-0" onClick={() => setDom(d.id)}>Ouvrir les tâches <ArrowRight className="ml-1 size-3.5" aria-hidden="true" /></Button></span>) } })} /></>
      ) : (
        <div className="grid-main" data-left="" style={{ '--aside-w': 'minmax(0, 360px)' }}>
          <div className="flex flex-col gap-3">
            <AnimatedTabs variant="segment" className="w-full" layoutId="parcours-dom" activeTab={dom} onChange={(d) => { setDom(d); setSel(MASTERY.find(m => m.domain === d).id) }} tabs={DOMAINS.map(d => ({ id: d.id, label: d.short }))} />
            <Card className="py-2"><TreeView selectedId={sel} onSelect={setSel}>
              <TreeSection title={`${DOMAINS.find(d => d.id === dom).fr} · ${MASTERY.filter(m => m.domain === dom).length} tâches`} defaultExpanded>
                {MASTERY.filter(m => m.domain === dom).map(m => <TreeItem key={m.id} id={m.id} label={`${m.id} · ${m.fr}`} badge={m.attempts ? pct(m.score) : '—'} />)}
              </TreeSection>
            </TreeView></Card>
          </div>
          <Card aria-live="polite">
            <CardHeader><div className="flex items-center justify-between gap-3"><LightBadge light={t.light} /><span className="label">{t.id} · {t.enablers} facilitateurs</span></div><CardTitle className="text-2xl">{t.fr}</CardTitle><CardDescription>{t.en}</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div><div className="flex items-center justify-between text-sm"><span>Votre réussite sur cette tâche</span><span className="num">{t.attempts ? `${pct(t.score)} · ${t.attempts} réponses` : 'jamais pratiquée'}</span></div><Progress className={`mt-2 ${BAR[LIGHT_LABEL[t.light].tier]}`} value={t.score * 100} aria-label={`Réussite ${pct(t.score)}`} /></div>
              <div className="flex items-center gap-2"><DomainBadge id={t.domain} /><Badge variant="secondary" className="font-normal">Poids à l’examen : {(t.weight * 100).toFixed(1).replace('.', ',')} % (hypothèse Certifizer)</Badge></div>
              <p className="text-sm text-muted-foreground">Les questions de cette tâche sont rattachées à un facilitateur officiel précis. Une question « rattachement approximatif » ne prouve pas la couverture de la tâche et pèse moins dans votre maîtrise.</p>
              <div className="flex flex-wrap gap-2"><Button asChild><a href="#tester">Réviser cette tâche <ArrowRight className="ml-2 size-4" aria-hidden="true" /></a></Button><Button variant="secondary" asChild><a href="#expliquer">L’expliquer</a></Button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
