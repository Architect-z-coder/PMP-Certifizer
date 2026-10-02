import React from 'react'
import { ArrowRight, Check, Minus } from 'lucide-react'
import { readiness, LEARNER, LEVERS } from '../data.js'
import { Meter, pct } from '../ui.jsx'
import { ROUTES, GROUPS } from '../routes.js'

const DIRS = [
  { id: 'observatoire', name: 'L’Observatoire', tag: 'Direction retenue — construite sur tous les écrans', thesis: 'Un instrument calme. Le portrait de préparation est un miroir : on le lit comme on lit un cadran, sans décor.',
    why: ['Papier chaud et encre, un seul accent cobalt : rien ne crie, la priorité du jour est le seul élément bleu de la page.', 'Fraunces (serif humaniste, faible contraste) pour les titres, Inter pour l’interface, JetBrains Mono pour les étiquettes de données. Le mono dit « mesure », le serif dit « humain ».', 'Les paliers de préparation ont leurs propres couleurs sémantiques, jamais l’accent. Une barre verte ne peut pas être confondue avec un bouton.', 'Génie et science du travail : hairlines, chiffres tabulaires, grilles de 8 px. L’élégance vient de la précision, pas de l’ornement.'],
    risk: 'Le risque : paraître froid. Réponse : les vignettes de gens au travail, le serif, et un ton qui vouvoie sans distance.' },
  { id: 'atelier', name: 'L’Atelier', tag: 'Aperçu (jetons seulement)', thesis: 'Un cahier de travail éditorial. Ivoire, encre profonde, terre cuite. Lire sa préparation comme on relit ses notes.',
    why: ['Très chaleureux, très humain ; excellent pour le portrait et les réflexes.', 'Moins bon pour le cockpit formateur : la terre cuite comme accent se confond avec « fragile ».', 'Le papier ivoire + serif + terre cuite est aujourd’hui un cliché des interfaces générées.'],
    risk: 'Écarté : la chaleur gagne sur la lisibilité des données, et l’accent entre en conflit avec le palier « fragile ».' },
  { id: 'chantier', name: 'Le Chantier', tag: 'Aperçu (jetons seulement)', thesis: 'Le plan d’exécution. Blanc froid, grille fine, lignes cobalt, Space Grotesk. L’apprenant est sur son chantier.',
    why: ['Parle directement au cœur du produit : produire du vrai travail de projet.', 'Le plus « industrie » et « génie » des quatre, très lisible pour le cockpit.', 'Le plus froid pour un apprenant qui doute : bleu sur blanc froid, coins carrés.'],
    risk: 'Écarté de peu : fort pour le formateur, dur pour l’apprenant fragile. L’Observatoire en garde la précision sans la froideur.' },
  { id: 'jardin', name: 'Le Jardin', tag: 'Aperçu (jetons seulement)', thesis: 'La croissance. Sauge, argile, coins ronds, Lora. La carte mentale devient une plante que l’on cultive.',
    why: ['Le plus « vivant » ; la carte en arbre y est naturelle.', 'Le vert est à la fois accent et palier « solide » : un conflit sémantique direct avec l’honnêteté du portrait.', 'Les coins très ronds affaiblissent la hiérarchie des tableaux du cockpit.'],
    risk: 'Écarté : le vert-accent contredit la règle « jamais inflater » (tout a l’air réussi).' },
]

