import React from 'react'
import { Sparkles, Check } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/21st/carousel'
import { Drawer, DrawerContent, DrawerClose } from '@/components/21st/drawer'
import { Hero115 } from '@/components/21st/hero-115'
import { Accordion01 } from '@/components/21st/accordion'
import { Button, Card, CardHeader, CardTitle, CardDescription, Badge, PageHead, Premium as Veil } from './_shared.jsx'
import { PHOTO_SLOT } from './Acces.jsx'

const FEATURES = [['Séance adaptative complète', 'Composition 33 / 41 / 26, leviers, questions manquées, entretien.'], ['Chemin critique complet', 'Les 4 étapes, pas seulement les 2 premières.'], ['Apprentissage adaptatif de vos erreurs', 'Vos questions manquées reviennent à 1, 3 et 7 jours.'], ['Carte par tâche (26)', 'Le détail ECO complet, facilitateurs inclus.'], ['Simulateur d’examen', '180 questions · 240 minutes · au format réel. Bientôt.']]

export default function Premium({ state, go }) {
  const premium = state === 'Fonctions intelligentes (premium)'
  return (
    <div className="page" style={{ maxWidth: 980 }}>
      <PageHead kicker="Plan" title="Utile gratuitement. Intelligent en Premium." lead="Le gratuit n’est jamais punitif : la carte de base, la pratique et votre indicateur restent complets. Premium ajoute la couche qui vous guide."><Badge className="border-0 bg-warm text-warm-ink hover:bg-warm">● {premium ? 'Premium' : 'Gratuit'}</Badge></PageHead>
      <div className="px-12"><Carousel opts={{ align: 'start' }}>
        <CarouselContent>
          {FEATURES.map(([t, d]) => { const card = <Card className="h-full"><CardHeader><Sparkles className="size-4 text-primary" aria-hidden="true" /><CardTitle className="text-lg">{t}</CardTitle><CardDescription>{d}</CardDescription></CardHeader></Card>; return <CarouselItem key={t} className="md:basis-1/2 lg:basis-1/3">{premium ? card : <Veil go={go} reason="Inclus dans Premium" cta="Demander Premium">{card}</Veil>}</CarouselItem> })}
        </CarouselContent>
        <CarouselPrevious /><CarouselNext />
      </Carousel></div>
      <p className="mt-5 text-sm text-muted-foreground">Premium s’active par votre formateur ou votre institution. Vous n’avez rien à saisir ici.</p>
      <div className="section grid gap-6 lg:grid-cols-2">
        <Accordion01 className="w-full" items={[{ id: 'free', title: 'Gratuit · vous l’avez', content: <ul className="space-y-1">{['Pratique des questions', 'Carte PMP de base (13 thèmes)', 'Indicateur de préparation honnête', 'Co-penseur : expliquer, cas d’examen', 'Portrait et export de vos données'].map(x => <li key={x} className="flex gap-2"><Check className="mt-1 size-3.5 shrink-0" aria-hidden="true" />{x}</li>)}</ul> }, { id: 'premium', title: 'Premium · l’intelligence', content: <ul className="space-y-1">{FEATURES.map(([t]) => <li key={t} className="flex gap-2"><Sparkles className="mt-1 size-3.5 shrink-0 text-primary" aria-hidden="true" />{t}</li>)}</ul> }]} />
        <div className="[&_section]:py-4"><Hero115 icon={<Sparkles className="size-6" aria-hidden="true" />} heading="Votre progression est la même dans les deux cas." description="Aucune donnée ne se perd. Premium change ce qui vous guide, jamais ce qui vous mesure." button={{ text: 'Demander Premium à mon formateur', url: '#premium' }} trustText="Activation par votre formateur ou votre institution" imageSrc={PHOTO_SLOT.src} imageAlt={PHOTO_SLOT.alt} /></div>
      </div>
      <Drawer side="bottom" open={state === 'Modale'} onOpenChange={() => {}}>
        <DrawerContent title="Certifizer est utile gratuitement. Il devient intelligent en Premium." description="Vous gardez toute votre progression. Aucune donnée ne se perd.">
          <div className="grid gap-6 sm:grid-cols-2 text-sm">
            <div><p className="label mb-2">Gratuit · vous l’avez</p><ul className="space-y-1">{['Pratique des questions', 'Carte PMP de base (13 thèmes)', 'Indicateur de préparation', 'Co-penseur : expliquer, cas d’examen'].map(x => <li key={x}>{x}</li>)}</ul></div>
            <div><p className="label mb-2">Premium · l’intelligence</p><ul className="space-y-1">{['Séances adaptatives complètes', 'Chemin critique complet', 'Apprentissage adaptatif de vos erreurs', 'Carte par tâche (26)'].map(x => <li key={x}>{x}</li>)}</ul></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2"><Button>Demander Premium à mon formateur</Button><DrawerClose asChild><Button variant="ghost" onClick={() => { location.hash = 'preparation' }}>Plus tard</Button></DrawerClose></div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
