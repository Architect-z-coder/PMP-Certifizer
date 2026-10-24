# Interface « Chantier » (ui2) — note de passation

## Allumer / éteindre
- Vercel → Project → Settings → Environment Variables : `VITE_UI` = `chantier` sur l'environnement **Preview** seulement, puis redéployer (Vite fige la variable au build). **Production ne doit pas recevoir `VITE_UI`** : sans elle, l'interface actuelle est servie, inchangée.
- `VITE_API_URL` : si elle manque (Preview), ui2 appelle `https://pmp-cerifizer.onrender.com` (`ui2/apiBase.js`, repli posé sur `fetch` dans ui2 seulement ; `api.js` n'est pas modifié). Si elle est présente, elle est utilisée telle quelle.
- CORS côté Render : `CORS_ORIGINS` ne contient que le domaine de production ; ajouter l'origine de la Preview (ex. `https://pmp-certifizer-git-ui-lab-<scope>.vercel.app`, sans barre finale, séparée par une virgule), sinon le navigateur bloque les appels API depuis la Preview.
- En local : `cd frontend && VITE_UI=chantier VITE_API_URL=http://localhost:8000 npm run dev` (ou `frontend/.env`, voir `.env.example`).
- Le bascule est dans `frontend/src/main.jsx` (seul fichier existant modifié) : `VITE_UI === "chantier"` charge `ui2/App2.jsx` paresseusement, sinon `App.jsx`. Le build par défaut n'embarque ni le code ni la CSS de ui2 (vérifié).

## Contenu de cette tranche
- Quatre écrans sur données réelles : **Me tester** (`screens/Quiz.jsx` : question seule, séance de 10, séance assignée), **Aujourd'hui** (`screens/Today.jsx`), **Carte et chemin critique** (`screens/MasteryMap.jsx` + `stations.js`), **Mes faiblesses** (`screens/Weaknesses.jsx`).
- Une conversation (`screens/Chat.jsx`) pilotée par `mode` : Expliquer, Cas d'examen, Relier à mon projet, Cas réel. Même charge utile que `send()` aujourd'hui (`mode`, `focus`, `lang`, `project_context`, `lens`).
- Accès (`Access.jsx`) : mêmes fonctions et mêmes clés `cz_learner`, `cz_name`, `cz_role` ; nom, code de classe, lien magique, lien d'invitation. Clés ajoutées : `cz_cohort` (code affiché dans la barre), `cz_ui2_lang`, `cz_ui2_project`.
- Scènes terrain, Préparation, Portrait, Réglages, cockpit formateur : « bientôt dans cette version », avec retour vers Aujourd'hui.
- Menu : sur téléphone et tablette, le panneau tient dans l'écran et le bloc du bas (nom, langue, Présentation, changer d'utilisateur) reste visible.
- `tokens.css` = jetons de la maquette · `chantier.css` = composants partagés · `engine.js` = lecture des charges utiles · `motion.js` = GSAP + `prefers-reduced-motion`.

## Présentation (page d'entrée)
- `screens/Landing.jsx` (+ `landing-parts.jsx`, `landing.css`) : la page d'entrée Chantier de `ui-lab/chantier.html` (`Story.jsx`), même texte, mêmes sections, mêmes images et films, même mouvement GSAP (ScrollTrigger). Lenis (défilement doux) n'est pas repris : ce serait une nouvelle dépendance.
- Qui la voit : toute personne non connectée (pas de `cz_learner`). Une personne connectée va directement à Aujourd'hui. Un lien magique ou d'invitation ouvre directement l'accès.
- Chaque appel à l'action ouvre l'écran d'accès existant (`Access.jsx`) : « Commencer » et « Faire mon diagnostic » sur l'entrée par nom, « J'ai un code de classe » sur le code de classe, « Accès formateur » et « Créer une séance ciblée » sur l'accès formateur. Un lien « ← Présentation » ramène à la page.
- « J'ai un code de classe » est ajouté sous le bouton principal et dans l'appel final (absent de la page ui-lab).
- Connecté : menu → « Présentation » (`#/presentation`) ; ses boutons mènent alors à Aujourd'hui, pas à l'accès.
- Honnêteté : les chiffres d'exemple portent « Exemple » ; l'indice d'exemple est tronqué (54, pas 55) et les gains du chemin critique sont les leviers de l'apprenant d'exemple, tronqués. Le pied de page « Rien n'est enregistré » devient « Les chiffres de cette page sont des exemples. Votre indice réel ne vient que de vos réponses. »
- Textes qui n'étaient qu'en français dans ui-lab (Gantt, réseau, livrables, cohorte, pied de page) : version anglaise ajoutée.
- Mouvement réduit : réglage du système, ou bouton « Réduire les animations » en pied de page (`cz_ui2_reduced`). Films remplacés par leurs affiches, scènes à l'état final.
- Deux défauts hérités de ui-lab corrigés : la galerie des livrables défile vraiment (hauteur 300vh au lieu de 300 %, qui retombait à « auto »), et les animations des photos, de la galerie et de l'image formateur se mesurent après les scènes épinglées (elles jouaient hors écran).
- Médias (`frontend/public/ui2/`, 12 fichiers, 1 093 Ko au total contre 1 864 Ko dans ui-lab) : films ré-encodés H.264 sans son (site 318 Ko, pm 158 Ko, board 148 Ko en 960 px), photos WebP 900 px qualité 72, affiches inchangées. Vite copie `public/` dans tous les builds : le build par défaut contient donc ces 12 fichiers statiques, mais aucun code ui2.

