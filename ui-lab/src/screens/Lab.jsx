import React from 'react'
import { ArrowRight, Check, Minus, Layers, ListChecks, Boxes, ShieldCheck } from 'lucide-react'
import { ROUTES, GROUPS } from '../routes.js'
import { readiness, LEARNER, LEVERS } from '../data.js'
import { MANIFEST, HAND_BUILT } from '../manifest.js'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/21st/carousel'
import { ScrollReveal } from '@/components/21st/scroll-reveal'
import { StatsCard } from '@/components/21st/stats-card'
import { Accordion01 } from '@/components/21st/accordion'
import CircularProgress from '@/components/21st/circular-progress'
import { Progress } from '@/components/21st/progress'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, pct } from './_shared.jsx'

const DIRS = [
  { id: 'observatoire', name: 'L’Observatoire', tag: 'Direction retenue — construite sur tous les écrans', thesis: 'Un instrument calme. Le portrait de préparation est un miroir : on le lit comme on lit un cadran, sans décor.',
    why: ['Papier chaud et encre, un seul accent cobalt : la priorité du jour est le seul élément bleu de la page.', 'Fraunces pour les titres, Inter pour l’interface, JetBrains Mono pour les étiquettes de données.', 'Les paliers de préparation ont leurs couleurs sémantiques, jamais l’accent.', 'Hairlines, chiffres tabulaires, grille de 8 px : l’élégance vient de la précision.'],
    risk: 'Le risque : paraître froid. Réponse : le serif, les photos de gens au travail, et un ton qui vouvoie sans distance.' },
  { id: 'atelier', name: 'L’Atelier', tag: 'Aperçu (jetons seulement)', thesis: 'Un cahier de travail éditorial. Ivoire, encre profonde, terre cuite.',
    why: ['Très chaleureux ; excellent pour le portrait et les réflexes.', 'La terre cuite comme accent se confond avec « fragile ».', 'Ivoire + serif + terre cuite : un cliché des interfaces générées.'],
    risk: 'Écarté : l’accent entre en conflit avec le palier « fragile ».' },
  { id: 'chantier', name: 'Le Chantier', tag: 'Aperçu (jetons seulement)', thesis: 'Le plan d’exécution. Blanc froid, grille fine, lignes cobalt, Space Grotesk.',
    why: ['Parle au cœur du produit : produire du vrai travail de projet.', 'Le plus lisible pour le cockpit formateur.', 'Le plus froid pour un apprenant qui doute.'],
    risk: 'Écarté de peu : fort pour le formateur, dur pour l’apprenant fragile.' },
  { id: 'jardin', name: 'Le Jardin', tag: 'Aperçu (jetons seulement)', thesis: 'La croissance. Sauge, argile, coins ronds, Lora.',
    why: ['Le plus vivant ; la carte en arbre y est naturelle.', 'Le vert est à la fois accent et palier « solide » : conflit sémantique.', 'Les coins très ronds affaiblissent les tableaux du cockpit.'],
    risk: 'Écarté : le vert-accent contredit la règle « jamais inflater ».' },
]

