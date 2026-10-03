import React, { useState } from 'react'
import { FileText, Table2, RotateCcw, Check } from 'lucide-react'
import { LEARNER } from '../data.js'
import { Switch } from '@/components/21st/switch'
import { SegmentedControl } from '@/components/21st/segmented-control'
import { Accordion01 } from '@/components/21st/accordion'
import { Drawer, DrawerContent, DrawerClose } from '@/components/21st/drawer'
import Timeline from '@/components/21st/process-timeline'
import { Progress } from '@/components/21st/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Alert, AlertTitle, AlertDescription, PageHead, LoadingCard, Skeleton } from './_shared.jsx'

export default function Reglages({ state, reduced, setReduced }) {
  const [lang, setLang] = useState('fr')
  const [email, setEmail] = useState('nadia@exemple.com')
  if (state === 'Chargement') return <div className="page flex flex-col gap-4" aria-busy="true"><p className="label">Réglages</p><Skeleton className="h-10 w-2/5" /><LoadingCard lines={4} /><LoadingCard /></div>
  if (state === 'Délai de grâce') return <Grace />
  const editing = state === 'Email en édition'
  const trainer = state === 'Formateur (test)'
  return (
    <div className="page" style={{ maxWidth: 840 }}>
      <PageHead kicker="Réglages" title="Votre compte, vos préférences, vos données." />
      <div className="flex flex-col gap-6">
        <Card aria-labelledby="s-compte">
          <CardHeader><CardTitle><h2 id="s-compte" className="text-xl">Mon compte</h2></CardTitle></CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              {[['Nom', LEARNER.name], ['Cohorte', 'PMP-2026-A'], ['Progression', '9 tâches acquises sur 26 · 174 réponses']].map(([k, v]) => <div key={k} className="flex flex-wrap gap-4 py-3"><dt className="w-40 text-muted-foreground">{k}</dt><dd className="flex-1">{v}</dd></div>)}
              <div className="flex flex-wrap gap-4 py-3"><dt className="w-40 text-muted-foreground">Email de récupération</dt><dd className="min-w-[240px] flex-1">
                <p className="mb-2 text-muted-foreground">Sert uniquement à vous reconnecter depuis un autre appareil, par lien magique. Jamais de publicité.</p>
                {editing ? <form className="flex flex-wrap items-end gap-2" onSubmit={e => { e.preventDefault(); toast('Email enregistré', { description: email }) }}><div className="grid flex-1 gap-1.5"><Label htmlFor="r-email">Email</Label><Input id="r-email" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div><Button type="submit" size="sm">Enregistrer</Button><Button type="button" variant="ghost" size="sm">Annuler</Button></form>
                  : <div className="flex flex-wrap items-center gap-2"><span>{email}</span><Button variant="secondary" size="sm">Modifier</Button><Button variant="ghost" size="sm" className="text-destructive">Retirer</Button></div>}
              </dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card aria-labelledby="s-pref">
          <CardHeader><CardTitle><h2 id="s-pref" className="text-xl">Préférences</h2></CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">Langue</p><p className="text-sm text-muted-foreground">S’applique à toute l’interface et aux contenus générés.</p></div><div className="w-[200px]"><SegmentedControl label="Langue" options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} value={lang} onValueChange={setLang} /></div></div>
            <div className="flex flex-wrap items-center justify-between gap-3"><div><label htmlFor="pref-reduced" className="font-medium">Réduire les animations</label><p className="text-sm text-muted-foreground">Supprime les transitions et les fondus. Suit aussi le réglage de votre système.</p></div><Switch id="pref-reduced" checked={reduced} onCheckedChange={setReduced} /></div>
          </CardContent>
        </Card>

        {trainer && <Card className="bg-muted/40" aria-labelledby="s-form"><CardHeader><CardTitle><h2 id="s-form" className="text-xl">Formateur · outils de test</h2></CardTitle><CardDescription>Réservé aux comptes formateur. N’apparaît jamais pour un apprenant.</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">Réinitialiser ma progression</p><p className="text-sm text-muted-foreground">Efface vos réponses de test pour rejouer un parcours apprenant.</p></div><Button variant="secondary" onClick={() => toast('Progression de test réinitialisée')}>Réinitialiser</Button></CardContent></Card>}

        <Card aria-labelledby="s-data">
          <CardHeader><CardTitle><h2 id="s-data" className="text-xl">Mes données</h2></CardTitle><CardDescription>Vous restez propriétaire de vos données. Deux fichiers, deux usages.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2"><Button variant="secondary" asChild><a href="#portrait"><FileText className="mr-2 size-4" aria-hidden="true" /> Mon portrait d’apprentissage (PDF)</a></Button><Button variant="secondary" onClick={() => toast('Export préparé', { description: 'Vos données brutes (Excel) vous sont envoyées par email.' })}><Table2 className="mr-2 size-4" aria-hidden="true" /> Mes données brutes (Excel)</Button></CardContent>
        </Card>

        <Card className="border-destructive/50" aria-labelledby="s-zone">
          <CardHeader><CardTitle><h2 id="s-zone" className="text-xl text-destructive">Zone sensible</h2></CardTitle><CardDescription>La suppression efface définitivement votre compte après un délai de 30 jours. Vos fichiers vous sont envoyés avant.</CardDescription></CardHeader>
          <CardContent><Accordion01 className="w-full" type="single" defaultValue={state === 'Supprimer ?' ? ['del'] : []} items={[{ id: 'del', title: 'Supprimer mon compte', content: <Button variant="outline" className="border-destructive text-destructive">Supprimer mon compte…</Button> }]} /></CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">Vos droits : accès, portabilité, effacement. Conformément au RGPD et à la loi 18-07. Contact : contact@certifizer.app</p>
      </div>
      <Confirm open={state === 'Supprimer ?'} />
    </div>
  )
}

function Confirm({ open }) {
  const [typed, setTyped] = useState('')
  return (
    <Drawer side="bottom" open={open} onOpenChange={() => {}}>
      <DrawerContent title="Supprimer votre compte ?" description="Prenez un instant. Cette action est sérieuse.">
        <div className="flex flex-col gap-4">
          <Alert variant="destructive"><AlertTitle>Sera effacé après 30 jours</AlertTitle><AlertDescription>Votre nom et votre email ; vos réponses et vos tâches ; vos réflexes ; votre appartenance à la cohorte et vos séances assignées.</AlertDescription></Alert>
          <Alert><AlertTitle>Avant de partir, emportez votre travail</AlertTitle><AlertDescription><a className="underline" href="#portrait">Portrait (PDF)</a> · données brutes (Excel). Nous vous les envoyons aussi par email.</AlertDescription></Alert>
          <div className="grid gap-1.5"><Label htmlFor="del-confirm">Pour confirmer, saisissez SUPPRIMER</Label><Input id="del-confirm" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" /></div>
          <div className="flex flex-wrap gap-2"><Button variant="destructive" disabled={typed !== 'SUPPRIMER'}>Supprimer définitivement mon compte</Button><DrawerClose asChild><Button variant="ghost">Garder mon compte</Button></DrawerClose></div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function Grace() {
  return (
    <div className="page flex flex-col gap-6" style={{ maxWidth: 760 }}>
      <div><p className="label">Réglages · suppression demandée</p><h1 className="mt-1">Effacement définitif dans <span className="num">27 jours</span>.</h1><p className="lead mt-2">Votre compte est en délai de grâce. Rien n’est encore effacé.</p></div>
      <Progress value={10} aria-label="3 jours écoulés sur 30" /><p className="-mt-4 text-sm text-muted-foreground">3 jours écoulés sur 30.</p>
      <div><Button size="lg" onClick={() => toast('Suppression annulée', { description: 'Votre compte est récupéré, rien n’a été perdu.' })}><RotateCcw className="mr-2 size-4" aria-hidden="true" /> Annuler la suppression et récupérer mon compte</Button></div>
      <Timeline className="px-1" steps={[{ title: 'Demande enregistrée', description: 'Tout est conservé pendant le délai de grâce ; rien n’est perdu si vous changez d’avis.', completed: true }, { title: 'J-7 et J-1 : rappels', description: 'Un rappel vous est envoyé avec vos fichiers (portrait PDF, données Excel).' }, { title: 'J+30 : effacement', description: 'Effacement immédiat possible sur demande à contact@certifizer.app.' }]} />
      <Card className="bg-muted/40"><CardHeader><CardDescription className="label">Ce que dit la recherche</CardDescription></CardHeader><CardContent><p>La courbe de l’oubli (Ebbinghaus) montre qu’une connaissance non utilisée s’estompe vite. Votre portrait et vos réflexes sont le moyen de la retenir : emportez-les avant l’effacement.</p></CardContent></Card>
    </div>
  )
}
