import React, { useState } from 'react'
import { Triangle, GraduationCap, Mail, LayoutGrid, ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck } from 'lucide-react'
import { Hero115 } from '@/components/21st/hero-115'
import VerticalTitledStepper from '@/components/21st/vertical-stepper'
import { SegmentedControl } from '@/components/21st/segmented-control'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Alert, AlertTitle, AlertDescription, Skeleton } from './_shared.jsx'

// Photo slot: images.unsplash.com is still refused by the network proxy (CONNECT 403), so the
// Unsplash photo could not be embedded. The slot and its alt text are in place; swap `src` for the data URI.
export const PHOTO_SLOT = {
  src: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 640"><rect width="1200" height="640" fill="#F1EFE9"/><g fill="none" stroke="#CFCBBF" stroke-width="2"><rect x="80" y="80" width="1040" height="480" rx="24"/><path d="M80 560 L420 300 L640 440 L860 220 L1120 400"/></g><text x="600" y="330" font-family="Inter, sans-serif" font-size="26" text-anchor="middle" fill="#5B6271">Photo Unsplash à insérer — réseau refusé pendant la construction</text></svg>'),
  alt: 'Emplacement photo : une cheffe de projet et un ingénieur examinent un planning de chantier (photo Unsplash à insérer : le réseau du laboratoire a refusé images.unsplash.com).',
}

function Frame({ children, heading, description, quote }) {
  const [lang, setLang] = useState('fr')
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-start lg:px-8 lg:py-12">
        <div className="flex flex-col gap-6">
          <a href="#lab" className="flex items-center gap-2 no-underline"><span className="grid size-7 place-items-center rounded-[8px] bg-primary text-primary-foreground" aria-hidden="true"><Triangle size={13} /></span><span className="font-display text-[17px]">Certifizer</span></a>
          {children}
          <div className="max-w-[200px]"><SegmentedControl label="Langue de l’interface" options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} value={lang} onValueChange={setLang} /></div>
        </div>
        <aside className="hidden lg:block" aria-label="À propos de Certifizer">
          <div className="[&_section]:py-0">
            <Hero115 icon={<ShieldCheck className="size-6" aria-hidden="true" />} heading={heading || 'Réussir l’examen et savoir diriger un projet.'} description={description || 'Une seule vérité, la vôtre. ECO PMP 2026 · 3 domaines · 26 tâches · 33 / 41 / 26.'} button={{ text: 'Vous êtes formateur ? Ouvrir le cockpit', icon: <ArrowRight className="ml-2 size-4" aria-hidden="true" />, url: '#cockpit' }} trustText={quote || 'Cohorte de démonstration PMP-2026-A · données « Exemple »'} imageSrc={PHOTO_SLOT.src} imageAlt={PHOTO_SLOT.alt} />
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function Acces({ route, state }) {
  if (route.hash === 'invitation') return <Invitation state={state} />
  if (route.hash === 'email') return <EmailRec state={state} />
  if (route.hash === 'lien') return <Magic state={state} />
  return <Gate state={state} />
}

const Field = ({ id, label, children, error }) => (
  <div className="grid gap-1.5"><Label htmlFor={id}>{label}</Label>{children}{error && <p id={`${id}-err`} className="text-sm text-destructive">{error}</p>}</div>
)

