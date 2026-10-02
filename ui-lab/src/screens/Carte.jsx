import React, { useMemo, useRef, useState } from 'react'
import { Route, Presentation, Lock, ZoomIn } from 'lucide-react'
import { DOMAINS, THEMES, MASTERY, LEVERS, lightOf, LIGHT_LABEL, readiness } from '../data.js'
import { KnowledgeGraph } from '@/components/21st/knowledge-graph'
import { TreeView, TreeSection, TreeFolder, TreeItem } from '@/components/21st/branching-tree-nav'
import { SegmentedControl } from '@/components/21st/segmented-control'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/21st/popover'
import { Progress } from '@/components/21st/progress'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, PageHead, LightBadge, Premium, Alert, AlertTitle, AlertDescription, pct, TierBadge } from './_shared.jsx'

const DOM_COLOR = { people: 'var(--dom-people)', process: 'var(--dom-process)', business: 'var(--dom-be)' }
const LIGHT_COLOR = { untested: 'var(--tier-0)', fragile: 'var(--tier-1)', progress: 'var(--tier-2)', solid: 'var(--tier-3)' }
const avg = (ids) => { const t = ids.map(id => MASTERY.find(x => x.id === id)).filter(x => x.covered); return t.length ? t.reduce((s, x) => s + x.score, 0) / t.length : 0 }
const attempts = (ids) => ids.reduce((s, id) => s + MASTERY.find(x => x.id === id).attempts, 0)

function graphData(dens, pathIds, focus) {
  const nodes = [{ id: 'root', label: 'PMP', type: 'Examen', size: 26, color: 'var(--ink)' }]
  const links = []
  DOMAINS.forEach(d => {
    nodes.push({ id: d.id, label: d.fr, type: 'Domaine', size: 20, color: DOM_COLOR[d.id] })
    links.push({ source: 'root', target: d.id, label: `${Math.round(d.weight * 100)} %` })
    const items = (dens === 13 ? THEMES : MASTERY).filter(i => i.domain === d.id)
    items.forEach(c => {
      const score = dens === 13 ? avg(c.tasks) : c.score, att = dens === 13 ? attempts(c.tasks) : c.attempts
      const light = lightOf(score, att)
      const onPath = pathIds.includes(c.id)
      nodes.push({ id: c.id, label: `${c.fr}${att ? ` · ${pct(score)}` : ''}`, type: LIGHT_LABEL[light].fr, size: onPath ? 14 : 10, color: focus && !onPath ? 'var(--line-strong)' : LIGHT_COLOR[light], data: { score, att } })
      links.push({ source: d.id, target: c.id, strength: onPath ? 1 : 0.6 })
    })
  })
  return { nodes, links }
}

