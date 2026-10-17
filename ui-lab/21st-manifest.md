# 21st.dev manifest — L’Observatoire

Every UI piece in `ui-lab/` and the 21st.dev component it is built from. Generated from `src/manifest.js` (`npm run manifest`), and rendered live on the lab's **Sources 21st** screen.

Rule applied: component code copied as fetched by `get_component`, unchanged except tokens (theme.css maps shadcn variable names onto Certifizer tokens), French copy and import paths. Each file starts with its author credit.

| Piece | 21st name | Author | Demo id | 21st URL | File | Screens that use it | What changed | npm deps |
|---|---|---|---|---|---|---|---|---|
| Sidebar / navigation | Sidebar | @wensity | 31454 | https://21st.dev/@wensity/components/sidebar | `src/components/21st/sidebar.tsx` | Toutes les pages apprenant, formateur, institution | Aucun (jetons via theme.css ; chemins d’import). | @base-ui/react, @tabler/icons-react, framer-motion, clsx, tailwind-merge |
| Drawer (menu mobile, confirmations, invitation) | Drawer | @wensity | 31360 | https://21st.dev/@wensity/components/drawer | `src/components/21st/drawer.tsx` | Barre mobile (toutes pages), Réglages, Invitations, Séance | Copie FR (libellé de fermeture, titre de secours). | @base-ui/react, @tabler/icons-react |
| Command menu (⌘K) | Command Menu | @uvain | 33510 | https://21st.dev/@uvain/components/command-menu-palette | `src/components/21st/command-menu.tsx` | Global (palette ⌘K / Ctrl K, barre Labo, topbar mobile) | Copie FR (placeholder, vide, pied). | cmdk, @radix-ui/react-dialog |
| Hero (entrée, portrait) | Hero 115 | @shadcnblockscom | 608 | https://21st.dev/@shadcnblockscom/components/shadcnblocks-com-hero115 | `src/components/21st/hero-115.tsx` | Accueil, Invitation, Mon portrait, Premium | Aucun (texte et image passés en props). | @radix-ui/react-slot, class-variance-authority |
| Readiness ring / gauge | Circular Progress with Custom Color | @shadcnui-blocks | 22095 | https://21st.dev/@shadcnui-blocks/components/progress-10 | `src/components/21st/circular-progress.tsx` | Ma préparation, Fin de séance, Portrait, Cockpit | Aucun (couleur de palier via progressClassName). | — |
| Cards (KPI) | Stats Card | @ravikatiyar162 | 8321 | https://21st.dev/@ravikatiyar162/components/stats-card-1 | `src/components/21st/stats-card.tsx` | Ma préparation, Cockpit, Institution, Laboratoire | Copie FR : « from last month » → prop changeNote ; emerald → jeton tier-3. | — (Card du registre shadcn) |
| Cards (contenu) | Card (registre shadcn livré avec Stats Card / Carousel) | @shadcn | 8321 | https://21st.dev/@shadcn/components/card | `src/components/ui/card.tsx` | Toutes | CardTitle h3 → div (comme shadcn actuel) : les écrans posent eux-mêmes h1/h2. | — |
| Progress (domaines, séance) | Progress | @jshguo | 11889 | https://21st.dev/@jshguo/components/interfaces-progress | `src/components/21st/progress.tsx` | Séance, Parcours, Portrait, Réglages | Aucun. | @radix-ui/react-progress |
| Progress par compétence | Skills Progress Dashboard | @shadcnspace | 19138 | https://21st.dev/@shadcnspace/components/progress-03 | `src/components/21st/skills-progress.tsx` | Ma préparation, Portrait, Cockpit | Copie FR ; tableau codé en dur → prop stats (même forme) ; slot progress-track → progress (Progress jshguo) ; aria-label sur chaque barre ; badge teal → jetons palier. | class-variance-authority (Badge) |
| Tabs | Animated Tabs | @educalvolpz | 24930 | https://21st.dev/@educalvolpz/components/animated-tabs | `src/components/21st/animated-tabs.tsx` | Barre d’onglets mobile, Cockpit, Carte mentale, Parcours, Chat | Aucun (jeton --color-brand défini). | motion |
| Accordion | Basic Accordion | @felipemenezes098 | 24849 | https://21st.dev/@felipemenezes098/components/accordion-01 | `src/components/21st/accordion.tsx` | Ma préparation (questions manquées), Parcours, Réglages, Premium, Sources | Copie FR ; 3 items codés en dur → prop items (même balisage). | @radix-ui/react-accordion, lucide-react |
| Popover | Popover | @originui | 403 | https://21st.dev/@originui/components/popover | `src/components/21st/popover.tsx` | Ma préparation (paliers), Carte mentale, Cockpit | Aucun. | @radix-ui/react-popover |
| Chat input | Prompt Input | @tinkerers-labs | 31882 | https://21st.dev/@tinkerers-labs/components/prompt-input | `src/components/21st/prompt-input.tsx` | Expliquer, Cas d’examen, Relier, Cas réel | Copie FR (placeholder, libellés). | — |
| Quiz options | Question Tool | @serafimcloud | 12421 | https://21st.dev/@serafimcloud/components/question-tool | `src/components/21st/question-tool.tsx` | Lecteur de séance, Me tester, Composer une séance | Copie FR (libellés, placeholders, aria) ; jetons (palette neutral → jetons Certifizer). | clsx, tailwind-merge |
| Progress / stepper | Vertical Titled Stepper | @sean0205 | 29815 | https://21st.dev/@sean0205/components/c-stepper-15 | `src/components/21st/vertical-stepper.tsx` | Chemin critique, Email de récupération, Lien magique | Copie FR ; étapes codées en dur → props steps/value ; stepper.tsx du registre : rôles tablist/tab (invalides pour axe, les items enveloppent les déclencheurs) → group + aria-current. | radix-ui, lucide-react, class-variance-authority |
| Timeline | Process Timeline | @shadcnui-blocks | 28381 | https://21st.dev/@shadcnui-blocks/components/timeline-05 | `src/components/21st/process-timeline.tsx` | Parcours ECO, Relier à mon projet (livrables), Réglages (délai de grâce) | Copie FR ; étapes codées en dur → prop steps. | lucide-react |
| Chart — radar | Radar Chart | @heygaia | 29830 | https://21st.dev/@heygaia/components/radar-chart | `src/components/21st/radar-chart.tsx` | Mon portrait, Cockpit | Jetons (palette → couleurs des domaines ECO). | recharts |
| Chart — courbe | Line Chart | @heygaia | 29015 | https://21st.dev/@heygaia/components/line-chart | `src/components/21st/line-chart.tsx` | Mon portrait (trajectoire), Cockpit, Institution | Jetons (palette → couleurs des domaines ECO). | recharts |
| Heatmap | Heat Calendar | @ssychui | 30542 | https://21st.dev/@ssychui/components/heat-calendar | `src/components/21st/heat-calendar.tsx` | Mon portrait (activité), Cockpit (heatmap) | Copie FR (jours, aria-label). | framer-motion |
| Chart — anneau | Chart Donut Halftone | @nikolas-sapa | 32787 | https://21st.dev/@nikolas-sapa/components/chart-donut-halftone | `src/components/21st/donut-halftone.tsx` | Fin de séance, Cockpit (groupes), Institution | Copie FR (titre par défaut, aria-label). | — |
| Data table | Data Table | @ephraimduncan | 28327 | https://21st.dev/@ephraimduncan/components/table-05 | `src/components/21st/data-table.tsx` | Sources 21st, Cockpit (cohorte, qualité), Invitations, Institution | Copie FR ; colonnes/données → props (défauts = celles de la démo) ; couleurs de statut → jetons de palier ; trigger render= → asChild (radix) ; aria-label sur le sélecteur de taille de page. | @tanstack/react-table, @radix-ui/react-checkbox, @radix-ui/react-dropdown-menu, @radix-ui/react-select |
| Constellation / graph | Knowledge Graph | @heygaia | 31573 | https://21st.dev/@heygaia/components/knowledge-graph | `src/components/21st/knowledge-graph.tsx` | Carte mentale (26 tâches), Cockpit (constellation) | Jetons (surfaces zinc, légende, liens → jetons Certifizer) ; la légende prend la couleur du nœud ; libellés de type laissés en français. | d3 |
| Arbre (13 thèmes) | Branching Tree Nav | @arunachalam | 25276 | https://21st.dev/@arunachalam/components/branching-tree-nav | `src/components/21st/branching-tree-nav.tsx` | Carte mentale (arbre), Parcours ECO, Me tester | Jetons (badge bleu → accent) ; a11y : racine nav→div, en-têtes de section = treeitem, contenu replié = group + inert. | framer-motion, lucide-react |
| Empty state | Empty State | @serafimcloud | 1435 | https://21st.dev/@serafimcloud/components/empty-state | `src/components/21st/empty-state.tsx` | Portrait vide, Cohorte vide, Invitations vides, Me tester, Composer | Aucun. | @radix-ui/react-slot |
| Loading state | Skeleton | @shadcn | 1588 | https://21st.dev/@shadcn/components/skeleton | `src/components/21st/skeleton.tsx` | Tous les états « Chargement » | Aucun. | — |
| Error state | Alert | @shadcn | 1170 | https://21st.dev/@shadcn/components/alert | `src/components/21st/alert.tsx` | Tous les états « Erreur », Accès, Réglages | Aucun. | class-variance-authority |
| Toasts | Sonner Toast | @isaiahbjork | 27363 | https://21st.dev/@isaiahbjork/components/primitive-sonner | `src/components/21st/sonner-toast.tsx` | Global ; Réglages, Invitations, Séance | Copie FR ; BjorkButton (non livré) → Button du registre ; prop showButton ; jetons bjork-* aliasés. | sonner, next-themes |
| Language switch / segmented | Segmented Control | @ddoemonn | 23552 | https://21st.dev/@ddoemonn/components/segmented-control | `src/components/21st/segmented-control.tsx` | Réglages (FR/EN), Barre Labo (direction), Me tester, Carte mentale | Aucun. | motion |
| Switch | Switch | @jshguo | 11886 | https://21st.dev/@jshguo/components/interfaces-switch | `src/components/21st/switch.tsx` | Barre Labo (réduire les animations), Réglages | Aucun. | @radix-ui/react-switch |
| Carousel | Carousel | @shadcn | 813 | https://21st.dev/@shadcn/components/carousel | `src/components/21st/carousel.tsx` | Laboratoire (directions), Premium, Ma préparation (réflexes) | Copie FR (libellés sr-only). | embla-carousel-react |
| Scroll reveal | Scroll Reveal | @cnippet-dev | 18654 | https://21st.dev/@cnippet-dev/components/scroll-reveal-2 | `src/components/21st/scroll-reveal.tsx` | Laboratoire, Ma préparation, Portrait, Premium | Aucun. | motion |
| Boutons, badges, champs, select, tableau, menu | Registre shadcn livré par 21st avec les démos ci-dessus | @shadcn | 28327 | https://21st.dev/@shadcn | `src/components/ui/*.tsx` | Toutes | Aucun, sauf table.tsx : conteneur défilant focalisable (tabIndex, role=region). | — |

