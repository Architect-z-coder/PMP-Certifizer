import React, { useState } from 'react'
import { Triangle, ArrowLeft, Mail, GraduationCap, LayoutGrid, Check, Loader2 } from 'lucide-react'
import { Callout, Vignette } from '../ui.jsx'

function Frame({ children, aside }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', background: 'var(--bg)' }} className="acces">
      <style>{`@media (max-width: 1023px){ .acces{ grid-template-columns: 1fr !important } .acces-aside{ display:none } }`}</style>
      <div style={{ display: 'grid', placeItems: 'center', padding: 'var(--s-6) var(--gutter)' }}>
        <div style={{ width: 'min(440px, 100%)' }} className="stack">
          <a href="#lab" className="brand" style={{ textDecoration: 'none', padding: 0 }}><span className="brand-mark" aria-hidden="true"><Triangle size={14} /></span><span className="brand-name">Certifizer</span></a>
          {children}
          <p className="small subtle">Français · <a href="#accueil">English</a></p>
        </div>
      </div>
      <div className="acces-aside" style={{ background: 'var(--surface-2)', display: 'grid', placeItems: 'center', padding: 'var(--s-7)' }}>
        <div style={{ width: 'min(520px, 100%)' }} className="stack">
          <Vignette kind={aside?.kind || 'site'} />
          <blockquote style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-xl)', lineHeight: 1.3 }}>{aside?.quote || '« Réussir l’examen et savoir diriger un projet : une seule vérité, la vôtre. »'}</blockquote>
          <p className="small subtle">ECO PMP 2026 · 3 domaines · 26 tâches · 33 / 41 / 26</p>
        </div>
      </div>
    </div>
  )
}

export default function Acces({ route, state, go }) {
  if (route.hash === 'invitation') return <Invitation state={state} />
  if (route.hash === 'email') return <EmailRec state={state} />
  if (route.hash === 'lien') return <Magic state={state} />
  return <Gate state={state} />
}

function Gate({ state }) {
  const [name, setName] = useState('')
  const panel = state === 'Code de classe' ? 'class' : state === 'Retrouver (email)' ? 'recover' : state === 'Email envoyé' ? 'sent' : state === 'Accès formateur' ? 'trainer' : 'name'
  return (
    <Frame>
      {panel === 'name' && <form className="stack" onSubmit={e => e.preventDefault()}>
        <div><h1>Bienvenue.</h1><p className="lead" style={{ marginTop: 8 }}>Entrez votre nom ou un code pour suivre votre progression sur cet appareil.</p></div>
        <div className="field"><label htmlFor="g-name">Votre nom ou un code</label><input id="g-name" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex. : Nadia" autoComplete="name" /></div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={!name.trim()}>Commencer</button>
        <div className="stack-sm">
          <a href="#accueil" className="btn btn-secondary"><GraduationCap size={18} aria-hidden="true" /> J’ai un code de classe</a>
          <a href="#accueil" className="btn btn-ghost"><Mail size={18} aria-hidden="true" /> Déjà inscrit·e ? Retrouver ma progression</a>
          <a href="#cockpit" className="btn btn-ghost"><LayoutGrid size={18} aria-hidden="true" /> Vous êtes formateur ? Accès cockpit</a>
        </div>
      </form>}
      {panel === 'class' && <form className="stack" onSubmit={e => e.preventDefault()}>
        <div><div className="label">Rejoindre votre classe</div><h1 style={{ marginTop: 6 }}>Votre code de classe.</h1><p className="muted" style={{ marginTop: 8 }}>Votre formateur vous l’a transmis. Il ressemble à PMP-2026-A.</p></div>
        <div className="field"><label htmlFor="g-code">Code de classe</label><input id="g-code" className="input" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase' }} placeholder="PMP-2026-A" /></div>
        <div className="field"><label htmlFor="g-name2">Votre nom</label><input id="g-name2" className="input" placeholder="Ex. : Nadia" /></div>
        <button type="submit" className="btn btn-primary btn-lg">Rejoindre la cohorte</button>
        <a href="#accueil" className="btn btn-ghost"><ArrowLeft size={16} aria-hidden="true" /> Retour</a>
      </form>}
      {(panel === 'recover' || panel === 'sent') && <form className="stack" onSubmit={e => e.preventDefault()}>
        <div><div className="label">Retrouver ma progression</div><h1 style={{ marginTop: 6 }}>Un lien, pas de mot de passe.</h1><p className="muted" style={{ marginTop: 8 }}>Nous vous envoyons un lien de connexion valable 30 minutes, à usage unique.</p></div>
        {panel === 'sent' ? <Callout kind="accent" icon={Check}>Si un compte existe pour cette adresse, un lien vient de partir. Vérifiez aussi vos courriers indésirables.</Callout> : <>
          <div className="field"><label htmlFor="g-email">Email de récupération</label><input id="g-email" className="input" type="email" placeholder="vous@exemple.com" autoComplete="email" /></div>
          <button type="submit" className="btn btn-primary btn-lg">M’envoyer un lien de connexion</button>
        </>}
        <a href="#accueil" className="btn btn-ghost"><ArrowLeft size={16} aria-hidden="true" /> Retour</a>
      </form>}
      {panel === 'trainer' && <form className="stack" onSubmit={e => e.preventDefault()}>
        <div><div className="label">Accès formateur</div><h1 style={{ marginTop: 6 }}>Ouvrir le cockpit.</h1><p className="muted" style={{ marginTop: 8 }}>Le cockpit lit votre cohorte et ne montre jamais un apprenant d’une autre organisation.</p></div>
        <div className="field"><label htmlFor="g-trainer">Identifiant formateur</label><input id="g-trainer" className="input" placeholder="formateur" /></div>
        <a href="#cockpit" className="btn btn-primary btn-lg">Ouvrir le cockpit</a>
        <a href="#accueil" className="btn btn-ghost"><ArrowLeft size={16} aria-hidden="true" /> Retour</a>
      </form>}
    </Frame>
  )
}