function Gate({ state }) {
  const [name, setName] = useState('')
  const panel = state === 'Code de classe' ? 'class' : state === 'Retrouver (email)' ? 'recover' : state === 'Email envoyé' ? 'sent' : state === 'Accès formateur' ? 'trainer' : 'name'
  return (
    <Frame>
      {panel === 'name' && <form className="flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
        <div><h1>Bienvenue.</h1><p className="lead mt-2">Entrez votre nom ou un code pour suivre votre progression sur cet appareil.</p></div>
        <Field id="g-name" label="Votre nom ou un code"><Input id="g-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex. : Nadia" autoComplete="name" /></Field>
        <Button size="lg" type="submit" disabled={!name.trim()}>Commencer</Button>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" asChild><a href="#accueil"><GraduationCap className="mr-2 size-4" aria-hidden="true" /> J’ai un code de classe</a></Button>
          <Button variant="ghost" asChild><a href="#accueil"><Mail className="mr-2 size-4" aria-hidden="true" /> Déjà inscrit·e ? Retrouver ma progression</a></Button>
          <Button variant="ghost" asChild><a href="#cockpit"><LayoutGrid className="mr-2 size-4" aria-hidden="true" /> Vous êtes formateur ? Accès cockpit</a></Button>
        </div>
      </form>}
      {panel === 'class' && <form className="flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
        <div><p className="label">Rejoindre votre classe</p><h1 className="mt-1">Votre code de classe.</h1><p className="mt-2 text-muted-foreground">Votre formateur vous l’a transmis. Il ressemble à PMP-2026-A.</p></div>
        <Field id="g-code" label="Code de classe"><Input id="g-code" className="font-mono uppercase tracking-[0.12em]" placeholder="PMP-2026-A" /></Field>
        <Field id="g-name2" label="Votre nom"><Input id="g-name2" placeholder="Ex. : Nadia" /></Field>
        <Button size="lg" type="submit">Rejoindre la cohorte</Button>
        <Button variant="ghost" asChild><a href="#accueil"><ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Retour</a></Button>
      </form>}
      {(panel === 'recover' || panel === 'sent') && <form className="flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
        <div><p className="label">Retrouver ma progression</p><h1 className="mt-1">Un lien, pas de mot de passe.</h1><p className="mt-2 text-muted-foreground">Nous vous envoyons un lien de connexion valable 30 minutes, à usage unique.</p></div>
        {panel === 'sent' ? <Alert><Check className="size-4" aria-hidden="true" /><AlertTitle>Lien envoyé</AlertTitle><AlertDescription>Si un compte existe pour cette adresse, un lien vient de partir. Vérifiez aussi vos courriers indésirables.</AlertDescription></Alert> : <>
          <Field id="g-email" label="Email de récupération"><Input id="g-email" type="email" placeholder="vous@exemple.com" autoComplete="email" /></Field>
          <Button size="lg" type="submit">M’envoyer un lien de connexion</Button>
        </>}
        <Button variant="ghost" asChild><a href="#accueil"><ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Retour</a></Button>
      </form>}
      {panel === 'trainer' && <form className="flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
        <div><p className="label">Accès formateur</p><h1 className="mt-1">Ouvrir le cockpit.</h1><p className="mt-2 text-muted-foreground">Le cockpit lit votre cohorte et ne montre jamais un apprenant d’une autre organisation.</p></div>
        <Field id="g-trainer" label="Identifiant formateur"><Input id="g-trainer" placeholder="formateur" /></Field>
        <Button size="lg" asChild><a href="#cockpit">Ouvrir le cockpit</a></Button>
        <Button variant="ghost" asChild><a href="#accueil"><ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Retour</a></Button>
      </form>}
    </Frame>
  )
}

function Invitation({ state }) {
  const quote = 'Votre progression est personnelle. Elle commence maintenant et vous suit.'
  if (state === 'Vérification') return <Frame quote={quote}><div className="flex flex-col gap-4" aria-live="polite" aria-busy="true"><div className="flex items-center gap-3"><Loader2 className="size-5 animate-spin" aria-hidden="true" /><h1 className="text-2xl">Vérification de votre invitation…</h1></div><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-3/5" /></div></Frame>
  const bad = { 'Lien utilisé': 'Ce lien a déjà été utilisé.', 'Lien révoqué': 'Ce lien a été révoqué.', 'Places épuisées': 'Cette cohorte n’a plus de place disponible.' }[state]
  if (bad) return <Frame quote={quote}><div className="flex flex-col gap-5"><div><p className="label">Invitation</p><h1 className="mt-1">Invitation indisponible.</h1></div><Alert><AlertTitle>{bad}</AlertTitle><AlertDescription>Demandez un nouveau lien à votre formateur.</AlertDescription></Alert><Button asChild><a href="#accueil">Continuer vers Certifizer</a></Button></div></Frame>
  const hasProfile = state === 'Valide — profil présent'
  return (
    <Frame quote={quote}>
      <form className="flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
        <div><p className="label">Invitation</p><h1 className="mt-1">Rejoindre la cohorte <span className="font-mono text-[0.8em] text-accent-soft-ink">PMP-2026-A</span>.</h1><p className="mt-2 text-muted-foreground">Votre formateur vous a transmis ce lien. Votre progression est personnelle et commence immédiatement.</p></div>
        {hasProfile ? <><Button size="lg" type="submit">Rejoindre avec mon profil (Nadia)</Button><p className="text-sm text-muted-foreground">Votre progression actuelle est conservée.</p></> : <>
          <Field id="inv-name" label="Votre nom"><Input id="inv-name" defaultValue="Nadia (Exemple)" /></Field>
          <Button size="lg" type="submit">Rejoindre la cohorte</Button>
        </>}
      </form>
    </Frame>
  )
}