## Fetched but not usable as shipped

| 21st name | Author | Demo id | Why | Replaced by |
|---|---|---|---|---|
| Animated Sidebar | @starc007 | 29334 | Dépend de shared-layout-bg / ease non livrés. | Sidebar (wensity, 31454) |
| Choicebox | @halaska-studio | 34718 | Dépend de kit-theme (halaska) non livré. | Question Tool (serafimcloud, 12421) |
| Switch | @halaska-studio | 34784 | Dépend de kit-theme (halaska) non livré. | Switch (jshguo, 11886) |
| Progress Metric Card | @makviesainte | 15024 | Dépend de metric-chart / controls non livrés. | Stats Card (8321) + Skills Progress (19138) |
| Sheet (Different Directions) | @shadcnspace | 25002 | Dépend de sheet-01-utils/sheet non livré. | Drawer (wensity, 31360) |
| Questionnaire | @uiable | 28569 | Dépend de @shadcn/react/questionnaire non livré. | Question Tool (serafimcloud, 12421) |

## Hand-built (21st has nothing usable)

| Piece | File | Why |
|---|---|---|
| Voile Premium (flou léger + étiquette) | `src/screens/_shared.jsx` | Motif produit Certifizer (contenu réel visible, jamais un écran verrouillé) ; aucun composant 21st ne fait ce voile. |
| Grille de page, barre « Labo » et chrome du laboratoire | `src/styles/lab.css, src/App.jsx` | Outillage du laboratoire, pas un composant produit. |
| Photos Unsplash (accueil, portrait) | `src/screens/Acces.jsx, src/screens/Portrait.jsx` | images.unsplash.com et cdn.21st.dev restent refusés par le proxy réseau (CONNECT 403) : emplacements et textes alternatifs en place, image à insérer. |