export default function Lab({ direction, setDirection }) {
  const r = readiness()
  const nComponents = MANIFEST.length
  return (
    <div className="page" style={{ maxWidth: 1180 }}>
      <div className="flex flex-col gap-10">
        <ScrollReveal variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.4 }}>
          <p className="label mb-3">Laboratoire · branche ui-lab · données « Exemple »</p>
          <h1 style={{ fontSize: 'var(--t-4xl)', maxWidth: '18ch' }}>Quatre directions pour Certifizer, une seule construite — avec de vrais composants 21st.</h1>
          <p className="lead mt-4">La même interface rendue avec quatre jeux de jetons. Choisissez une direction, puis parcourez chaque écran et chaque état avec la barre « Labo ». L’Observatoire est construite sur tous les écrans à partir de composants 21st.dev copiés tels quels ; la page <a className="underline" href="#sources">Sources 21st</a> en est la preuve.</p>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Composants 21st.dev" value={String(nComponents)} icon={<Boxes className="size-4 text-muted-foreground" aria-hidden="true" />} change="100 % du produit" changeType="positive" changeNote="rendu avec leur code" />
          <StatsCard title="Pièces construites à la main" value={String(HAND_BUILT.length)} icon={<Layers className="size-4 text-muted-foreground" aria-hidden="true" />} change="listées" changeType="positive" changeNote="sur la page Sources" />
          <StatsCard title="Écrans · états" value={`${ROUTES.length - 2} · ${ROUTES.reduce((s, x) => s + x.states.length, 0)}`} icon={<ListChecks className="size-4 text-muted-foreground" aria-hidden="true" />} change="inventaire" changeType="positive" changeNote="du dépôt (frontend, backend, ECO)" />
          <StatsCard title="axe · 1366 et 390 px" value="0" icon={<ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />} change="constat" changeType="positive" changeNote="wcag 2.2 AA + bonnes pratiques" />
        </div>

        <Card className="border-primary/40 bg-accent-soft/40">
          <CardHeader><CardDescription className="label">Direction retenue · phase 3</CardDescription><CardTitle className="text-2xl">Le Chantier, construit</CardTitle><CardDescription>La page d’entrée racontée au défilement (GSAP ScrollTrigger + Lenis, films et photos du media pack) et cinq écrans de travail : Aujourd’hui, Parcours, S’entraîner, Mon projet, Portrait. Application séparée, servie par le même serveur de développement.</CardDescription></CardHeader>
          <CardContent><Button asChild><a href="./chantier.html">Ouvrir le Chantier <ArrowRight className="ml-2 size-4" aria-hidden="true" /></a></Button></CardContent>
        </Card>

        <section aria-labelledby="dirs">
          <h2 id="dirs" className="mb-4">Les quatre directions</h2>
          <div className="px-12"><Carousel opts={{ align: 'start' }} className="w-full">
            <CarouselContent>
              {DIRS.map(d => (
                <CarouselItem key={d.id} className="md:basis-1/2">
                  <Card className={`flex h-full flex-col ${direction === d.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                    <div data-direction={d.id} className="overflow-hidden rounded-t-xl border-b"><MiniHero r={r} /></div>
                    <CardHeader><CardDescription className="label">{d.tag}</CardDescription><CardTitle className="text-2xl">{d.name}</CardTitle><CardDescription>{d.thesis}</CardDescription></CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4">
                      <ul className="space-y-2 text-sm">{d.why.map((w, i) => <li key={i} className="flex gap-2"><span aria-hidden="true" className="mt-1 shrink-0 text-muted-foreground">{d.id === 'observatoire' ? <Check size={14} /> : <Minus size={14} />}</span>{w}</li>)}</ul>
                      <p className="text-sm text-muted-foreground">{d.risk}</p>
                      <div className="mt-auto flex flex-wrap gap-2">
                        <Button variant={direction === d.id ? 'default' : 'secondary'} onClick={() => setDirection(d.id)}>{direction === d.id ? 'Direction active' : 'Activer cette direction'}</Button>
                        <Button variant="ghost" asChild><a href="#preparation" onClick={() => setDirection(d.id)}>Ouvrir « Ma préparation » <ArrowRight className="ml-1 size-4" aria-hidden="true" /></a></Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious /><CarouselNext />
          </Carousel></div>
        </section>

        <ScrollReveal as="section" variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.45 }} viewOptions={{ amount: 0.2 }} once>
          <h2 className="mb-4">Ce que le générateur a proposé, et ce que nous en avons gardé</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader><CardDescription className="label">ui-ux-pro-max · --design-system</CardDescription></CardHeader><CardContent>
              <Accordion01 className="w-full" items={[
                { id: 'style', title: 'Style — Minimalisme & style suisse', content: 'Gardé : espace, hiérarchie, hairlines.' },
                { id: 'motif', title: 'Motif — « Feature-Rich Showcase »', content: 'Rejeté : Certifizer est un outil quotidien, pas une page marketing ; une seule action par écran.' },
                { id: 'couleurs', title: 'Couleurs — indigo #4F46E5 + orange #EA580C', content: 'Rejeté : l’orange CTA entre en conflit avec le palier « en construction » ; un seul accent cobalt, les paliers gardent leurs couleurs.' },
                { id: 'typo', title: 'Typographie — Baloo 2 / Comic Neue', content: 'Rejeté : adultes, institutions, examen professionnel. Fraunces + Inter + JetBrains Mono.' },
                { id: 'motion', title: 'Motion — stagger back.out(1.4)', content: 'Adouci : fondu de 10 px, ease-out, 240 ms ; rien ne rebondit dans un miroir honnête.' },
                { id: 'produit', title: 'Produit — « Educational App → Claymorphism »', content: 'Rejeté : le relief ludique contredit « jamais un trophée ».' },
              ]} /></CardContent></Card>
            <Card><CardHeader><CardDescription className="label">Règles produit respectées</CardDescription></CardHeader><CardContent>
              <ul className="space-y-3 text-sm">
                <li>Paliers exactement comme le backend : <em>Prêt·e pour l’examen</em> ≥ 85 %, <em>Presque prêt·e</em> ≥ 70 %, <em>En construction</em> ≥ 50 %, <em>Pas encore prêt·e</em>.</li>
                <li>Carte mentale en arbre par défaut ; chemin critique sur son propre écran, 4 étapes numérotées ; Premium = flou léger + petite étiquette ; carte formateur = constellation avec zoom.</li>
                <li>Vouvoiement partout. « Apprentissage adaptatif de vos erreurs », jamais l’expression bannie.</li>
                <li>Cohortes génériques (PMP-2026-A), aucun nom de client. Données marquées « Exemple ».</li>
                <li>Une tâche non pratiquée compte 0 : la préparation baisse quand la couverture est honnête, et l’écran l’explique.</li>
                <li>Bouton « Réduire les animations » + prefers-reduced-motion ; cibles tactiles ≥ 44 px ; contraste ≥ 4,5:1.</li>
              </ul></CardContent></Card>
          </div>
        </ScrollReveal>

        <section className="section" aria-labelledby="scope">
          <h2 id="scope">Périmètre : chaque écran, chaque état</h2>
          <p className="mt-2 text-muted-foreground">Inventaire issu du dépôt. Les écrans « Vue institution » et « Livrables » sont des propositions et le disent.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {GROUPS.filter(g => g.id !== 'lab').map(g => (
              <Card key={g.id}><CardHeader className="pb-2"><CardDescription className="label">{g.fr}</CardDescription></CardHeader>
                <CardContent><ul className="divide-y">{ROUTES.filter(r => r.group === g.id).map(r => <li key={r.hash} className="flex items-center justify-between gap-2 py-2"><a className="font-medium hover:underline" href={`#${r.hash}`}>{r.label}</a><Badge variant="secondary" className="font-normal">{r.states.length} états</Badge></li>)}</ul></CardContent></Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function MiniHero({ r }) {
  const tierClass = ['stroke-tier-0', 'stroke-tier-1', 'stroke-tier-2', 'stroke-tier-3', 'stroke-tier-4'][r.label.tier]
  return (
    <div className="bg-background p-5 text-foreground" style={{ fontFamily: 'var(--font-body)' }}>
      <p className="label">Ma préparation · Exemple</p>
      <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-4">
        <div>
          <p className="text-[20px] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>Bonjour {LEARNER.name.split(' ')[0]}. Où vous en êtes : {r.label.fr.toLowerCase()}.</p>
          <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" className="pointer-events-none" tabIndex={-1} aria-hidden="true">Lancer la séance du jour</Button><Badge variant="outline" className="font-normal">{LEVERS[0].fr}</Badge></div>
        </div>
        <CircularProgress value={Math.round(r.score * 100)} size={72} strokeWidth={7} showLabel renderLabel={(v) => `${v} %`} className="stroke-border" progressClassName={tierClass} labelClassName="text-sm font-medium" />
      </div>
      <div className="mt-4 grid gap-2">{r.domains.map(d => <div key={d.id} className="grid grid-cols-[90px_1fr_44px] items-center gap-2 text-[11px]"><span>{d.fr}</span><Progress value={d.score * 100} aria-label={`${d.fr} ${pct(d.score)}`} className="h-1.5" /><span className="num text-right">{pct(d.score)}</span></div>)}</div>
    </div>
  )
}