const EMAIL_STEPS = [{ title: 'Saisir l’email' }, { title: 'Confirmer' }, { title: 'Lié' }]
function EmailRec({ state }) {
  const err = state === 'Erreur'
  return (
    <Frame quote="Nous n’envoyons jamais de publicité. L’email sert uniquement à retrouver votre compte.">
      <Card><CardHeader><CardDescription className="label">Facultatif</CardDescription><CardTitle><h1 className="text-2xl">Retrouvez-vous partout.</h1></CardTitle><CardDescription>Liez un email pour vous reconnecter depuis un autre appareil. Vous pourrez le retirer à tout moment dans Réglages.</CardDescription></CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-[auto_1fr]">
          <div><h2 className="sr-only">Étapes</h2><VerticalTitledStepper steps={EMAIL_STEPS} value={state === 'Lié' ? 3 : 1} panelClassName="hidden" /></div>
          {state === 'Lié' ? <div className="flex flex-col gap-4" aria-live="polite"><Alert><Check className="size-4" aria-hidden="true" /><AlertTitle>Email lié</AlertTitle><AlertDescription>Vous pourrez vous reconnecter partout.</AlertDescription></Alert><Button size="lg" asChild><a href="#preparation">Continuer</a></Button></div> : (
            <form className="flex flex-col gap-4" onSubmit={e => e.preventDefault()}>
              <Field id="rec-email" label="Email de récupération" error={err ? 'Cet email est déjà lié à un autre compte. Essayez « Retrouver ma progression » depuis l’accueil.' : null}><Input id="rec-email" type="email" placeholder="vous@exemple.com" aria-invalid={err || undefined} aria-describedby={err ? 'rec-email-err' : undefined} className={err ? 'border-destructive' : ''} /></Field>
              <div className="flex flex-wrap gap-2"><Button size="lg" type="submit">Lier mon email</Button><Button variant="ghost" asChild><a href="#preparation">Plus tard</a></Button></div>
            </form>
          )}
        </CardContent></Card>
    </Frame>
  )
}

function Magic({ state }) {
  return (
    <Frame quote="Un lien de 30 minutes, à usage unique. Rien d’autre à retenir.">
      {state === 'Connexion' ? <div className="flex flex-col gap-4" aria-live="polite" aria-busy="true"><div className="flex items-center gap-3"><Loader2 className="size-5 animate-spin" aria-hidden="true" /><h1 className="text-2xl">Connexion en cours…</h1></div><p className="text-muted-foreground">Nous vérifions votre lien et restaurons votre progression.</p><h2 className="sr-only">Étapes</h2><VerticalTitledStepper steps={[{ title: 'Lien reçu' }, { title: 'Vérification' }, { title: 'Progression restaurée' }]} value={2} panelClassName="hidden" /></div> : (
        <div className="flex flex-col gap-5"><div><p className="label">Lien de connexion</p><h1 className="mt-1">Lien indisponible.</h1></div>
          <Alert variant="destructive"><AlertTitle>{state === 'Expiré' ? 'Ce lien de connexion a expiré.' : 'Ce lien de connexion n’est pas valide.'}</AlertTitle><AlertDescription>Demandez-en un nouveau depuis l’accueil.</AlertDescription></Alert>
          <Button asChild><a href="#accueil">Continuer vers Certifizer</a></Button></div>
      )}
    </Frame>
  )
}