## Direction « Chantier » — story effects (chantier.html)

The approved « Chantier » direction (`ui-lab/chantier.html`, source `src/chantier/`) tells its entry page with GSAP ScrollTrigger + Lenis. Each effect was searched, fetched with `get_component` and adapted from the real code (kept verbatim in `.21st-raw/components/`); the adaptation is the port from Motion/framer-motion springs to GSAP scrubs, with the original values.

| Piece | 21st name | Author | Demo id | 21st URL | File | Screens that use it | What changed |
|---|---|---|---|---|---|---|---|
| Barre de progression de lecture | Scroll Progress | @cnippet-dev | 18715 | https://21st.dev/@cnippet-dev/components/scroll-progress | `src/chantier/components/21st/ScrollProgress.jsx` | Accueil (récit) | useScroll + useSpring(damping 50, stiffness 200) → ScrollTrigger start 0 / end max + gsap.quickTo(0,5 s, power3.out) pour suivre Lenis ; classes Tailwind → .progress ; masquée en mouvement réduit. |
| Apparition au défilement (titres, CTA, cohorte) | Reveal | @asanshay | 19240 | https://21st.dev/@asanshay/components/reveal | `src/chantier/components/21st/Reveal.jsx` | Accueil (récit) : « Pour qui », « Pour les formateurs », appel final | Mêmes valeurs (opacity 0 → 1, y 40 → 0, blur 10 px → 0, 0,6 s, délai index × 0,15 s, une seule fois) sur un ScrollTrigger « top 80% » ; prop `as` ; état final en mouvement réduit. |
| Film qui grandit au défilement | Video Scroll Hero | @isaiahbjork | 7512 | https://21st.dev/@isaiahbjork/components/video-scroll-hero | `src/chantier/components/21st/VideoScrollHero.jsx` | Accueil (récit) : film site.mp4 après le hero | Conteneur 200vh + scène sticky conservés ; le listener scroll (scale = 0,25 + progress × 0,75) → ScrollTrigger scrub 0,8 ; <video autoplay> → <Film> (muet, en boucle, poster, pause hors écran, poster seul en mouvement réduit) ; légende en slot ; Tailwind → .vsh. |
| Livrables qui défilent à l’horizontale | Horizontal Scroll Gallery | @pulkitxm | 20139 | https://21st.dev/@pulkitxm/components/horizontal-scroll-gallery | `src/chantier/components/21st/HorizontalScrollGallery.jsx` | Accueil (récit) : « Réviser en produisant du vrai travail » | Enveloppe 300 % + zone sticky conservées ; le listener scroll (translateX = −progress × (largeur piste − viewport)) → ScrollTrigger scrub 0,6 avec invalidateOnRefresh, exposé en containerAnimation aux cartes ; slot `intro` au-dessus de la piste ; défilement latéral natif en mouvement réduit. |
| Photos qui s’ouvrent (masque) | Reveal Image Mask | @daiwiikharihar | 10905 | https://21st.dev/@daiwiikharihar/components/reveal-image-mask | `src/chantier/components/21st/RevealImageMask.jsx` | Accueil (récit) : « Pour qui » (3 photos) | Même interpolation clip-path (rounded : inset 30 % → 0, rayon 10 % → 0 ; circle : 16 % → 75 %) et mêmes bornes (start 85 % / end 15 %) ; useSpring(170/24) → scrub 0,8 ; le bloc titre/légende devient un <figcaption> ; Tailwind → .person. |
| Photo qui s’élargit au défilement | Scroll Reveal Image | @unlumen | 24466 | https://21st.dev/@unlumen/components/scroll-reveal-image | `src/chantier/components/21st/ScrollRevealImage.jsx` | Accueil (récit) : photo formatrice | Trois pistes conservées (largeur 40 % → 100 %, échelle 1,6 → 1, rayon 0 → 22 px à partir de 0,5) sur un seul ScrollTrigger scrub 1 (≈ le ressort 120/80), mêmes bornes « start end » → « start start » ; next/image → <img> ; état final en mouvement réduit. |

Working screens (Aujourd'hui, Parcours, S'entraîner, Mon projet, Portrait) use one quiet GSAP entrance each and no film, per MEDIA.md.

Raw fetched payloads (component, demo, registry files) are kept in `ui-lab/.21st-raw/` for diffing against the files above.