## Arrondis
- Tous les pourcentages de ui2 (indice de la barre, domaines, tâches) sont désormais tronqués, jamais arrondis au-dessus (`engine.js` `pct`) : 33,51 s'affiche 33. La page de présentation promet que l'indice n'est jamais arrondi pour rassurer.

## Stations → tâches ECO (`stations.js`, premier jet à relire)
| Station | Tâches pmp.js | Ids moteur (`top_levers`) | Zone « Me tester » |
|---|---|---|---|
| N1 Intégration & charte | pr1, pr10 | PR1, PR10 | integration |
| N2 Périmètre & WBS | pr2 | PR2 | scope |
| N3 Échéancier | pr8 | PR8 | schedule |
| N4 Budget & valeur acquise | pr6, pr4, pr5 | PR6, PR4, PR5 | cost |
| N5 Qualité & communications | pr7, pe8, pr9 | PR7, PE8, PR9 | quality |
| N6 Risques | be4 | BE5, BE4 | risk |
| N7 Parties prenantes | pe5 | PE4, PE5, PE6 | stakeholder |
| N8 Gérer les changements | be3, be6 | BE3, BE7 | integration |
| N9 Équipe & conflits | pe2, pe3, pe4, pe6, pe1, pe7 | PE1, PE2, PE3, PE7 | pe_conflict |
| N10 Gouvernance & conformité | be1, be2, be8 | BE1, BE2, BE8 | be_governance |
| N11 Valeur & bénéfices | be7, pr3, be5 | PR3, BE6 | be_value |
| N12 Examen blanc · jugement | — | — | — (bientôt) |

Attention : les 26 tâches de `pmp.js` (ECO_TASKS) ne sont pas celles du référentiel canonique du moteur (`backend/reference/pmp_eco_2026_canonical.json`) sur sept tâches (pe4–pe6, be4–be7). Les ids moteur sont appariés aux stations par le sens, pas par le numéro. À arbitrer : aligner `pmp.js` sur le canonique.

## Ce que la maquette montre et que l'API ne fournit pas encore
- Remplissage « théorie / pratique réelle » des nœuds → nœuds acquis dessinés pleins ; il faudrait un score de pratique par tâche (ex. `tasks[].practice_score`).
- Genre de faiblesse (confusion, lacune…) → « Genre et cause : bientôt » ; il faudrait `top_levers[].kind`.
- Cause en amont d'une faiblesse → absente ; il faudrait `top_levers[].cause_task`.
- Date de dernière réponse par tâche → seulement `stale_mastered[].level` (plus de 14 / 30 jours) ; il faudrait `last_practiced_at` par tâche (existe dans `/api/eco/mastery`, non appelé par `api.js`).
- Données de scènes terrain → aucun endpoint ; écran « bientôt ».
- Intervalle sur l'indice (51–64 dans la maquette) → « intervalle : bientôt » ; il faudrait `readiness.interval {low, high}`.
- Total de réponses et validations sur la carte de l'indice → remplacé par les tâches couvertes (17/26) ; il faudrait `readiness.evidence {answers, validations}`.
- Journal « ce qui a changé aujourd'hui » et horodatages « redessinée il y a 2 min » → omis ; il faudrait un journal d'événements.
- Examen blanc (station N12) → verrou « bientôt » ; aucun endpoint.
- Durées (« 12 min ») et remède par faiblesse → omis ; il faudrait `session.estimated_minutes`, un remède par levier.
- Code de cohorte → absent de `/api/me` ; mémorisé à l'entrée seulement (`cz_cohort`), donc pas de chip pour un profil connecté avant cette version.
- Maîtrise par tâche officielle → `/api/eco/mastery` existe côté backend mais pas dans `api.js` ; ui2 dérive la maîtrise par tâche comme l'interface actuelle (refs PMBOK puis zone), ce n'est pas la valeur du moteur. La route ambre, elle, vient bien du moteur (`top_levers`).

## Vérifications faites
- `npm run build` passe avec et sans `VITE_UI=chantier`.
- Le backend Render était inaccessible depuis l'environnement de travail (proxy) : backend lancé en local sur une base SQLite jetable, apprenant de test `apprenant-ui2` nourri de ~120 réponses par l'API (chiffres réels du moteur, pas vos données). Captures : `frontend/ui-lab-shots/ui2/` (1440×900 et 390×844).
- Trois questions répondues dans Me tester : correction et justification affichées ; indice 34 → 35 après rechargement d'Aujourd'hui.
- `prefers-reduced-motion` : zéro animation, zéro style inline sur les quatre écrans.
- Console : la seule entrée est le 404 de `/favicon.ico` demandé par le navigateur, déjà présent dans l'interface actuelle (`index.html` non modifiable dans cette tranche).
- Chat : pas de clé LLM en local, donc seul le chemin d'erreur a été vu ; la réponse réelle reste à vérifier sur la Preview.

## Points incertains
- La correspondance stations ↔ tâches (N4 avec ressources et approvisionnements, N6 avec BE4 obstacles, N8 qui teste la zone `integration`, N11) est un premier jet.
- Faiblesses : l'anneau « en cours » est teal (`--process`) comme demandé ; `--warn` collerait mieux aux puces « en cours » ailleurs.
- Chat : `project_context` et `lens` sont envoyés dans tous les modes, comme `send()` aujourd'hui.
- Carte à 390 px : les étiquettes du SVG sont minuscules ; la carte sombre porte le texte.
- La quota anti-abus (50 réponses/jour, plan gratuit) est affichée telle que le backend la renvoie.