export default function Carte({ state, go }) {
  const free = state === 'Gratuit (26 verrouillé)'
  const [dens, setDens] = useState(state === 'Arbre · 26 tâches' ? 26 : 13)
  const [sel, setSel] = useState(state === 'Sujet sélectionné' ? 't11' : null)
  const [view, setView] = useState('arbre')
  const focus = state === 'Chemin critique' || state === 'Présentation'
  const present = state === 'Présentation'
  const graphRef = useRef(null)
  const r = readiness()
  const pathIds = LEVERS.map(l => dens === 13 ? THEMES.find(t => t.tasks.includes(l.id))?.id : l.id).filter(Boolean)
  const { nodes, links } = useMemo(() => graphData(dens, pathIds, focus), [dens, focus])
  const selected = sel ? nodes.find(n => n.id === sel) : null
  const selTheme = sel ? THEMES.find(t => t.id === sel) : null
  const selTask = sel ? MASTERY.find(m => m.id === sel) : null
  return (
    <div className="page" style={{ maxWidth: 1240 }}>
      <PageHead kicker="Carte mentale PMP" title={present ? 'Votre carte, en présentation.' : 'Votre carte, en arbre.'}>
        <SegmentedControl label="Densité" options={[{ value: '13', label: '13 thèmes' }, { value: '26', label: free ? '26 tâches · Premium' : '26 tâches', disabled: free }]} value={String(dens)} onValueChange={(v) => setDens(Number(v))} />
        <SegmentedControl label="Vue" options={[{ value: 'arbre', label: 'Arbre' }, { value: 'graphe', label: 'Graphe' }]} value={view} onValueChange={setView} />
        <Button variant="secondary" asChild><a href="#chemin"><Route className="mr-2 size-4" aria-hidden="true" /> Chemin critique</a></Button>
        <Button variant="ghost" aria-pressed={present}><Presentation className="mr-2 size-4" aria-hidden="true" /> Présentation</Button>
      </PageHead>
      {free && <Alert className="mb-5"><Lock className="size-4" aria-hidden="true" /><AlertTitle>La carte de base (13 thèmes) reste complète et gratuite.</AlertTitle><AlertDescription>Premium ajoute le détail par tâche ECO (26). <a className="underline" href="#premium">Voir Premium</a></AlertDescription></Alert>}
      <div className="grid-main" style={{ '--aside-w': present ? '0px' : '320px' }}>
        <Card className="overflow-hidden">
          {view === 'graphe' ? (
            <div className={present ? 'h-[720px]' : 'h-[600px]'} role="group" aria-label={`Carte mentale en graphe : PMP, 3 domaines, ${dens === 13 ? '13 thèmes' : '26 tâches'}. Votre préparation : ${pct(r.score)}.`}>
              <KnowledgeGraph ref={graphRef} nodes={nodes} links={links} centerNodeId="root" showLinkLabels onNodeClick={(n) => { if (n.type !== 'Examen' && n.type !== 'Domaine') setSel(n.id) }} />
            </div>
          ) : (
            <div className="p-2" role="group" aria-label={`Carte mentale en arbre : PMP, 3 domaines, ${dens === 13 ? '13 thèmes' : '26 tâches'}.`}>
              <TreeView selectedId={sel ?? undefined} onSelect={setSel}>
                {DOMAINS.map(d => (
                  <TreeSection key={d.id} title={`${d.fr} · ${Math.round(d.weight * 100)} %`} defaultExpanded>
                    {dens === 13 ? THEMES.filter(t => t.domain === d.id).map(t => {
                      const s = avg(t.tasks), a = attempts(t.tasks), onPath = pathIds.includes(t.id)
                      return <TreeFolder key={t.id} id={t.id} label={`${t.fr}${a ? ` · ${pct(s)}` : ''}`} badge={onPath ? `Étape ${pathIds.indexOf(t.id) + 1}` : undefined} defaultExpanded={t.id === sel}>
                        {t.tasks.map(id => { const m = MASTERY.find(x => x.id === id); return <TreeItem key={id} id={id} label={`${id} · ${m.fr}`} badge={m.attempts ? pct(m.score) : '—'} /> })}
                      </TreeFolder>
                    }) : MASTERY.filter(m => m.domain === d.id).map(m => <TreeItem key={m.id} id={m.id} label={`${m.id} · ${m.fr}`} badge={pathIds.includes(m.id) ? `Étape ${pathIds.indexOf(m.id) + 1}` : m.attempts ? pct(m.score) : '—'} />)}
                  </TreeSection>
                ))}
              </TreeView>
            </div>
          )}
        </Card>
        {!present && (
          <aside className="flex flex-col gap-4" aria-label="Détail">
            <Card>
              <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">{selected ? (selTheme ? selTheme.fr : selTask?.fr) : 'Légende'}</CardTitle>
                <Popover><PopoverTrigger asChild><Button variant="ghost" size="sm" aria-label="Comment lire la carte"><ZoomIn className="size-4" aria-hidden="true" /></Button></PopoverTrigger><PopoverContent className="w-72 text-sm" side="left"><p className="font-medium">Lire la carte</p><p className="mt-1 text-muted-foreground">Les couleurs sont celles de votre maîtrise, jamais décoratives. Les zones pâles vous attendent ; elles ne sont pas des trous. Dans la vue graphe, la molette zoome et le glisser déplace.</p></PopoverContent></Popover></div>
                {!selected && <CardDescription>Cliquez un thème ou une tâche.</CardDescription>}</CardHeader>
              <CardContent className="flex flex-col gap-3">
                {selected ? <>
                  <LightBadge light={selTheme ? lightOf(avg(selTheme.tasks), attempts(selTheme.tasks)) : selTask.light} />
                  <Progress value={(selTheme ? avg(selTheme.tasks) : selTask.score) * 100} aria-label="Réussite" />
                  {selTheme && <ul className="divide-y text-sm">{selTheme.tasks.map(id => { const m = MASTERY.find(x => x.id === id); return <li key={id} className="flex items-center justify-between gap-2 py-2"><span>{id} · {m.fr}</span><span className="num text-muted-foreground">{m.attempts ? pct(m.score) : '—'}</span></li> })}</ul>}
                  {selTask && <p className="text-sm text-muted-foreground">{selTask.attempts ? `${pct(selTask.score)} de réussite · ${selTask.attempts} réponses` : 'Jamais pratiquée : compte 0 dans votre indicateur.'}</p>}
                  <Button asChild><a href="#tester">Réviser</a></Button>
                </> : <ul className="space-y-2 text-sm">{Object.entries(LIGHT_LABEL).map(([k, v]) => <li key={k} className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: LIGHT_COLOR[k] }} aria-hidden="true" />{v.fr}</li>)}<li className="flex items-center gap-2 pt-1"><Badge variant="outline" className="font-normal">Étape n</Badge>sur votre chemin critique</li></ul>}
              </CardContent>
            </Card>
            {free ? <Premium go={go} reason="Le détail par tâche (26) est inclus dans Premium"><Card><CardHeader><CardTitle className="text-base">Détail par tâche</CardTitle><CardDescription>26 tâches, facilitateurs officiels, lecture par domaine.</CardDescription></CardHeader></Card></Premium> : <Card className="bg-muted/40"><CardContent className="pt-6 text-sm text-muted-foreground">Votre préparation : <TierBadge tier={r.label.tier} /> {pct(r.score)}. Le chemin critique numérote les quatre étapes à travailler, dans l’ordre.</CardContent></Card>}
          </aside>
        )}
      </div>
    </div>
  )
}