function Invitation({ state }) {
  const aside = { kind: 'board', quote: '« Votre progression est personnelle. Elle commence maintenant et vous suit. »' }
  if (state === 'Vérification') return <Frame aside={aside}><div className="stack" aria-live="polite"><div className="row"><Loader2 size={20} className="spin" aria-hidden="true" /><h1 style={{ fontSize: 'var(--t-2xl)' }}>Vérification de votre invitation…</h1></div><div className="skeleton" style={{ height: 44 }} /><div className="skeleton" style={{ height: 44, width: '60%' }} /></div></Frame>
  const bad = { 'Lien utilisé': 'Ce lien a déjà été utilisé.', 'Lien révoqué': 'Ce lien a été révoqué.', 'Places épuisées': 'Cette cohorte n’a plus de place disponible.' }[state]
  if (bad) return <Frame aside={aside}><div className="stack"><div><div className="label">Invitation</div><h1 style={{ marginTop: 6 }}>Invitation indisponible.</h1></div><Callout kind="warm">{bad} Demandez un nouveau lien à votre formateur.</Callout><a href="#accueil" className="btn btn-primary">Continuer vers Certifizer</a></div></Frame>
  const hasProfile = state === 'Valide — profil présent'
  return (
    <Frame aside={aside}>
      <form className="stack" onSubmit={e => e.preventDefault()}>
        <div><div className="label">Invitation</div><h1 style={{ marginTop: 6 }}>Rejoindre la cohorte <span className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8em', color: 'var(--accent-soft-ink)' }}>PMP-2026-A</span>.</h1><p className="muted" style={{ marginTop: 8 }}>Votre formateur vous a transmis ce lien. Votre progression est personnelle et commence immédiatement.</p></div>
        {hasProfile ? <>
          <button type="submit" className="btn btn-primary btn-lg">Rejoindre avec mon profil (Nadia)</button>
          <p className="small subtle">Votre progression actuelle est conservée.</p>
        </> : <>
          <div className="field"><label htmlFor="inv-name">Votre nom</label><input id="inv-name" className="input" defaultValue="Nadia (Exemple)" /></div>
          <button type="submit" className="btn btn-primary btn-lg">Rejoindre la cohorte</button>
        </>}
      </form>
    </Frame>
  )
}

function EmailRec({ state }) {
  return (
    <Frame aside={{ kind: 'desk', quote: '« Nous n’envoyons jamais de publicité. L’email sert uniquement à retrouver votre compte. »' }}>
      {state === 'Lié' ? <div className="stack" aria-live="polite"><Callout kind="accent" icon={Check}>Email lié. Vous pourrez vous reconnecter partout.</Callout><a href="#preparation" className="btn btn-primary btn-lg">Continuer</a></div> : (
        <form className="stack" onSubmit={e => e.preventDefault()}>
          <div><div className="label">Facultatif</div><h1 style={{ marginTop: 6 }}>Retrouvez-vous partout.</h1><p className="muted" style={{ marginTop: 8 }}>Liez un email pour vous reconnecter depuis un autre appareil. Vous pourrez le retirer à tout moment dans Réglages.</p></div>
          <div className={state === 'Erreur' ? 'field field-error' : 'field'}><label htmlFor="rec-email">Email de récupération</label><input id="rec-email" className="input" type="email" placeholder="vous@exemple.com" aria-describedby={state === 'Erreur' ? 'rec-err' : undefined} aria-invalid={state === 'Erreur' || undefined} />{state === 'Erreur' && <p id="rec-err" className="error-text">Cet email est déjà lié à un autre compte. Essayez « Retrouver ma progression » depuis l’accueil.</p>}</div>
          <div className="row"><button type="submit" className="btn btn-primary btn-lg">Lier mon email</button><a href="#preparation" className="btn btn-ghost">Plus tard</a></div>
          <p className="small subtle">Nous n’envoyons jamais de publicité. L’email sert uniquement à retrouver votre compte.</p>
        </form>
      )}
    </Frame>
  )
}

function Magic({ state }) {
  return (
    <Frame aside={{ kind: 'desk', quote: '« Un lien de 30 minutes, à usage unique. Rien d’autre à retenir. »' }}>
      {state === 'Connexion' ? <div className="stack" aria-live="polite"><div className="row"><Loader2 size={20} className="spin" aria-hidden="true" /><h1 style={{ fontSize: 'var(--t-2xl)' }}>Connexion en cours…</h1></div><p className="muted">Nous vérifions votre lien et restaurons votre progression.</p></div> : (
        <div className="stack"><div><div className="label">Lien de connexion</div><h1 style={{ marginTop: 6 }}>Lien indisponible.</h1></div>
          <Callout kind="warm">{state === 'Expiré' ? 'Ce lien de connexion a expiré. Demandez-en un nouveau depuis l’accueil.' : 'Ce lien de connexion n’est pas valide.'}</Callout>
          <a href="#accueil" className="btn btn-primary">Continuer vers Certifizer</a></div>
      )}
    </Frame>
  )
}