export default function Lab({ direction, setDirection }) {
  const r = readiness()
  return (
    <div className="page" style={{ maxWidth: 1180 }}>
      <div className="stack">
        <div>
          <div className="label" style={{ marginBottom: 12 }}>Laboratoire · branche ui-lab · données « Exemple »</div>
          <h1 style={{ fontSize: 'var(--t-4xl)', maxWidth: '18ch' }}>Quatre directions pour Certifizer, une seule construite.</h1>
          <p className="lead" style={{ marginTop: 16 }}>La même interface, rendue avec quatre jeux de jetons. Choisissez une direction ci-dessous, puis parcourez chaque écran et chaque état avec la barre « Labo ». La direction retenue, l’Observatoire, est construite sur tous les écrans ; les trois autres sont des aperçus de jetons (couleurs, typographie, rayons) appliqués à la même structure.</p>
        </div>

        <div className="grid-2" style={{ alignItems: 'stretch' }}>
          {DIRS.map(d => (
            <article key={d.id} className="card card-lg" style={{ display: 'flex', flexDirection: 'column', gap: 16, outline: direction === d.id ? '2px solid var(--accent)' : 'none', outlineOffset: 2 }}>
              <div data-direction={d.id} style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                <MiniHero r={r} />
              </div>
              <div>
                <div className="label">{d.tag}</div>
                <h2 style={{ marginTop: 6 }}>{d.name}</h2>
                <p className="muted" style={{ marginTop: 8 }}>{d.thesis}</p>
              </div>
              <ul className="stack-sm" style={{ paddingLeft: 0 }}>
                {d.why.map((w, i) => <li key={i} className="small" style={{ display: 'flex', gap: 10 }}><span aria-hidden="true" style={{ color: 'var(--ink-3)', flex: 'none', marginTop: 3 }}>{d.id === 'observatoire' ? <Check size={14} /> : <Minus size={14} />}</span><span>{w}</span></li>)}
              </ul>
              <p className="small subtle">{d.risk}</p>
              <div className="row" style={{ marginTop: 'auto' }}>
                <button type="button" className={direction === d.id ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setDirection(d.id)}>{direction === d.id ? 'Direction active' : 'Activer cette direction'}</button>
                <a className="btn btn-ghost" href="#preparation" onClick={() => setDirection(d.id)}>Ouvrir « Ma préparation » <ArrowRight size={16} aria-hidden="true" /></a>
              </div>
            </article>
          ))}
        </div>

        <section className="section">
          <h2>Ce que le générateur a proposé, et ce que nous en avons gardé</h2>
          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="label">ui-ux-pro-max · --design-system</div>
              <ul className="stack-sm small" style={{ marginTop: 12 }}>
                <li><strong>Style</strong> Minimalisme &amp; style suisse. <em>Gardé</em> : espace, hiérarchie, hairlines.</li>
                <li><strong>Motif</strong> « Feature-Rich Showcase » (page d’atterrissage). <em>Rejeté</em> : Certifizer est un outil quotidien, pas une page marketing ; une seule action par écran.</li>
                <li><strong>Couleurs</strong> indigo #4F46E5 + orange #EA580C. <em>Rejeté</em> : l’orange CTA entre en conflit avec le palier « en construction » ; un seul accent cobalt, les paliers gardent leurs couleurs.</li>
                <li><strong>Typographie</strong> Baloo 2 / Comic Neue (enfants). <em>Rejeté</em> : adultes, institutions, examen professionnel. Fraunces + Inter + JetBrains Mono.</li>
                <li><strong>Motion</strong> stagger back.out(1.4). <em>Adouci</em> : fondu de 10 px, ease-out, 240 ms ; rien ne rebondit dans un miroir honnête.</li>
                <li><strong>Produit</strong> « Educational App → Claymorphism ». <em>Rejeté</em> : le relief ludique contredit « jamais un trophée ».</li>
              </ul>
            </div>
            <div className="card">
              <div className="label">Règles produit respectées</div>
              <ul className="stack-sm small" style={{ marginTop: 12 }}>
                <li>Paliers de préparation exactement comme le backend : <em>Prêt·e pour l’examen</em> ≥ 85 %, <em>Presque prêt·e</em> ≥ 70 %, <em>En construction</em> ≥ 50 %, <em>Pas encore prêt·e</em>.</li>
                <li>Carte mentale en arbre par défaut ; chemin critique sur son propre écran, 4 étapes numérotées ; Premium = flou léger + petite étiquette ; carte formateur = constellation avec zoom et export.</li>
                <li>Vouvoiement partout. « Apprentissage adaptatif de vos erreurs », jamais l’expression bannie.</li>
                <li>Cohortes génériques (PMP-2026-A), aucun nom de client. Données marquées « Exemple ».</li>
                <li>Une tâche non pratiquée compte 0 : la préparation baisse quand la couverture est honnête, et l’écran l’explique au lieu de le cacher.</li>
                <li>Bouton « Réduire les animations » + prefers-reduced-motion ; cibles tactiles ≥ 44 px ; contraste ≥ 4,5:1 ; axe à zéro constat à 1366 et 390 px.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Périmètre : chaque écran, chaque état</h2>
          <p className="muted" style={{ marginTop: 8 }}>Inventaire issu du dépôt (frontend, backend, référentiel ECO, outils, docs). Les écrans « Vue institution » et « Livrables » sont des propositions et le disent.</p>
          <div className="grid-3" style={{ marginTop: 16 }}>
            {GROUPS.filter(g => g.id !== 'lab').map(g => (
              <div key={g.id} className="card">
                <div className="label">{g.fr}</div>
                <ul className="list" style={{ marginTop: 8 }}>
                  {ROUTES.filter(r => r.group === g.id).map(r => <li key={r.hash} style={{ padding: '8px 0' }}><a href={`#${r.hash}`} style={{ fontWeight: 500, textDecoration: 'none' }}>{r.label}</a><span className="small subtle" style={{ marginLeft: 'auto' }}>{r.states.length} états</span></li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function MiniHero({ r }) {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-body)', padding: 20 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Ma préparation · Exemple</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', marginTop: 8 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1.15, fontWeight: 'var(--display-weight)' }}>Bonjour {LEARNER.name.split(' ')[0]}. Où vous en êtes : <span className={`tier-${r.label.tier}`}>{r.label.fr.toLowerCase()}</span>.</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 500 }}>Lancer la séance du jour</span>
            <span style={{ border: '1px solid var(--line-strong)', borderRadius: 999, padding: '6px 12px', fontSize: 12 }}>{LEVERS[0].fr}</span>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontVariantNumeric: 'tabular-nums' }}>{pct(r.score)}</div>
      </div>
      <div style={{ marginTop: 14, display: 'grid', gap: 6 }}>
        {r.domains.map(d => <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 40px', gap: 8, alignItems: 'center', fontSize: 11 }}><span>{d.fr}</span><Meter value={d.score} tier={d.score < 0.5 ? 1 : d.score < 0.7 ? 2 : d.score < 0.85 ? 3 : 4} thin /><span className="num" style={{ textAlign: 'right' }}>{Math.round(d.score * 100)} %</span></div>)}
      </div>
    </div>
  )
}
